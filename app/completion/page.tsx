'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { getAllLocalLogs, getLocalBaseline, getLocalSupplementLogs } from '@/lib/storage';

interface LogData {
  date: string;
  gut_score?: number;
  energy?: number;
  mood?: number;
  bloating?: number;
  sleep_quality?: number;
  evening_checked_in?: boolean;
  day_number?: number;
  supplements_taken?: Record<string, boolean>;
}

interface BaselineData {
  energy?: number;
  bloating?: number;
  mood?: number;
  bowel_pattern?: string;
}

const SHARE_FEEDBACK_DURATION_MS = 3000;

function MetricDelta({ label, emoji, baseline, final, invert = false }: {
  label: string;
  emoji: string;
  baseline: number | null;
  final: number | null;
  invert?: boolean;
}) {
  if (baseline === null || final === null) return null;
  const delta = final - baseline;
  const improved = invert ? delta < 0 : delta > 0;
  const neutral = delta === 0;

  const color = neutral ? '#A8A29E' : improved ? '#4A7C59' : '#EF4444';
  const arrow = neutral ? '→' : delta > 0 ? '↑' : '↓';
  const absDelta = Math.abs(delta);
  const sign = delta > 0 ? '+' : '';

  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-card">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <p className="text-xs font-medium mb-0.5" style={{ color: '#A8A29E' }}>{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#44403C' }}>{baseline}/5 → {final}/5</span>
          <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: neutral ? '#F5F4F2' : improved ? '#E0EEE6' : '#FEE2E2', color }}>
            {arrow} {sign}{absDelta} {neutral ? 'unchanged' : improved ? 'better' : 'worse'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniLineChart({ data }: { data: (number | null)[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(320);
  const HEIGHT = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame: number | null = null;

    const updateWidth = () => {
      const nextWidth = Math.floor(container.clientWidth);
      if (nextWidth > 0) setWidth(nextWidth);
    };
    const scheduleWidthUpdate = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      frame = requestAnimationFrame(updateWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(scheduleWidthUpdate);
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(HEIGHT * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const validPoints = data.map((v, i) => ({ x: i, y: v })).filter(p => p.y !== null) as { x: number; y: number }[];
    const W = width;
    const H = HEIGHT;
    ctx.clearRect(0, 0, W, H);
    if (validPoints.length < 2) return;

    const PAD = 8;
    const maxY = Math.max(...validPoints.map(p => p.y), 100);
    const minY = 0;

    const toX = (i: number) => PAD + ((i) / (data.length - 1)) * (W - PAD * 2);
    const toY = (v: number) => H - PAD - ((v - minY) / (maxY - minY)) * (H - PAD * 2);

    // Fill under line
    ctx.beginPath();
    ctx.moveTo(toX(validPoints[0].x), H - PAD);
    validPoints.forEach(p => ctx.lineTo(toX(p.x), toY(p.y)));
    ctx.lineTo(toX(validPoints[validPoints.length - 1].x), H - PAD);
    ctx.closePath();
    ctx.fillStyle = 'rgba(74,124,89,0.12)';
    ctx.fill();

    // Line
    ctx.beginPath();
    validPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(p.x), toY(p.y));
      else ctx.lineTo(toX(p.x), toY(p.y));
    });
    ctx.strokeStyle = '#4A7C59';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    validPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4A7C59';
      ctx.fill();
    });
  }, [data, width]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="block w-full" style={{ height: HEIGHT }} />
    </div>
  );
}

export default function CompletionPage() {
  const router = useRouter();
  const { configuredSupplements, goals } = useAppStore();
  const [logs, setLogs] = useState<LogData[]>([]);
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied'>('idle');
  const shareResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const allLogs = getAllLocalLogs();
    setLogs(allLogs.map(l => ({ ...(l.data as LogData), date: l.date })));
    const bl = getLocalBaseline() as BaselineData | null;
    setBaseline(bl);
  }, []);

  useEffect(() => {
    return () => {
      if (shareResetTimeoutRef.current !== null) {
        clearTimeout(shareResetTimeoutRef.current);
      }
    };
  }, []);

  // Program stats
  const completedDays = logs.filter(l => l.evening_checked_in).length;
  const totalDays = 14;

  const suppAdherence = (() => {
    const days = logs.filter(l => l.evening_checked_in && typeof l.date === 'string' && l.date.length > 0);
    if (!days.length || !configuredSupplements.length) return null;
    const supplementLogCache: Record<string, Record<string, boolean> | null> = {};
    const totalSlots = days.length * configuredSupplements.length;
    const taken = days.reduce((acc, dayLog) => {
      if (!(dayLog.date in supplementLogCache)) {
        supplementLogCache[dayLog.date] = getLocalSupplementLogs(dayLog.date);
      }
      const supplementLog = supplementLogCache[dayLog.date];
      return acc + configuredSupplements.filter(k => supplementLog?.[k]).length;
    }, 0);
    return Math.round((taken / totalSlots) * 100);
  })();

  const avgGutScore = (() => {
    const scored = logs.filter(l => typeof l.gut_score === 'number' && l.gut_score > 0);
    if (!scored.length) return null;
    return Math.round(scored.reduce((a, l) => a + (l.gut_score ?? 0), 0) / scored.length);
  })();

  const gutScoreSeries: (number | null)[] = Array.from({ length: 14 }, (_, i) => {
    const log = logs.find(l => l.day_number === i + 1);
    return (log?.gut_score ?? null) as number | null;
  });

  // Day 14 actuals
  const day14Log = logs.find(l => l.day_number === 14);

  const baselineEnergy = baseline?.energy ?? null;
  const baselineBloating = baseline?.bloating ?? null;
  const baselineMood = baseline?.mood ?? null;

  const finalEnergy = (day14Log?.energy ?? null) as number | null;
  const finalBloating = (day14Log?.bloating ?? null) as number | null;
  const finalMood = (day14Log?.mood ?? null) as number | null;

  const hasComparison = baselineEnergy !== null || baselineBloating !== null || baselineMood !== null;
  const hasFinal = finalEnergy !== null || finalBloating !== null || finalMood !== null;

  const streakEmoji = completedDays >= 14 ? '🏆' : completedDays >= 10 ? '🌟' : '🌿';

  const shareText = `I just completed the 14-Day Gut Reset! 🌿\n\n${avgGutScore ? `Average Gut Score: ${avgGutScore}/100\n` : ''}${completedDays} of 14 days logged${suppAdherence ? `\nSupplement adherence: ${suppAdherence}%` : ''}\n\nFeel significantly better. Recommend.`;

  const handleShare = async () => {
    const resetFeedback = () => {
      if (shareResetTimeoutRef.current !== null) {
        clearTimeout(shareResetTimeoutRef.current);
      }
      shareResetTimeoutRef.current = setTimeout(() => setShareState('idle'), SHARE_FEEDBACK_DURATION_MS);
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: '14-Day Gut Reset Complete 🌿',
          text: shareText,
          url: window.location.origin,
        });
        setShareState('shared');
        resetFeedback();
      } catch {
        // User cancelled or not supported
      }
    } else {
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(shareText);
        setShareState('copied');
        resetFeedback();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="min-h-dvh max-w-sm mx-auto flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 text-center text-white" style={{ backgroundColor: '#4A7C59' }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-7xl mb-4"
        >
          {streakEmoji}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold mb-2"
        >
          14 Days Complete
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-base opacity-90"
        >
          You reset your gut. Here's what changed.
        </motion.p>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 px-4">

        {/* Program stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 mb-4"
        >
          <h2 className="text-base font-bold mb-3" style={{ color: '#1C1C1A' }}>Program Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center shadow-card">
              <p className="text-3xl font-bold mb-1" style={{ color: '#4A7C59' }}>{completedDays}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>of {totalDays} days logged</p>
            </div>
            {avgGutScore !== null && (
              <div className="bg-white rounded-2xl p-4 text-center shadow-card">
                <p className="text-3xl font-bold mb-1" style={{ color: '#4A7C59' }}>{avgGutScore}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>avg Gut Score</p>
              </div>
            )}
            {suppAdherence !== null && (
              <div className="bg-white rounded-2xl p-4 text-center shadow-card">
                <p className="text-3xl font-bold mb-1" style={{ color: '#4A7C59' }}>{suppAdherence}%</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>supplement adherence</p>
              </div>
            )}
            <div className="bg-white rounded-2xl p-4 text-center shadow-card">
              <p className="text-3xl font-bold mb-1" style={{ color: '#4A7C59' }}>{completedDays}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>day streak</p>
            </div>
          </div>
        </motion.div>

        {/* Gut Score trend */}
        {gutScoreSeries.some(v => v !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl p-4 shadow-card mb-4"
          >
            <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1A' }}>Your Journey — Gut Score</p>
            <p className="text-xs mb-3" style={{ color: '#A8A29E' }}>14-day arc</p>
            <MiniLineChart data={gutScoreSeries} />
            <div className="flex justify-between mt-2">
              <span className="text-xs" style={{ color: '#A8A29E' }}>Day 1</span>
              <span className="text-xs" style={{ color: '#A8A29E' }}>Day 14</span>
            </div>
          </motion.div>
        )}

        {/* Before vs After */}
        {hasComparison && hasFinal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-4"
          >
            <h2 className="text-base font-bold mb-3" style={{ color: '#1C1C1A' }}>Before vs. After</h2>
            <div className="flex flex-col gap-3">
              <MetricDelta label="Energy" emoji="⚡" baseline={baselineEnergy} final={finalEnergy} />
              <MetricDelta label="Bloating" emoji="🫧" baseline={baselineBloating} final={finalBloating} invert={true} />
              <MetricDelta label="Mood" emoji="😊" baseline={baselineMood} final={finalMood} />
            </div>
          </motion.div>
        )}

        {/* Goal reflection */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-white rounded-2xl p-4 shadow-card mb-4"
          >
            <p className="text-sm font-bold mb-2" style={{ color: '#1C1C1A' }}>What You Were Working On</p>
            <div className="flex flex-col gap-1.5">
              {goals.map(goal => {
                const goalLabels: Record<string, string> = {
                  bloating: '🫁 Reduce bloating & digestive discomfort',
                  energy: '⚡ Restore energy & reduce fatigue',
                  clarity: '🧠 Improve mental clarity & brain fog',
                  sleep: '😴 Better sleep',
                  antibiotics: '🌿 Recover from antibiotics / disrupted gut',
                  reset: '🎯 General health reset & baseline',
                };
                return (
                  <div key={goal} className="flex items-center gap-2">
                    <span className="text-green-600 text-sm font-bold">✓</span>
                    <span className="text-sm" style={{ color: '#44403C' }}>{goalLabels[goal] ?? goal}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* What's next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: '#E0EEE6', border: '1px solid #B8D8C4' }}
        >
          <p className="text-sm font-bold mb-2" style={{ color: '#2C4A35' }}>What's Next</p>
          <p className="text-sm mb-3" style={{ color: '#3A6146', lineHeight: '1.55' }}>
            Your microbiome has shifted. The habits you built — fermented foods, bone broth, varied plant intake, consistent supplements — are worth keeping. Maintenance is simpler than the reset: apply 80% of the protocol, 80% of the time.
          </p>
          <p className="text-xs" style={{ color: '#4A7C59' }}>
            Tip: restart a new 14-day cycle in 4–8 weeks for deeper restoration, especially after travel, antibiotics, or illness.
          </p>
        </motion.div>

        {/* Science note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl p-3 mb-6"
          style={{ backgroundColor: '#F5F4F2' }}
        >
          <p className="text-xs" style={{ color: '#78716C', lineHeight: '1.5' }}>
            Portions and metrics are estimates for planning purposes, not clinical nutrition advice. Individual results vary. If you have persistent symptoms, speak to a healthcare professional.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl font-semibold text-lg cursor-pointer text-white"
            style={{ backgroundColor: '#4A7C59' }}
          >
            {shareState === 'copied' ? '✓ Copied to clipboard' : shareState === 'shared' ? '✓ Shared' : '📤 Share your result'}
          </button>
          <button
            onClick={() => router.push('/progress')}
            className="w-full py-4 rounded-2xl font-semibold text-base cursor-pointer"
            style={{ backgroundColor: '#F5F4F2', color: '#44403C' }}
          >
            📈 View full progress
          </button>
          <button
            onClick={() => router.push('/today')}
            className="w-full py-3 rounded-2xl font-medium text-sm cursor-pointer"
            style={{ backgroundColor: 'transparent', color: '#A8A29E' }}
          >
            Back to Today
          </button>
        </motion.div>
      </div>
    </div>
  );
}
