import type { EstadoDocumento } from '@/types';

const config: Record<EstadoDocumento, { label: string; classes: string }> = {
  Procesada: { label: 'Procesada', classes: 'bg-success-100 text-success-700 border-success-300' },
  Invalidada: { label: 'Invalidada', classes: 'bg-error-100 text-error-700 border-error-300' },
  Contingencia: { label: 'Contingencia', classes: 'bg-accent-100 text-accent-700 border-accent-300' },
  PendienteTransmision: { label: 'Pendiente de transmisión', classes: 'bg-warning-100 text-warning-700 border-warning-300' },
};

export default function EstadoBadge({ estado }: { estado: EstadoDocumento }) {
  const c = config[estado];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.classes}`}>
      {c.label}
    </span>
  );
}
