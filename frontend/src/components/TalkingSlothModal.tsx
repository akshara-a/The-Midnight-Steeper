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
    { label: 'Tell Joke', Icon: Laugh, color: 'var(--lavender)', onClick: tellJoke },
    { label: 'Giggle', Icon: Smile, color: 'var(--daisy)', onClick: sillyGiggle },
    { label: 'Sloth Sneeze', Icon: Wind, color: 'var(--berry)', onClick: makeSneeze },
    { label: 'Sing Song', Icon: Music, color: 'var(--mint)', onClick: singSong },
  ];

  return (
    <div className="flex flex-col gap-4 w-full text-center">
      <div className="text-base sm:text-lg" style={{ color: 'var(--text)' }}>
        Talk to Sunny just like Talking Tom, or play funny sound effects!
      </div>

      {/* Voice Record / Mimic Section */}
      <div className="surface p-4 flex flex-col items-center">
        <div
          className="mb-2 flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: 'color-mix(in srgb, var(--rose) 18%, transparent)',
            color: 'var(--rose)',
          }}
        >
          <StatusIcon size={28} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
          Talking Sloth Mimic
        </h3>
        <p className="text-xs sm:text-sm mt-1 mb-3" style={{ color: 'var(--muted)' }} role="status">
          {isPlayingBack
            ? 'Sunny is repeating what you said in a squeaky sloth voice!'
            : isRecording
            ? 'Listening... say something into your microphone!'
            : 'Hold or tap the mic button to speak, and Sunny repeats it back!'}
        </p>

        {!isRecording ? (
          <button onClick={startRecording} disabled={isPlayingBack} className="btn-pill primary px-6 text-base">
            <Mic size={20} strokeWidth={1.5} aria-hidden="true" /> Start Talking
          </button>
        ) : (
          <button onClick={stopRecording} className="btn-pill primary px-6 text-base">
            <Square size={18} strokeWidth={1.5} aria-hidden="true" /> Stop &amp; Listen to Sunny
          </button>
        )}

        {micError && (
          <div
            className="mt-3 text-xs sm:text-sm px-3 py-2"
            style={{
              color: 'var(--danger)',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
            }}
            role="alert"
          >
            {micError}
          </div>
        )}
      </div>

      {/* Silly Soundboard */}
      <div>
        <div className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>
          Sunny&apos;s Silly Soundboard
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {pads.map(({ label, Icon, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="pick-card p-3 min-h-[72px] flex flex-col items-center justify-center gap-1.5"
              style={{ ['--sel' as string]: color }}
            >
              <Icon size={26} strokeWidth={1.5} aria-hidden="true" style={{ color }} />
              <span className="text-xs sm:text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
