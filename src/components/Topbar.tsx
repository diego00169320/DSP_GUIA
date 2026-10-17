import { useApp } from '@/context/AppContext';
import { User, Building2, Cloud, CloudOff } from 'lucide-react';

export default function Topbar() {
  const { usuario, contribuyente, contingenciaActiva, setContingenciaActiva, documentosPendientesTransmitir, transmitirPendientes, addToast } = useApp();

  const handleSimularContingencia = () => {
    if (contingenciaActiva) {
      setContingenciaActiva(false);
      addToast('info', 'Modo contingencia desactivado');
    } else {
      setContingenciaActiva(true);
      addToast('advertencia', 'Modo contingencia activado. Los documentos se transmitirán cuando se restablezca la conexión.');
    }
  };

  const handleTransmitir = () => {
    transmitirPendientes();
    addToast('exito', `${documentosPendientesTransmitir} documentos transmitidos al MH correctamente`);
  };

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-neutral-700">{contribuyente.nombreComercial || contribuyente.nombreRazonSocial}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          contribuyente.ambiente === 'Produccion'
            ? 'bg-error-100 text-error-700'
            : 'bg-primary-100 text-primary-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${contribuyente.ambiente === 'Produccion' ? 'bg-error-500' : 'bg-primary-500'}`} />
          {contribuyente.ambiente === 'Produccion' ? 'Producción' : 'Pruebas'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Botón de contingencia (simulado para demo) */}
        {contingenciaActiva && documentosPendientesTransmitir > 0 ? (
          <button
            onClick={handleTransmitir}
            className="btn-accent text-xs"
          >
            Transmitir pendientes ({documentosPendientesTransmitir})
          </button>
        ) : (
          <button
            onClick={handleSimularContingencia}
            className={`btn text-xs ${contingenciaActiva ? 'btn-danger' : 'btn-secondary'}`}
            title="Simular contingencia (para demostración)"
          >
            {contingenciaActiva ? (
              <><CloudOff className="h-4 w-4" /> Desactivar contingencia</>
            ) : (
              <><Cloud className="h-4 w-4" /> Simular contingencia</>
            )}
          </button>
        )}

        <div className="flex items-center gap-2 border-l border-neutral-200 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700">{usuario?.nombre}</p>
            <p className="text-xs text-neutral-400">{usuario?.correo}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
