'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  targetDate: string; // Format: "2024-12-25T00:00:00" or similar
}

export default function CountdownTimer({ targetDate }: Props) {
  // Helper function to calculate the time difference
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(targetDate) - +new Date();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    // Return all zeros if date has passed
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Prevent hydration mismatch on Next.js (optional but recommended)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Or return a skeleton loader

  return (
    <div className="backdrop-blur-sm bg-white/30 border border-white/40 rounded-full px-9 py-9 flex gap-8 items-center justify-center shadow-lg animate-in fade-in duration-700">
      <TimeBlock value={timeLeft.days} label="DAYS" />
      <Separator />
      <TimeBlock value={timeLeft.hours} label="HOURS" />
      <Separator />
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <Separator />
      <TimeBlock value={timeLeft.seconds} label="SEC" />
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[50px]">
      <span className="text-4xl font-serif font-bold text-gray-800">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] tracking-widest text-gray-500 font-semibold">{label}</span>
    </div>
  );
}

function Separator() {
  return <div className="text-2xl text-gray-400 font-light -mt-4">:</div>;
}