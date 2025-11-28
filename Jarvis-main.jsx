import React, { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import HologramVisual from '@/components/jarvis/HologramVisual';
import VoiceHandler from '@/components/jarvis/VoiceHandler';
import ChatInterface from '@/components/jarvis/ChatInterface';
import TaskProgress from '@/components/jarvis/TaskProgress';
import WebcamCapture from '@/components/jarvis/WebcamCapture';
import ModelViewer from '@/components/jarvis/ModelViewer';

// System prompt for JARVIS - handles multi-step commands
const JARVIS_SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant modeled after Tony Stark's AI from Iron Man. 

PERSONALITY:
- Professional yet warm, with subtle British wit
- Highly intelligent and analytical
- Proactive in offering solutions
- Calm under pressure
- Address the user as "sir" or "ma'am" occasionally

CAPABILITIES:
You can handle complex, multi-step commands. When given a complex request, you MUST:
1. Analyze the request and break it into logical steps
2. Execute or describe each step clearly
3. Provide progress updates
4. Synthesize results at the end

MULTI-STEP COMMAND DETECTION:
If a command contains multiple actions (connected by "and", "then", commas, or implied sequences), treat it as a multi-step task.

Examples of multi-step commands:
- "Design a chair, optimize it, and prepare for printing" → 3 steps
- "Create a logo and then generate variations" → 2 steps  
- "Analyze this data, find patterns, and summarize findings" → 3 steps

RESPONSE FORMAT:
For simple queries: Respond naturally and concisely.
For complex/multi-step commands: You MUST structure your response to show step-by-step execution.

IMPORTANT RULES:
1. Never break character
2. Be concise but thorough
3. Show your reasoning for complex tasks
4. If you can't do something, explain what would be needed
5. Always complete all steps in a multi-step request`;

export default function Jarvis() {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [textToSpeak, setTextToSpeak] = useState('');
  const [currentTask, setCurrentTask] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [alertMode, setAlertMode] = useState(false);
  const [displayModel, setDisplayModel] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [modelExpanded, setModelExpanded] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const processingRef = useRef(false);

  // Check if user is asking for 3D model generation
  const isModelRequest = (text) => {
    const lower = text.toLowerCase();
    return (lower.includes('design') || lower.includes('create') || lower.includes('make') || 
            lower.includes('build') || lower.includes('generate') || lower.includes('show me')) &&
           (lower.includes('3d') || lower.includes('model') || lower.includes('chair') || 
            lower.includes('table') || lower.includes('box') || lower.includes('object') ||
            lower.includes('furniture') || lower.includes('shape'));
  };

  // Analyze if command is multi-step - simple keyword detection first
  const analyzeCommand = useCallback(async (command) => {
    const lowerCommand = command.toLowerCase();
    
    // Quick check for multi-step indicators
    const hasMultiStep = lowerCommand.includes(' and ') || 
                         lowerCommand.includes(' then ') || 
                         lowerCommand.includes(', then') ||
                         (lowerCommand.match(/,/g) || []).length >= 2;
    
    if (!hasMultiStep) {
      return { is_multi_step: false, complexity: 'simple', steps: [] };
    }

    // Only call LLM for complex commands
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Break this command into steps: "${command}"
Return a JSON with: steps (array of step descriptions)`,
      response_json_schema: {
        type: 'object',
        properties: {
          steps: { type: 'array', items: { type: 'string' } }
        },
        required: ['steps']
      }
    });

    return {
      is_multi_step: analysis.steps && analysis.steps.length > 1,
      steps: analysis.steps || [],
      complexity: 'complex'
    };
  }, []);

  // Execute a single step
  const executeStep = useCallback(async (step, stepIndex, allSteps, context, originalCommand) => {
    const stepPrompt = `${JARVIS_SYSTEM_PROMPT}

CURRENT TASK: "${originalCommand}"
TOTAL STEPS: ${allSteps.length}
CURRENT STEP: ${stepIndex + 1} of ${allSteps.length}
STEP TO EXECUTE: "${step}"

PREVIOUS CONTEXT:
${context || 'This is the first step.'}

Execute this step thoroughly. Provide:
1. What you're doing
2. The result/output
3. Any relevant details for the next step

Be specific and actionable. If this involves design/creation, describe the result in detail.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: stepPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          step_result: { type: 'string' },
          details: { type: 'string' },
          next_step_context: { type: 'string' },
          success: { type: 'boolean' }
        },
        required: ['step_result', 'success']
      }
    });

    return result;
  }, []);

  // Main message handler
  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || processingRef.current) return;

    processingRef.current = true;
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setVoiceInput('');

    try {
      // Save user message
      await base44.entities.Conversation.create({
        role: 'user',
        content,
        session_id: sessionId
      });

      // Analyze the command - with fallback
      let analysis = { is_multi_step: false, complexity: 'simple', steps: [] };
      
      try {
        analysis = await analyzeCommand(content);
      } catch (analysisError) {
        console.log('Skipping analysis, using simple response');
      }

      let assistantContent = '';

      if (analysis && analysis.is_multi_step && analysis.steps && analysis.steps.length > 1) {
        // Multi-step execution
        const steps = analysis.steps.map((desc, idx) => ({
          id: idx + 1,
          description: desc,
          status: 'pending',
          result: ''
        }));

        const task = {
          session_id: sessionId,
          command: content,
          steps,
          current_step: 0,
          status: 'in_progress'
        };

        setCurrentTask(task);

        // Execute each step
        let context = '';
        const stepResults = [];

        for (let i = 0; i < steps.length; i++) {
          // Update current step status
          setCurrentTask(prev => ({
            ...prev,
            current_step: i,
            steps: prev.steps.map((s, idx) => 
              idx === i ? { ...s, status: 'in_progress' } : s
            )
          }));

          // Execute step
          const stepResult = await executeStep(
            steps[i].description,
            i,
            steps,
            context,
            content
          );

          // Update step as completed
          setCurrentTask(prev => ({
            ...prev,
            steps: prev.steps.map((s, idx) => 
              idx === i ? { 
                ...s, 
                status: stepResult.success ? 'completed' : 'failed',
                result: stepResult.step_result
              } : s
            )
          }));

          context = stepResult.next_step_context || stepResult.step_result;
          stepResults.push(stepResult);

          // Small delay for visual feedback
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Generate final summary
        const summaryPrompt = `${JARVIS_SYSTEM_PROMPT}

COMPLETED TASK: "${content}"

STEP RESULTS:
${stepResults.map((r, i) => `Step ${i + 1}: ${r.step_result}`).join('\n')}

Provide a concise final summary of what was accomplished. Be professional and conclude the task properly.`;

        const summary = await base44.integrations.Core.InvokeLLM({
          prompt: summaryPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              next_actions: { type: 'array', items: { type: 'string' } }
            },
            required: ['summary']
          }
        });

        assistantContent = summary.summary;

        // Update task as completed
        setCurrentTask(prev => ({
          ...prev,
          status: 'completed',
          final_result: assistantContent
        }));

        // Clear task after delay
        setTimeout(() => setCurrentTask(null), 5000);

      } else {
        // Simple response
        const recentMessages = [...messages.slice(-6), userMessage];
        const contextPrompt = recentMessages
          .map(m => `${m.role === 'user' ? 'User' : 'Jarvis'}: ${m.content}`)
          .join('\n');

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are JARVIS, an advanced AI assistant inspired by Iron Man's AI. You are helpful, intelligent, witty, and professional. Address the user as "sir" occasionally.

CONVERSATION:
${contextPrompt}

Respond helpfully and concisely to the user's latest message.`
        });

        // Handle both string and object responses
        if (typeof response === 'string') {
          assistantContent = response;
        } else if (response && response.response) {
          assistantContent = response.response;
        } else if (response) {
          assistantContent = JSON.stringify(response);
        } else {
          assistantContent = "I'm online and ready to assist, sir.";
        }
        
        // Detect if we should display a 3D model
        setDisplayModel(assistantContent);
        
        // Check if this is a 3D model request and generate model data
        if (isModelRequest(content)) {
          try {
            const modelResponse = await base44.integrations.Core.InvokeLLM({
              prompt: `Generate a 3D model JSON for: "${content}"

Output a JSON object with:
- name: string (model name)
- parts: array of parts, each with:
  - type: "box" | "cylinder" | "sphere" | "cone" | "torus"
  - position: {x, y, z} (coordinates)
  - rotation: {x, y, z} (degrees, optional)
  - For box: width, height, depth
  - For cylinder: radiusTop, radiusBottom, height
  - For sphere: radius
  - For cone: radius, height
  - color: hex color string (optional, e.g. "#00d4ff")
  - name: part name (optional)

Create a realistic model with multiple parts. Be creative but keep it simple (max 15 parts).
Example chair would have: seat (box), backrest (box), 4 legs (cylinders).`,
              response_json_schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  parts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        position: { type: 'object' },
                        rotation: { type: 'object' },
                        width: { type: 'number' },
                        height: { type: 'number' },
                        depth: { type: 'number' },
                        radius: { type: 'number' },
                        radiusTop: { type: 'number' },
                        radiusBottom: { type: 'number' },
                        color: { type: 'string' },
                        name: { type: 'string' }
                      }
                    }
                  }
                },
                required: ['name', 'parts']
              }
            });
            
            if (modelResponse && modelResponse.parts && modelResponse.parts.length > 0) {
              setModelData(modelResponse);
            }
          } catch (modelErr) {
            console.log('Model generation skipped:', modelErr);
          }
        }
      }

      const assistantMessage = { role: 'assistant', content: assistantContent };
      setMessages(prev => [...prev, assistantMessage]);
      setTextToSpeak(assistantContent);

      // Save assistant message
      await base44.entities.Conversation.create({
        role: 'assistant',
        content: assistantContent,
        session_id: sessionId
      });

    } catch (err) {
      console.error('AI Error:', err);
      const errorContent = 'I apologize, sir. I encountered a temporary system malfunction. My neural networks are recalibrating. Please try again.';
      const errorMessage = { role: 'assistant', content: errorContent };
      setMessages(prev => [...prev, errorMessage]);
      setTextToSpeak(errorContent);
      setCurrentTask(null);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [messages, sessionId, analyzeCommand, executeStep]);

  const handleVoiceTranscript = useCallback((transcript) => {
    if (transcript && transcript.trim() && !processingRef.current) {
      setVoiceInput(transcript);
      handleSendMessage(transcript);
    }
  }, [handleSendMessage]);

  const handleClearHistory = useCallback(async () => {
    setMessages([]);
    setTextToSpeak('');
    setCurrentTask(null);
    setDisplayModel(null);
    setModelData(null);
  }, []);

  // Handle webcam capture analysis
  const handleWebcamCapture = useCallback(async (imageDataUrl) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      // Upload the image first
      const blob = await fetch(imageDataUrl).then(r => r.blob());
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Analyze with AI
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are JARVIS analyzing a workspace image. Look for:
1. Electronic components, wires, circuits
2. Potential issues (wrong connections, unsafe positioning, missing parts)
3. What the user appears to be building

If you detect any problems or dangers, start with "WARNING:" and be specific.
If everything looks fine, describe what you see briefly.`,
        file_urls: [file_url]
      });

      const analysis = typeof response === 'string' ? response : response.response || 'Analysis complete.';
      
      // Check for warnings
      if (analysis.toUpperCase().includes('WARNING')) {
        setAlertMode(true);
        setTimeout(() => setAlertMode(false), 3000);
      }
      
      const userMsg = { role: 'user', content: '[Workspace Image Analysis Requested]' };
      const assistantMsg = { role: 'assistant', content: analysis };
      
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setTextToSpeak(analysis);
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMsg = { role: 'assistant', content: 'I was unable to analyze the image, sir. Please try again.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Animated background grid */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider">
            <span className="text-cyan-400">J.A.R.V.I.S</span>
          </h1>
          <p className="text-gray-400 font-mono text-sm mt-2">
            Just A Rather Very Intelligent System
          </p>
        </header>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Hologram + Voice Controls */}
          <div className="flex flex-col items-center gap-6">
            {/* Hologram */}
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-3xl" />
              <HologramVisual 
                isActive={isProcessing}
                isSpeaking={isSpeaking}
                isListening={isListening}
                alertMode={alertMode}
                displayModel={displayModel}
              />
            </div>

            {/* Webcam */}
            <div className="w-full max-w-sm">
              <WebcamCapture 
                onCapture={handleWebcamCapture}
                isEnabled={cameraEnabled}
                onToggle={setCameraEnabled}
              />
            </div>

            {/* Task Progress */}
            {currentTask && (
              <div className="w-full max-w-sm">
                <TaskProgress task={currentTask} />
              </div>
            )}

            {/* Voice Controls */}
            <div className="w-full max-w-sm p-6 bg-gray-900/50 rounded-xl border border-cyan-500/30">
              <VoiceHandler
                onTranscript={handleVoiceTranscript}
                textToSpeak={textToSpeak}
                onSpeakingChange={setIsSpeaking}
                onListeningChange={setIsListening}
                isProcessing={isProcessing}
              />
            </div>

            {/* System Status */}
            <div className="w-full max-w-sm p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
              <h4 className="text-xs text-gray-500 font-mono uppercase mb-3">System Status</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-gray-400">Core: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-gray-400">AI: {isProcessing ? 'Processing' : 'Ready'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-gray-400">Voice In: {isListening ? 'Active' : 'Standby'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-gray-400">Voice Out: {isSpeaking ? 'Active' : 'Standby'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat Interface + Model Viewer */}
          <div className="flex flex-col gap-4 h-[600px] lg:h-[700px]">
            {/* 3D Model Viewer */}
            {modelData && (
              <ModelViewer 
                modelData={modelData}
                isExpanded={modelExpanded}
                onToggleExpand={() => setModelExpanded(!modelExpanded)}
              />
            )}
            
            <div className={modelData ? 'flex-1 min-h-0' : 'h-full'}>
              <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              voiceInput={null}
              onClearHistory={handleClearHistory}
            />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-xs font-mono">
          <p>JARVIS Interface v2.0 • Multi-Step Command Processing • Optimized for Raspberry Pi</p>
        </footer>
      </div>
    </div>
  );
}
