import { useApp } from '@/context/AppContext';
import { formatFechaHora, generarId } from '@/utils/format';
import { AlertTriangle, Send, Download, History } from 'lucide-react';

export default function ContingenciaPage() {
  const { contingencias, contingenciaActiva, setContingenciaActiva, addContingencia, finalizarContingencia, documentosPendientesTransmitir, transmitirPendientes, addToast } = useApp();

  const handleActivar = () => {
    if (!contingenciaActiva) {
      setContingenciaActiva(true);
      addContingencia({
        id: generarId(),
        fechaInicio: new Date().toISOString(),
        fechaFin: null,
        motivo: 'Simulación para demostración',
        cantidadDocumentos: 0,
        fechaSincronizacion: null,
      });
      addToast('advertencia', 'Modo contingencia activado');
    } else {
      setContingenciaActiva(false);
      const activa = contingencias.find((c) => !c.fechaFin);
      if (activa) {
        finalizarContingencia(activa.id, false);
      }
      addToast('info', 'Modo contingencia desactivado');
    }
  };

  const handleTransmitir = () => {
    const cantidad = documentosPendientesTransmitir;
    transmitirPendientes();
    const activa = contingencias.find((c) => !c.fechaFin);
    if (activa) {
      finalizarContingencia(activa.id, true);
    }
    addToast('exito', `${cantidad} documento(s) transmitido(s) al MH correctamente`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Contingencia</h1>
        <p className="mt-1 text-sm text-neutral-500">Plan de contingencia del Ministerio de Hacienda</p>
      </div>

      {/* Estado actual */}
      <div className={`card p-6 ${contingenciaActiva ? 'border-accent-300 bg-accent-50' : ''}`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
            contingenciaActiva ? 'bg-accent-200' : 'bg-neutral-100'
          }`}>
            <AlertTriangle className={`h-7 w-7 ${contingenciaActiva ? 'text-accent-700' : 'text-neutral-400'}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-neutral-800">
              {contingenciaActiva ? 'Modo contingencia activo' : 'Modo normal'}
            </h2>
            <p className="text-sm text-neutral-500">
              {contingenciaActiva
                ? `${documentosPendientesTransmitir} documento(s) pendiente(s) de transmitir`
                : 'El sistema está operando con normalidad'}
            </p>
          </div>
          {contingenciaActiva && documentosPendientesTransmitir > 0 ? (
            <button onClick={handleTransmitir} className="btn-accent">
              <Send className="h-4 w-4" /> Transmitir pendientes ({documentosPendientesTransmitir})
            </button>
          ) : (
            <button
              onClick={handleActivar}
              className={contingenciaActiva ? 'btn-danger' : 'btn-secondary'}
            >
              {contingenciaActiva ? 'Desactivar contingencia' : 'Simular contingencia'}
            </button>
          )}
        </div>
      </div>

      {/* Historial de activaciones */}
      <div>
        <h2 className="text-lg font-bold text-neutral-800 mb-3">Historial de activaciones</h2>
        {contingencias.length === 0 ? (
          <div className="card p-8 text-center">
            <History className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">No hay registros de contingencia</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                    <th className="px-4 py-3 font-semibold text-neutral-600">Fecha inicio</th>
                    <th className="px-4 py-3 font-semibold text-neutral-600">Fecha fin</th>
                    <th className="px-4 py-3 font-semibold text-neutral-600">Motivo</th>
                    <th className="px-4 py-3 font-semibold text-neutral-600 text-center">Documentos</th>
                    <th className="px-4 py-3 font-semibold text-neutral-600">Sincronización</th>
                  </tr>
                </thead>
                <tbody>
                  {contingencias.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-100 table-row-hover">
                      <td className="px-4 py-3 text-neutral-600">{formatFechaHora(c.fechaInicio)}</td>
                      <td className="px-4 py-3 text-neutral-600">{c.fechaFin ? formatFechaHora(c.fechaFin) : <span className="text-accent-600 font-medium">En curso</span>}</td>
                      <td className="px-4 py-3 text-neutral-600">{c.motivo}</td>
                      <td className="px-4 py-3 text-center text-neutral-600">{c.cantidadDocumentos}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {c.fechaSincronizacion ? (
                          <span className="inline-flex items-center gap-1 text-success-600">
                            <Send className="h-3.5 w-3.5" /> {formatFechaHora(c.fechaSincronizacion)}
                          </span>
                        ) : c.fechaFin ? (
                          <span className="text-neutral-400">Sin sincronizar</span>
                        ) : (
                          <span className="text-accent-600">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Exportar registro */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-neutral-700">Exportar registro de contingencia</p>
          <p className="text-xs text-neutral-400">Para auditoría y reportes</p>
        </div>
        <button
          onClick={() => addToast('info', 'Exportando registro de contingencia...')}
          className="btn-secondary"
          disabled={contingencias.length === 0}
        >
          <Download className="h-4 w-4" /> Exportar
        </button>
      </div>
    </div>
  );
}
