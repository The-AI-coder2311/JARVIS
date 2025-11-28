import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  isProcessing, 
  voiceInput,
  onClearHistory 
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle voice input - removed to prevent double sends
  // Voice input is now handled directly in parent component

  const handleSend = (text) => {
    const messageText = text || input;
    if (!messageText.trim() || isProcessing) return;
    
    onSendMessage(messageText.trim());
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-xl border border-cyan-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-gray-900/80">
        <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-wider">
          Communication Log
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 font-mono text-sm py-8">
              <p>System initialized.</p>
              <p className="mt-2 text-cyan-400/60">Awaiting input...</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-lg font-mono text-sm ${
                  msg.role === 'user'
                    ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/50'
                    : 'bg-gray-800/80 text-gray-100 border border-gray-600/50'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1 uppercase">
                  {msg.role === 'user' ? 'You' : 'Jarvis'}
                </div>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-lg bg-gray-800/80 border border-gray-600/50">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-mono text-sm">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-cyan-500/30 bg-gray-900/80">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your command..."
            disabled={isProcessing}
            className="flex-1 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 font-mono focus:border-cyan-500 focus:ring-cyan-500/30"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
