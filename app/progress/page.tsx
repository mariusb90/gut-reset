'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAppStore, getCurrentDayNumber } from '@/store/appStore';
import { getAllLocalLogs } from '@/lib/storage';
import { getSymptomMeta } from '@/data/symptoms';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LogData {
  date: string;
  gut_score?: number;
  energy?: number;
  mood?: number;
  bloating?: number;
  sleep_quality?: number;
  evening_checked_in?: boolean;
  day_number?: number;
  symptoms?: string[];
}

export default function ProgressPage() {
  const { startDate, goals } = useAppStore();
  const hasGoal = (g: string) => goals.includes(g);
  const currentDay = getCurrentDayNumber(startDate);
  const [logs, setLogs] = useState<LogData[]>([]);
  
  useEffect(() => {
    const allLogs = getAllLocalLogs();
    setLogs(allLogs.map(l => l.data as LogData));
  }, []);
  
  const daysLogged = logs.filter(l => l.evening_checked_in).length;
  const streak = (() => {
    if (!logs.length) return 0;
    let s = 0;
    const today = new Date().toISOString().split('T')[0];
    for (const log of [...logs].reverse()) {
      if (log.evening_checked_in) s++;
      else if (log.date === today) continue;
      else break;
    }
    return s;
  })();
  
  const avgGutScore = logs.filter(l => l.gut_score).length
    ? Math.round(logs.filter(l => l.gut_score).reduce((a, b) => a + (b.gut_score || 0), 0) / logs.filter(l => l.gut_score).length)
    : 0;
  
  const days = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
  
  const getMetricData = (key: keyof LogData) => {
    return Array.from({ length: 14 }, (_, i) => {
      const dayLog = logs.find(l => l.day_number === i + 1);
      return dayLog?.[key] ?? null;
    });
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        grid: { color: '#F5F4F2' },
        ticks: { color: '#A8A29E', font: { size: 11 } },
      },
      y: {
        grid: { color: '#F5F4F2' },
        ticks: { color: '#A8A29E', font: { size: 11 } },
        min: 0,
      },
    },
  };
  
  const gutScoreData = {
    labels: days,
    datasets: [{
      data: getMetricData('gut_score'),
      borderColor: '#4A7C59',
      backgroundColor: 'rgba(74, 124, 89, 0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#4A7C59',
      pointRadius: 4,
      spanGaps: true,
    }],
  };
  
  const metricsData = {
    labels: days,
    datasets: [
      {
        label: 'Energy',
        data: getMetricData('energy'),
        borderColor: '#F59E0B',
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
      },
      {
        label: 'Mood',
        data: getMetricData('mood'),
        borderColor: '#4A7C59',
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
      },
      {
        label: 'Sleep',
        data: getMetricData('sleep_quality'),
        borderColor: '#3B82F6',
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
      },
    ],
  };
  
  const bloatingData = {
    labels: days,
    datasets: [{
      data: getMetricData('bloating'),
      borderColor: '#EF4444',
      tension: 0.3,
      pointRadius: 3,
      spanGaps: true,
    }],
  };
  
  return (
    <div className="min-h-dvh max-w-sm mx-auto flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="px-4 pt-safe pt-4 pb-3 bg-white border-b" style={{ borderColor: '#E8E6E3' }}>
        <h1 className="text-xl font-bold" style={{ color: '#1C1C1A' }}>📈 Progress</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-nav px-4 py-4">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="text-center py-3">
            <p className="text-2xl font-bold" style={{ color: '#4A7C59' }}>{daysLogged}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Days logged</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>🔥 {streak}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Day streak</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-2xl font-bold" style={{ color: '#4A7C59' }}>{avgGutScore}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Avg score</p>
          </Card>
        </div>
        
        {/* Gut Score chart */}
        <Card className="mb-4">
          <p className="font-semibold mb-1" style={{ color: '#1C1C1A' }}>Gut Score — 14 Day Trend</p>
          <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Composite 0-100 score</p>
          <div style={{ height: '160px' }}>
            <Line data={gutScoreData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>D1-3 Elimination</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF3CD', color: '#92400E' }}>D4-7 Stabilisation</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E0EEE6', color: '#2C4A35' }}>D8-14 Restoration</span>
          </div>
        </Card>
        
        {/* Metrics chart */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold" style={{ color: '#1C1C1A' }}>Energy · Mood · Sleep</p>
            {hasGoal('energy') && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>● Your primary goal</span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Scale 1-5</p>
          <div style={{ height: '160px' }}>
            <Line data={metricsData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 5, min: 1 } } }} />
          </div>
          <div className="flex gap-3 mt-2">
            {[{ color: '#F59E0B', label: 'Energy' }, { color: '#4A7C59', label: 'Mood' }, { color: '#3B82F6', label: 'Sleep' }].map(m => (
              <div key={m.label} className="flex items-center gap-1">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: m.color }} />
                <span className="text-xs" style={{ color: '#6B7280' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Bloating chart */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold" style={{ color: '#1C1C1A' }}>Bloating Trend</p>
            {(hasGoal('bloating') || hasGoal('digestion')) && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>● Your primary goal</span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Scale 1-5 (lower is better)</p>
          <div style={{ height: '140px' }}>
            <Line data={bloatingData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 5, min: 1, reverse: false } } }} />
          </div>
          {hasGoal('skin') && (
            <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Skin changes often appear in Week 2 — keep logging</p>
          )}
        </Card>
        
        {/* Symptom Patterns */}
        {(() => {
          // Count symptom occurrences across all logs
          const symptomCounts: Record<string, { week1: number; week2: number }> = {};
          for (const log of logs) {
            const syms = log.symptoms ?? [];
            const isWeek1 = (log.day_number ?? 0) <= 7;
            for (const key of syms) {
              if (!symptomCounts[key]) symptomCounts[key] = { week1: 0, week2: 0 };
              if (isWeek1) symptomCounts[key].week1++;
              else symptomCounts[key].week2++;
            }
          }

          const recurring = Object.entries(symptomCounts).filter(
            ([, c]) => c.week1 + c.week2 >= 3
          );
          const resolved = Object.entries(symptomCounts).filter(
            ([, c]) => c.week1 >= 2 && c.week2 === 0 && currentDay > 7
          );

          if (recurring.length === 0 && resolved.length === 0) return null;

          return (
            <Card className="mb-4">
              <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>🧬 Symptom Patterns</p>
              <div className="flex flex-col gap-3">
                {recurring.map(([key, counts]) => {
                  const meta = getSymptomMeta(key);
                  const total = counts.week1 + counts.week2;
                  return (
                    <div key={key} className="rounded-xl p-3" style={{ backgroundColor: '#FEF3F2' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold" style={{ color: '#991B1B' }}>{meta.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{total}× logged</span>
                      </div>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{meta.recurringNote}</p>
                    </div>
                  );
                })}
                {resolved.map(([key, counts]) => {
                  const meta = getSymptomMeta(key);
                  return (
                    <div key={key} className="rounded-xl p-3" style={{ backgroundColor: '#F0FDF4' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold" style={{ color: '#166534' }}>✓ {meta.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>Resolved</span>
                      </div>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{meta.resolvedNote}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {/* Streak Calendar */}
        <Card className="mb-4">
          <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>14-Day Calendar</p>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 14 }, (_, i) => {
              const dayNum = i + 1;
              const log = logs.find(l => l.day_number === dayNum);
              const isLogged = log?.evening_checked_in;
              const isPartial = log && !log.evening_checked_in;
              const isFuture = dayNum > currentDay;
              return (
                <div
                  key={dayNum}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="text-xs" style={{ color: '#A8A29E' }}>D{dayNum}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: isLogged ? '#4A7C59' : isPartial ? '#FFF3CD' : isFuture ? '#F5F4F2' : '#FEE2E2',
                      color: isLogged ? 'white' : isPartial ? '#92400E' : isFuture ? '#D2CECC' : '#991B1B',
                    }}
                  >
                    {isLogged ? '✓' : dayNum}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3">
            {[
              { color: '#4A7C59', textColor: 'white', label: 'Logged' },
              { color: '#FFF3CD', textColor: '#92400E', label: 'Partial' },
              { color: '#FEE2E2', textColor: '#991B1B', label: 'Missed' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs" style={{ color: '#6B7280' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Day-over-day insights */}
        {logs.length >= 5 && (
          <Card className="mb-4">
            <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>💡 Insights</p>
            <div className="flex flex-col gap-2">
              {(() => {
                const insights: string[] = [];
                const avgEnergy = logs.filter(l => l.energy).reduce((a, b) => a + (b.energy || 0), 0) / logs.filter(l => l.energy).length;
                const avgBloating = logs.filter(l => l.bloating).reduce((a, b) => a + (b.bloating || 0), 0) / logs.filter(l => l.bloating).length;
                
                if (avgEnergy >= 3.5) insights.push(`⚡ Your average energy is ${avgEnergy.toFixed(1)}/5 — above target`);
                if (avgBloating <= 2.5) insights.push(`🫧 Average bloating ${avgBloating.toFixed(1)}/5 — trending down well`);
                if (daysLogged >= 7) insights.push(`🔥 ${daysLogged} days logged — microbiome diversity measurably improving`);
                
                return insights.length ? insights.map((insight, i) => (
                  <div key={i} className="bg-[#E0EEE6] rounded-xl p-3">
                    <p className="text-sm" style={{ color: '#2C4A35' }}>{insight}</p>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: '#6B7280' }}>Keep logging — insights appear after Day 5</p>
                );
              })()}
            </div>
          </Card>
        )}
        
        {/* Completion report link when program done */}
        {currentDay >= 14 && (
          <Link
            href="/completion"
            className="flex items-center justify-between w-full bg-white rounded-2xl p-4 shadow-card mb-4 cursor-pointer"
          >
            <div>
              <p className="font-semibold text-base" style={{ color: '#1C1C1A' }}>🏆 Completion Report</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Before vs. after, full stats</p>
            </div>
            <span className="text-xl">→</span>
          </Link>
        )}

        {logs.length < 2 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-medium" style={{ color: '#1C1C1A' }}>Charts appear as you log</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Complete your daily check-ins to see trends</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
