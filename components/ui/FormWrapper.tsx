// Add this component in a separate file: /components/ui/FormWrapper.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, FormEvent } from 'react';

interface FormWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FormWrapper({ children, className = '' }: FormWrapperProps) {
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    
    formData.forEach((value, key) => {
      if (value && typeof value === 'string') {
        params.set(key, value);
      }
    });
    
    router.push(`?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}