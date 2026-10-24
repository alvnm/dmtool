'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, message, type }]); // máx 4 toasts simultáneos

    setTimeout(() => {
      removeToast(id);
    }, 2800);
  }, [removeToast]);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div 
        aria-live="polite" 
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4"
      >
        <AnimatePresence>
          {toasts.map(t => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-medium backdrop-blur-md ${
                  isSuccess
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
                    : isError
                    ? 'bg-red-950/90 text-red-200 border-red-700/50'
                    : 'bg-dungeon-900/95 text-slate-200 border-dungeon-700 shadow-black/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isError && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  {!isSuccess && !isError && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
                  <span>{t.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="btn p-1 hover:bg-white/10 text-slate-400 hover:text-slate-200"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
