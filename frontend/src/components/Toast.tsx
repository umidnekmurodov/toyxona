import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// ─── Individual Toast Item ───────────────────────────────────────────────────
function ToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in on next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 4 s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 350);
  };

  const styles: Record<ToastType, { bar: string; icon: string; bg: string; border: string; text: string }> = {
    success: {
      bar: 'bg-emerald-500',
      icon: '✅',
      bg: 'bg-white dark:bg-luxury-900',
      border: 'border-emerald-400/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    error: {
      bar: 'bg-red-500',
      icon: '❌',
      bg: 'bg-white dark:bg-luxury-900',
      border: 'border-red-400/30',
      text: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bar: 'bg-amber-500',
      icon: '⚠️',
      bg: 'bg-white dark:bg-luxury-900',
      border: 'border-amber-400/30',
      text: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bar: 'bg-blue-500',
      icon: 'ℹ️',
      bg: 'bg-white dark:bg-luxury-900',
      border: 'border-blue-400/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
  };

  const s = styles[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto relative flex items-center gap-3 min-w-[300px] max-w-[400px] rounded-2xl border shadow-2xl overflow-hidden transition-all duration-350 ease-out
        ${s.bg} ${s.border}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} />

      {/* Content */}
      <div className="flex items-center gap-3 px-5 py-4 pl-6 flex-1">
        <span className="text-xl shrink-0">{s.icon}</span>
        <p className={`text-sm font-semibold flex-1 leading-snug ${s.text}`}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="pr-4 py-4 text-luxury-400 hover:text-luxury-600 dark:hover:text-luxury-200 transition-colors cursor-pointer shrink-0 text-sm"
        aria-label="Yopish"
      >
        ✕
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-40`}
        style={{ animation: 'toast-progress 4s linear forwards' }}
      />
    </div>
  );
}

// ─── Container (renders all toasts) ─────────────────────────────────────────
export function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
      ))}

      {/* Inject progress animation */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
