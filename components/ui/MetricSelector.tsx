'use client';

import { motion } from 'framer-motion';

interface MetricSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: string[];
  color?: string;
}

const DEFAULT_LABELS = ['Very Low', 'Low', 'Moderate', 'Good', 'Excellent'];
const BLOATING_LABELS = ['None', 'Mild', 'Noticeable', 'Uncomfortable', 'Severe'];

export function MetricSelector({
  value,
  onChange,
  min = 1,
  max = 5,
  labels = DEFAULT_LABELS,
  color = '#4A7C59',
}: MetricSelectorProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  
  return (
    <div className="flex gap-2 justify-between">
      {options.map((option) => (
        <motion.button
          key={option}
          onClick={() => onChange(option)}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all min-h-[52px] cursor-pointer"
          style={{
            backgroundColor: value === option ? color : '#F5F4F2',
            borderColor: value === option ? color : '#E8E6E3',
            color: value === option ? 'white' : '#292524',
          }}
        >
          <span className="text-base font-semibold">{option}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function EmojiMetricSelector({
  value,
  onChange,
  emojis = ['😫', '😔', '😐', '😊', '😄'],
}: {
  value: number;
  onChange: (value: number) => void;
  emojis?: string[];
}) {
  return (
    <div className="flex gap-2 justify-between">
      {emojis.map((emoji, i) => {
        const option = i + 1;
        return (
          <motion.button
            key={option}
            onClick={() => onChange(option)}
            whileTap={{ scale: 0.9 }}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all min-h-[60px] cursor-pointer"
            style={{
              backgroundColor: value === option ? '#E0EEE6' : '#F5F4F2',
              borderColor: value === option ? '#4A7C59' : '#E8E6E3',
            }}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium" style={{ color: value === option ? '#2C4A35' : '#78716C' }}>
              {option}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function BloatingSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const options = [
    { value: 1, label: 'None', emoji: '✨' },
    { value: 2, label: 'Mild', emoji: '🫧' },
    { value: 3, label: 'Notice', emoji: '😶' },
    { value: 4, label: 'Discomfort', emoji: '😣' },
    { value: 5, label: 'Severe', emoji: '😖' },
  ];
  
  return (
    <div className="flex gap-1.5 justify-between">
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all min-h-[64px] cursor-pointer"
          style={{
            backgroundColor: value === opt.value ? '#FFF4D6' : '#F5F4F2',
            borderColor: value === opt.value ? '#F59E0B' : '#E8E6E3',
          }}
        >
          <span className="text-xl">{opt.emoji}</span>
          <span className="text-xs font-medium" style={{ color: value === opt.value ? '#8A4603' : '#78716C' }}>
            {opt.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export function WaterTracker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4 justify-center">
      <motion.button
        onClick={() => onChange(Math.max(0, value - 1))}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold cursor-pointer"
        style={{ backgroundColor: '#E0EEE6', color: '#2C4A35' }}
      >
        −
      </motion.button>
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: '#1C1C1A', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
        <span className="text-sm" style={{ color: '#6B7280' }}>of 8 glasses</span>
      </div>
      <motion.button
        onClick={() => onChange(Math.min(12, value + 1))}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold cursor-pointer"
        style={{ backgroundColor: '#4A7C59', color: 'white' }}
      >
        +
      </motion.button>
    </div>
  );
}

export { BLOATING_LABELS };
