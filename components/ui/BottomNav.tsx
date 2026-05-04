'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const TABS = [
  { href: '/today', label: 'Today', emoji: '🌿' },
  { href: '/meals', label: 'Meals', emoji: '🥗' },
  { href: '/progress', label: 'Progress', emoji: '📈' },
  { href: '/guide', label: 'Guide', emoji: '📚' },
];

export function BottomNav() {
  const pathname = usePathname();
  
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-float pb-safe z-50"
      style={{ borderColor: '#E8E6E3' }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 min-h-[60px] transition-colors"
            >
              <span className="text-2xl leading-none">{tab.emoji}</span>
              <span
                className="text-xs font-medium"
                style={{ color: active ? '#4A7C59' : '#A8A29E' }}
              >
                {tab.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 h-0.5 w-8 rounded-full"
                  style={{ backgroundColor: '#4A7C59' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
