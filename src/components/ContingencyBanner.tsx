import { useApp } from '@/context/AppContext';
import { AlertTriangle, Send } from 'lucide-react';

export default function ContingencyBanner() {
  const { contingenciaActiva, documentosPendientesTransmitir, transmitirPendientes, addToast } = useApp();

  if (!contingenciaActiva) return null;

  const handleTransmitir = () => {
    transmitirPendientes();
    addToast('exito', `${documentosPendientesTransmitir} documentos transmitidos al MH correctamente`);
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-accent-500/10 border-b border-accent-300 px-6 py-2.5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-accent-600" />
        <div>
          <p className="text-sm font-semibold text-accent-800">
            Modo contingencia activo. Los documentos se transmitirán al MH cuando se restablezca la conexión.
          </p>
          <p className="text-xs text-accent-700">
            {documentosPendientesTransmitir} documento(s) pendiente(s) de transmitir
          </p>
        </div>
      </div>
      {documentosPendientesTransmitir > 0 && (
        <button onClick={handleTransmitir} className="btn-accent text-xs whitespace-nowrap">
          <Send className="h-4 w-4" />
          Transmitir pendientes
        </button>
      )}
    </div>
  );
}
