import { useApp } from '@/context/AppContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const config = {
  exito: { icon: CheckCircle2, bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-800', iconColor: 'text-success-500' },
  error: { icon: XCircle, bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-800', iconColor: 'text-error-500' },
  advertencia: { icon: AlertTriangle, bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-800', iconColor: 'text-warning-500' },
  info: { icon: Info, bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-800', iconColor: 'text-primary-500' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const c = config[toast.tipo];
        const Icon = c.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${c.bg} ${c.border} p-4 shadow-lg animate-slide-in-right`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${c.iconColor}`} />
            <p className={`text-sm font-medium ${c.text} flex-1`}>{toast.mensaje}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`flex-shrink-0 ${c.text} hover:opacity-70`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
