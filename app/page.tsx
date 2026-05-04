'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';

export default function Home() {
  const router = useRouter();
  const { onboardingComplete } = useAppStore();
  
  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/today');
    } else {
      router.replace('/onboarding');
    }
  }, [onboardingComplete, router]);
  
  return (
    <div className="flex items-center justify-center min-h-dvh" style={{ backgroundColor: '#4A7C59' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🌿</div>
        <div className="text-white text-xl font-semibold">Gut Reset</div>
      </div>
    </div>
  );
}
