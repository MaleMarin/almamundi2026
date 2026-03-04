'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  analyzeEmotion,
  EMOTION_VISUALS,
  type EmotionState,
  type EmotionVisual,
} from '@/lib/audioEmotion';
import { registerPulse } from '@/lib/userLocation';

type Props = {
  audioUrl:  string;
  /** Callback para que el visor padre cambie su fondo según la emoción */
  onEmotion?: (visual: EmotionVisual) => void;
  /** Si se pasa, al terminar el audio se registra una huella anónima en el mapa */
  storyId?: string;
  autoPlay?: boolean;
};

export function AudioEmotionVisualizer({ audioUrl, onEmotion, storyId, autoPlay = false }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const audioRef    = useRef<HTMLAudioElement>(null);
  const animRef     = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef      = useRef<AudioContext | null>(null);
  const sourceRef   = useRef<MediaElementAudioSourceNode | null>(null);

  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [emotion,   setEmotion]   = useState<EmotionState>('silence');
  const [smoothVis, setSmoothVis] = useState<EmotionVisual>(EMOTION_VISUALS.silence);

  const formatTime = (s: number) => {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const setupAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || analyserRef.current) return;

    const audioCtx = new AudioContext();
    ctxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyserRef.current = analyser;
    sourceRef.current   = source;
  }, []);

  const startAnimation = useCallback(() => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    const audio    = audioRef.current;
    if (!canvas || !analyser || !audio) return;

    const ctx      = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const sampleRate = ctxRef.current?.sampleRate ?? 44100;
    let prevEmotion: EmotionState = 'silence';
    let emotionHoldFrames = 0;

    const draw = () => {
      analyser.getByteFrequencyData(freqData);

      const rawEmotion = analyzeEmotion(freqData, sampleRate, analyser.fftSize);

      if (rawEmotion === prevEmotion) {
        emotionHoldFrames++;
      } else {
        prevEmotion = rawEmotion;
        emotionHoldFrames = 0;
      }
      if (emotionHoldFrames > 18) {
        const vis = EMOTION_VISUALS[rawEmotion];
        setEmotion(rawEmotion);
        setSmoothVis(vis);
        onEmotion?.(vis);
      }

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const vis = EMOTION_VISUALS[prevEmotion];

      ctx.fillStyle = vis.overlayColor;
      ctx.fillRect(0, 0, W, H);

      const glowR = W * 0.4 * vis.glowIntensity;
      if (glowR > 0) {
        const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, glowR);
        glow.addColorStop(0, `${vis.particleColor}${vis.glowIntensity * 0.15})`);
        glow.addColorStop(1, `${vis.particleColor}0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }

      const barCount  = 64;
      const barW      = W / barCount - 1.5;
      const step      = Math.floor(freqData.length / barCount);
      const centerY   = H / 2;

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += freqData[i * step + j] ?? 0;
        const avg = sum / step / 255;
        const h   = avg * (H * 0.45) * (vis.glowIntensity * 0.5 + 0.5);
        const x   = i * (barW + 1.5);
        const alpha = 0.3 + avg * 0.7;

        ctx.fillStyle = `${vis.particleColor}${alpha})`;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, centerY - h, barW, h, 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, centerY - h, barW, h);
        }

        ctx.fillStyle = `${vis.particleColor}${alpha * 0.4})`;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, centerY, barW, h * 0.5, 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, centerY, barW, h * 0.5);
        }
      }

      ctx.strokeStyle = `${vis.particleColor}0.25)`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(W, centerY);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
  }, [onEmotion]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      cancelAnimationFrame(animRef.current);
      onEmotion?.(EMOTION_VISUALS.silence);
      return;
    }

    await setupAudio();
    if (ctxRef.current?.state === 'suspended') {
      await ctxRef.current.resume();
    }

    await audio.play();
    setPlaying(true);
    startAnimation();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onLoad = () => setDuration(audio.duration);
    const onEnd  = () => {
      setPlaying(false);
      setProgress(0);
      setEmotion('silence');
      onEmotion?.(EMOTION_VISUALS.silence);
      cancelAnimationFrame(animRef.current);
      if (storyId) void registerPulse(storyId);
    };
    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('loadedmetadata', onLoad);
    audio.addEventListener('ended',          onEnd);
    return () => {
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('loadedmetadata', onLoad);
      audio.removeEventListener('ended',          onEnd);
      cancelAnimationFrame(animRef.current);
    };
  }, [onEmotion, storyId]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const vis = smoothVis;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          position:     'relative',
          borderRadius: 16,
          overflow:     'hidden',
          marginBottom: 16,
          transition:   'box-shadow 800ms ease',
          boxShadow:    `0 0 ${40 * vis.glowIntensity}px ${vis.particleColor}${vis.glowIntensity * 0.3})`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          style={{
            width:     '100%',
            height:    120,
            display:   'block',
            transition: 'filter 600ms ease',
          }}
        />

        {emotion !== 'silence' && vis.label && (
          <div
            style={{
              position:      'absolute',
              top:           12,
              right:         14,
              fontSize:      10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         `${vis.particleColor}0.7)`,
              fontFamily:    "'Avenir Light', Avenir, sans-serif",
              transition:    'color 600ms ease',
            }}
          >
            {vis.label}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          onClick={() => void togglePlay()}
          style={{
            width:           48,
            height:          48,
            borderRadius:    '50%',
            background:      `${vis.particleColor}0.12)`,
            border:          `1px solid ${vis.particleColor}0.35)`,
            color:           `${vis.particleColor}1)`,
            fontSize:        20,
            cursor:          'pointer',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
            transition:      'all 400ms ease',
            boxShadow:       playing
              ? `0 0 20px ${vis.particleColor}${vis.glowIntensity * 0.4})`
              : 'none',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div
          style={{ flex: 1, position: 'relative', height: 4, cursor: 'pointer', borderRadius: 999 }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct  = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) audioRef.current.currentTime = pct * duration;
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={progress}
        >
          <div
            style={{
              position:     'absolute',
              inset:        0,
              background:   'rgba(255,255,255,0.08)',
              borderRadius: 999,
            }}
          />
          <div
            style={{
              position:     'absolute',
              top:          0,
              left:         0,
              bottom:       0,
              width:        `${duration ? (progress / duration) * 100 : 0}%`,
              background:   `${vis.particleColor}0.9)`,
              borderRadius: 999,
              transition:   'background 600ms ease, width 0.1s linear',
            }}
          />
          <div
            style={{
              position:    'absolute',
              top:         '50%',
              left:        `${duration ? (progress / duration) * 100 : 0}%`,
              transform:   'translate(-50%, -50%)',
              width:       10,
              height:      10,
              borderRadius: '50%',
              background:   `${vis.particleColor}1)`,
              transition:  'background 600ms ease',
              boxShadow:   `0 0 8px ${vis.particleColor}0.6)`,
            }}
          />
        </div>

        <span
          style={{
            fontSize:    12,
            color:       'rgba(255,255,255,0.40)',
            flexShrink:  0,
            fontFamily:  "'Avenir Light', Avenir, sans-serif",
            minWidth:    '4.5ch',
            textAlign:   'right',
          }}
        >
          {formatTime(progress)} / {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
    </div>
  );
}
