import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInDialog({ isOpen, onClose }: SignInDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-10 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sign in to call your agent</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create an account or sign in to test your AI phone agent with real calls
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/auth?mode=signup"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors"
          >
            Create account
          </Link>
          
          <Link
            to="/auth"
            className="block w-full bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 font-medium py-2.5 px-4 rounded-lg text-center transition-colors"
          >
            Sign in
          </Link>
          
          <div className="pt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            By continuing, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
