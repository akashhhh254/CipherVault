import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertOctagon, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  addToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(({ type, title, description }: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    showToast({ type, title, description });
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 border border-[#2A2A2A] bg-[#141414] shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-[#B5A27E] shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-[#B5A27E] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <div className="font-semibold text-white tracking-wide">{toast.title}</div>
              {toast.description && (
                <div className="text-[#888888] mt-0.5 leading-relaxed font-mono text-[11px]">
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#666666] hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (t: Omit<ToastMessage, 'id'>) => {
        console.log(`[Toast] ${t.title}: ${t.description || ''}`);
      },
      addToast: (type: ToastType, title: string, description?: string) => {
        console.log(`[Toast ${type}] ${title}: ${description || ''}`);
      },
    };
  }
  return context;
};
