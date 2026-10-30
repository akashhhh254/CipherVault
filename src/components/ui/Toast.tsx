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
    }, 4500);
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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 border border-[#E5E5E5] bg-white rounded-lg shadow-lg text-[#111111] transition-all duration-200"
            role="status"
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertOctagon className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0 text-xs">
              <div className="font-semibold text-[#111111]">{toast.title}</div>
              {toast.description && (
                <div className="text-[#666666] mt-0.5 leading-relaxed break-words">
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#888888] hover:text-[#111111] p-1 rounded-sm transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
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
