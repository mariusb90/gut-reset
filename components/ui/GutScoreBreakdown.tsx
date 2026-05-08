'use client';

import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ScoreComponent {
  label: string;
  emoji: string;
  /** Points earned for this component today (0–max) */
  earned: number;
  /** Maximum points this component can contribute */
  max: number;
  /** If true, the component hasn't been logged yet */
  pending?: boolean;
}

interface GutScoreBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
  components: ScoreComponent[];
  totalScore: number;
  /** One-liner explaining what moved the score today */
  todaySummary: string;
}

export function GutScoreBreakdown({
  isOpen,
  onClose,
  components,
  totalScore,
  todaySummary,
}: GutScoreBreakdownProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusFrameRef.current = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      focusFrameRef.current = null;
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
      window.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="breakdown-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            aria-hidden="true"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          {/* Panel */}
          <motion.div
            key="breakdown-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-sm mx-auto rounded-t-3xl px-5 pt-4 pb-8"
            style={{ backgroundColor: '#FAFAF8' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) onClose();
            }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: '#D2CECC' }} />

            {/* Title */}
            <div className="flex items-center justify-between mb-1">
              <h2 id={titleId} className="text-lg font-bold" style={{ color: '#1C1C1A' }}>Score Breakdown</h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="text-2xl leading-none cursor-pointer"
                style={{ color: '#A8A29E' }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: '#4A7C59' }}>
              {totalScore} <span className="text-sm font-normal" style={{ color: '#6B7280' }}>/ 100 today</span>
            </p>

            {/* Today summary pill */}
            <div
              className="rounded-xl px-3 py-2 mb-5"
              style={{ backgroundColor: '#F0FAF4', borderLeft: '3px solid #4A7C59' }}
            >
              <p className="text-xs font-semibold" style={{ color: '#2C4A35' }}>
                💡 {todaySummary}
              </p>
            </div>

            {/* Component bars */}
            <div className="flex flex-col gap-3">
              {components.map((comp) => {
                const pct = comp.max > 0 ? (comp.earned / comp.max) * 100 : 0;
                return (
                  <div key={comp.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{comp.emoji}</span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: comp.pending ? '#A8A29E' : '#1C1C1A' }}
                        >
                          {comp.label}
                        </span>
                        {comp.pending && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: '#F5F4F2', color: '#A8A29E' }}
                          >
                            not logged
                          </span>
                        )}
                      </div>
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: comp.pending ? '#A8A29E' : '#4A7C59' }}
                      >
                        {Math.round(comp.earned)}<span className="font-normal text-xs" style={{ color: '#A8A29E' }}>/{comp.max}</span>
                      </span>
                    </div>

                    {/* Bar track */}
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: '#E8E6E3',
                        border: comp.pending ? '1.5px dashed #D2CECC' : 'none',
                      }}
                    >
                      {!comp.pending && (
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: pct >= 80 ? '#4A7C59' : pct >= 40 ? '#F59E0B' : '#EF4444' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-xs mt-5 text-center" style={{ color: '#A8A29E' }}>
              Tap outside or swipe down to close
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
