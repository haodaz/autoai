'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang?: string;
  className?: string;
}

export default function VoiceInputButton({ onTranscript, lang = 'zh-CN', className = '' }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[VoiceInput] Error:', event.error);
      if (event.error !== 'no-speech') {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => { recognition.abort(); };
  }, [lang]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.warn('[VoiceInput] Start error:', e);
      }
    }
  }, [listening]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`relative flex items-center justify-center transition-all duration-200 shrink-0 ${
        listening
          ? 'text-red-500'
          : 'text-gray-400 hover:text-gray-600'
      } ${className}`}
      title={listening ? 'Stop' : 'Voice input'}
    >
      {listening ? (
        <>
          <Square className="w-4 h-4 fill-current" />
          <span className="absolute inset-[-4px] rounded-full border-2 border-red-400 animate-ping opacity-20" />
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
