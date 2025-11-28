import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VoiceHandler({ 
  onTranscript, 
  textToSpeak, 
  onSpeakingChange,
  onListeningChange,
  isProcessing 
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        onTranscript(transcript);
      }
      setIsListening(false);
      onListeningChange(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Voice error: ${event.error}`);
        setTimeout(() => setError(null), 3000);
      }
      setIsListening(false);
      onListeningChange(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange(false);
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [onTranscript, onListeningChange]);

  // Handle text-to-speech when textToSpeak changes
  useEffect(() => {
    if (!textToSpeak || !voiceEnabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to get a good voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Daniel') || 
      v.name.includes('English')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      onSpeakingChange(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeakingChange(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      onSpeakingChange(false);
    };

    synthRef.current.speak(utterance);
  }, [textToSpeak, voiceEnabled, onSpeakingChange]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
      onListeningChange(false);
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onListeningChange(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start voice input');
        setTimeout(() => setError(null), 3000);
      }
    }
  }, [isListening, onListeningChange]);

  const toggleVoice = useCallback(() => {
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      onSpeakingChange(false);
    }
    setVoiceEnabled(prev => !prev);
  }, [isSpeaking, onSpeakingChange]);

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {/* Mic Button */}
        <Button
          onClick={toggleListening}
          disabled={!speechSupported || isProcessing || isSpeaking}
          className={`w-16 h-16 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' 
              : 'bg-cyan-600 hover:bg-cyan-700'
          } ${(!speechSupported || isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>

        {/* Voice Toggle */}
        <Button
          onClick={toggleVoice}
          variant="outline"
          className={`w-12 h-12 rounded-full border-2 ${
            voiceEnabled 
              ? 'border-cyan-500 text-cyan-400 hover:bg-cyan-500/20' 
              : 'border-gray-500 text-gray-400 hover:bg-gray-500/20'
          }`}
        >
          {voiceEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 font-mono">
        {!speechSupported 
          ? 'Voice not supported' 
          : isListening 
            ? 'Listening... speak now' 
            : isProcessing
              ? 'Processing...'
              : isSpeaking
                ? 'Speaking...'
                : 'Tap mic to speak'}
      </p>
    </div>
  );
}
