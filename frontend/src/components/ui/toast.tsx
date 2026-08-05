import { useCallback, useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      icon: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />,
      border: "border-green-500/40",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />,
      border: "border-red-500/40",
    },
    info: {
      icon: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
      border: "border-blue-500/40",
    },
  };

  const { icon, border } = config[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-80 rounded-lg border bg-card px-4 py-3 shadow-lg transition-all duration-300",
        border,
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      {icon}
      <p className="flex-1 text-sm text-foreground leading-snug">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

let _counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${++_counter}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}