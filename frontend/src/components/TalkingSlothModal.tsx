'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Laugh, Smile, Wind, Music, Volume2 } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import { speech } from '@/lib/speech';
import { SUNNY_JOKES } from '@/lib/kidsContent';

interface TalkingSlothModalProps {
  onSay: (text: string) => void;
  onSetTalking: (talking: boolean) => void;
}

export default function TalkingSlothModal({ onSay, onSetTalking }: TalkingSlothModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Talking Tom Voice Mimic: Record & Playback high-pitched!
  const startRecording = async () => {
    sounds.playClick();
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();

        if (!audioContextRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Cute high pitch speedup like Talking Tom!
        source.playbackRate.value = 1.38;
        source.connect(ctx.destination);

        setIsPlayingBack(true);
        onSetTalking(true);

        source.onended = () => {
          setIsPlayingBack(false);
          onSetTalking(false);
          sounds.playGiggle();
        };

        source.start(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setMicError('Mic access was not granted. Tap Sunny’s silly soundboard buttons below instead!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const tellJoke = () => {
    sounds.playClick();
    const joke = SUNNY_JOKES[Math.floor(Math.random() * SUNNY_JOKES.length)];
    onSay(joke);
  };

  const makeSneeze = () => {
    sounds.playClick();
    onSay('Aaaa... aaa... CHOOOO! 🤧✨ Excuse me, that was a sloth sneeze!');
  };

  const sillyGiggle = () => {
    sounds.playGiggle();
    onSay('Tee-hee-hee! Hehehe! Stop, that tickles so much! 🦥');
  };

  const singSong = () => {
    sounds.playChime();
    onSay('La la la~ 🎵 Cozy warm tea in my tummy, life as a sloth is yummy! 🎶');
  };

  const StatusIcon = isPlayingBack ? Volume2 : Mic;

  const pads = [
    { label: 'Tell Joke', emoji: '🤣', color: '#a855f7', onClick: tellJoke },
    { label: 'Giggle', emoji: '🤭', color: '#f59e0b', onClick: sillyGiggle },
    { label: 'Sloth Sneeze', emoji: '🤧', color: '#06b6d4', onClick: makeSneeze },
    { label: 'Sing Song', emoji: '🎵', color: '#10b981', onClick: singSong },
  ];

  return (
    <div className="flex flex-col gap-4 w-full text-center animate-modal">
      <div className="text-sm sm:text-base font-bold text-amber-100">
        Talk to Sunny just like Talking Tom, or tap funny sound effects! 🎙️✨
      </div>

      {/* Voice Record / Mimic Section */}
      <div className="surface p-5 flex flex-col items-center rounded-3xl">
        <div
          className={`mb-3 flex items-center justify-center rounded-3xl text-3xl shadow-lg transition-transform ${
            isRecording ? 'animate-bounce scale-110' : isPlayingBack ? 'animate-pulse scale-105' : ''
          }`}
          style={{
            width: 64,
            height: 64,
            background: isRecording
              ? 'linear-gradient(180deg, #f43f5e, #be123c)'
              : isPlayingBack
              ? 'linear-gradient(180deg, #10b981, #047857)'
              : 'linear-gradient(180deg, #ec4899, #be185d)',
            border: '2.5px solid #ffffff',
            boxShadow: '0 4px 0 rgba(0,0,0,0.3)',
          }}
        >
          {isPlayingBack ? '🔊' : isRecording ? '🔴' : '🎤'}
        </div>
        <h3 className="font-black text-xl text-white">
          Talking Sloth Mimic
        </h3>
        <p className="text-xs sm:text-sm mt-1 mb-4 font-bold text-amber-200" role="status">
          {isPlayingBack
            ? 'Sunny is repeating what you said in a squeaky sloth voice!'
            : isRecording
            ? 'Listening... say something funny into your microphone!'
            : 'Tap the big red mic to speak, and Sunny repeats it back!'}
        </p>

        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isPlayingBack}
            className="btn-pill primary px-8 text-lg font-black min-h-[58px]"
          >
            <Mic size={22} strokeWidth={2.5} aria-hidden="true" />
            Start Talking! 🎙️
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="btn-pill px-8 text-lg font-black min-h-[58px] text-white animate-pulse"
            style={{
              background: 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)',
              border: '2.5px solid #ffffff',
              boxShadow: '0 5px 0 #881337',
            }}
          >
            <Square size={20} strokeWidth={2.5} aria-hidden="true" />
            Stop &amp; Listen to Sunny! 🦥
          </button>
        )}

        {micError && (
          <div
            className="mt-3 text-xs sm:text-sm px-4 py-2 font-bold text-rose-200 bg-rose-950/60 border border-rose-400/40 rounded-2xl"
            role="alert"
          >
            {micError}
          </div>
        )}
      </div>

      {/* Silly Soundboard */}
      <div>
        <div className="font-black text-lg mb-2 text-amber-200">
          Sunny&apos;s Silly Soundboard! 🤪
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {pads.map(({ label, emoji, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="pick-card p-3 min-h-[82px] flex flex-col items-center justify-center gap-1 rounded-2xl"
              style={{ ['--sel' as string]: color }}
            >
              <span className="text-3xl animate-bounce-soft">{emoji}</span>
              <span className="text-xs sm:text-sm font-black text-white">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
