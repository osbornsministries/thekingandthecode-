"use client";

import { Check } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
}

export default function SuccessToast({ message, isVisible }: SuccessToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">{message}</p>
            <p className="text-sm text-green-600">Messages are being processed</p>
          </div>
        </div>
      </div>
    </div>
  );
}