'use client';

import { useState, useRef } from 'react';
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

  return (
    <div className="flex flex-col gap-4 w-full text-center">
      <div className="text-base sm:text-lg font-semibold text-[#3b2a63]">
        Talk to Sunny just like Talking Tom, or play funny sound effects!
      </div>

      {/* Voice Record / Mimic Section */}
      <div className="p-4 rounded-3xl bg-pink-100/90 border-4 border-pink-300 flex flex-col items-center">
        <div className="text-4xl mb-2">
          {isPlayingBack ? '🗣️' : isRecording ? '🎙️' : '🎤'}
        </div>
        <h3 className="font-bold text-lg text-pink-900">Talking Sloth Mimic</h3>
        <p className="text-xs sm:text-sm font-semibold opacity-80 mt-1 mb-3">
          {isPlayingBack
            ? 'Sunny is repeating what you said in a squeaky sloth voice!'
            : isRecording
            ? 'Listening... say something into your microphone!'
            : 'Hold or tap the mic button to speak, and Sunny repeats it back!'}
        </p>

        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isPlayingBack}
            className="btn-chunky green px-6 py-3 text-lg font-bold flex items-center gap-2 animate-glow"
          >
            🎙️ Start Talking
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="btn-chunky yellow px-7 py-3 text-lg font-bold flex items-center gap-2 animate-pulse"
          >
            ⏹️ Stop & Listen to Sunny!
          </button>
        )}

        {micError && (
          <div className="mt-2 text-xs font-semibold text-pink-700 bg-white/70 px-3 py-1.5 rounded-xl border border-pink-300">
            {micError}
          </div>
        )}
      </div>

      {/* Silly Soundboard */}
      <div>
        <div className="font-bold text-base text-[#3b2a63] mb-2">
          Sunny&apos;s Silly Soundboard:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={tellJoke}
            className="btn-chunky purple p-3 flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl">🤣</span>
            <span className="text-xs font-bold">Tell Joke</span>
          </button>

          <button
            onClick={sillyGiggle}
            className="btn-chunky yellow p-3 flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl">🤪</span>
            <span className="text-xs font-bold">Giggle</span>
          </button>

          <button
            onClick={makeSneeze}
            className="btn-chunky blue p-3 flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl">🤧</span>
            <span className="text-xs font-bold">Sloth Sneeze</span>
          </button>

          <button
            onClick={singSong}
            className="btn-chunky green p-3 flex flex-col items-center justify-center gap-1"
          >
            <span className="text-3xl">🎶</span>
            <span className="text-xs font-bold">Sing Song</span>
          </button>
        </div>
      </div>
    </div>
  );
}
