'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
}

export function Card({ children, className = '', onClick, elevated }: CardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 ${elevated ? 'shadow-raised' : 'shadow-card'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileTap={onClick ? { scale: 0.99 } : {}}
    >
      {children}
    </motion.div>
  );
}

interface PhaseBadgeProps {
  phase: 'elimination' | 'stabilisation' | 'restoration';
  className?: string;
}

const PHASE_STYLES = {
  elimination: { bg: '#FEE2E2', color: '#991B1B', label: 'Elimination' },
  stabilisation: { bg: '#FFF3CD', color: '#92400E', label: 'Stabilisation' },
  restoration: { bg: '#E0EEE6', color: '#2C4A35', label: 'Restoration' },
};

export function PhaseBadge({ phase, className = '' }: PhaseBadgeProps) {
  const style = PHASE_STYLES[phase];
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${className}`}
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className = '' }: StreakBadgeProps) {
  if (streak < 1) return null;
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-lg">🔥</span>
      <span className="font-bold text-base" style={{ color: '#B25E04' }}>{streak}</span>
      <span className="text-xs" style={{ color: '#A8A29E' }}>day streak</span>
    </div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-[--color-border] my-3 ${className}`} />;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-base" style={{ color: '#1C1C1A' }}>{title}</h3>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
