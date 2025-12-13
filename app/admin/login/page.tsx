'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions/auth-actions';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import GsapSnowBackground from '@/components/frontend/home/SnowBackground';

export default function LoginPage() {
  // Handles the form submission state (success/error)
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-[#f4f4f4] overflow-hidden">
      
      {/* Background Layer */}
      <div className="absolute inset-0 bg-[url('/images/background/p.png')] bg-cover bg-center bg-no-repeat opacity-80" />
      <GsapSnowBackground />
      
      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[40px] p-8 md:p-12 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#A81010] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/20">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
              Admin Portal
            </h1>
            <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide uppercase">
              King & The Code
            </p>
          </div>

          {/* Form */}
          <form action={dispatch} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#A81010] transition-colors" />
                </div>
                <input 
                  name="email"
                  type="email" 
                  placeholder="admin@afyalink.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A81010] focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#A81010] transition-colors" />
                </div>
                <input 
                  name="password"
                  type="password" 
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A81010] focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <LoginButton />
            
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Authorized personnel only. <br/> Access is monitored.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

// Separate component for pending state
function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="group w-full bg-[#A81010] hover:bg-[#8a0d0d] text-white font-serif font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-red-900/20 hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin w-5 h-5" />
          <span>Verifying...</span>
        </>
      ) : (
        <>
          <span>Sign In</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}