import { useApp } from '@/context/AppContext';
import { formatMoneda, formatFechaHora } from '@/utils/format';
import EstadoBadge from '@/components/EstadoBadge';
import {
  ShoppingCart,
  FileText,
  Receipt,
  HardDriveDownload,
  FileMinus2,
  DollarSign,
  AlertTriangle,
  Send,
} from 'lucide-react';

export default function DashboardPage() {
  const { documentos, navigate, contingenciaActiva, documentosPendientesTransmitir, transmitirPendientes, addToast } = useApp();

  const ahora = new Date();
  const documentosMes = documentos.filter((d) => {
    const f = new Date(d.fechaEmision);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  });

  const totalEmitidos = documentosMes.length;
  const totalVendido = documentosMes
    .filter((d) => d.estado !== 'Invalidada')
    .reduce((acc, d) => acc + d.total, 0);
  const invalidados = documentosMes.filter((d) => d.estado === 'Invalidada').length;
  const pendientes = documentos.filter((d) => d.estado === 'Contingencia' || d.estado === 'PendienteTransmision').length;

  const ultimos = documentos.slice(0, 5);

  const stats = [
    { label: 'Documentos emitidos (mes)', value: totalEmitidos.toString(), icon: FileMinus2, color: 'bg-primary-500' },
    { label: 'Total vendido (mes)', value: formatMoneda(totalVendido), icon: DollarSign, color: 'bg-success-500' },
    { label: 'Documentos invalidados', value: invalidados.toString(), icon: AlertTriangle, color: 'bg-error-500' },
    { label: 'Pendientes de transmisión', value: pendientes.toString(), icon: Send, color: 'bg-warning-500' },
  ];

  const accesosRapidos = [
    { label: 'Nueva venta', icon: ShoppingCart, page: 'nueva-venta', color: 'hover:border-primary-400 hover:text-primary-600' },
    { label: 'Nuevo CCF', icon: FileText, page: 'nuevo-ccf', color: 'hover:border-primary-400 hover:text-primary-600' },
    { label: 'Nueva nota de crédito', icon: Receipt, page: 'nueva-nc', color: 'hover:border-primary-400 hover:text-primary-600' },
    { label: 'Hacer respaldo', icon: HardDriveDownload, page: 'respaldo', color: 'hover:border-primary-400 hover:text-primary-600' },
  ];

  const handleTransmitir = () => {
    transmitirPendientes();
    addToast('exito', `${documentosPendientesTransmitir} documentos transmitidos al MH correctamente`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Resumen del mes actual</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-800">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contingencia banner */}
      {contingenciaActiva && (
        <div className="flex items-center justify-between rounded-xl border border-accent-300 bg-accent-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-accent-600" />
            <div>
              <p className="text-sm font-semibold text-accent-800">Modo contingencia activo</p>
              <p className="text-xs text-accent-700">
                Hay {documentosPendientesTransmitir} documento(s) pendiente(s) de transmitir al MH
              </p>
            </div>
          </div>
          {documentosPendientesTransmitir > 0 && (
            <button onClick={handleTransmitir} className="btn-accent text-xs">
              Transmitir pendientes
            </button>
          )}
        </div>
      )}

      {/* Accesos ráápidos */}
      <div>
        <h2 className="text-lg font-bold text-neutral-800 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {accesosRapidos.map((acc, i) => {
            const Icon = acc.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(acc.page)}
                className={`card flex flex-col items-center justify-center gap-2 border-2 p-5 transition-all ${acc.color}`}
              >
                <Icon className="h-8 w-8 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Últimos documentos */}
      <div>
        <h2 className="text-lg font-bold text-neutral-800 mb-3">Últimos documentos emitidos</h2>
        {ultimos.length === 0 ? (
          <div className="card p-8 text-center">
            <FileMinus2 className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">No hay documentos emitidos todavía</p>
            <button onClick={() => navigate('nueva-venta')} className="btn-primary mt-4">
              <ShoppingCart className="h-4 w-4" />
              Crear primera venta
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-semibold text-neutral-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">No. Generación</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimos.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate('detalle-documento', { id: doc.id })}
                    className="border-b border-neutral-100 table-row-hover cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-700">{doc.tipo}</td>
                    <td className="px-4 py-3 text-neutral-600">{doc.numeroGeneracion}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatFechaHora(doc.fechaEmision)}</td>
                    <td className="px-4 py-3 text-neutral-600">{doc.clienteNombre}</td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-700">{formatMoneda(doc.total)}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={doc.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
