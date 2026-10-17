import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import EstadoBadge from '@/components/EstadoBadge';
import { formatMoneda, formatFechaHora, puedeInvalidar } from '@/utils/format';
import { Search, Eye, Download, Mail, Ban, FileMinus2 } from 'lucide-react';
import type { EstadoDocumento, TipoDocumento } from '@/types';

export default function DocumentosPage() {
  const { documentos, navigate, addToast } = useApp();

  const [filtroTipo, setFiltroTipo] = useState<TipoDocumento | 'Todos'>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<EstadoDocumento | 'Todos'>('Todos');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = documentos;
    if (filtroTipo !== 'Todos') list = list.filter((d) => d.tipo === filtroTipo);
    if (filtroEstado !== 'Todos') list = list.filter((d) => d.estado === filtroEstado);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.numeroGeneracion.toLowerCase().includes(s) ||
          d.clienteNombre.toLowerCase().includes(s)
      );
    }
    return list;
  }, [documentos, filtroTipo, filtroEstado, search]);

  const handleReenviarCorreo = (doc: typeof documentos[0]) => {
    if (doc.envioCorreo) {
      addToast('exito', `Correo reenviado a ${doc.envioCorreo.destinatario}`);
    } else {
      addToast('advertencia', 'Este documento no tiene correo de destino configurado');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Documentos</h1>
        <p className="mt-1 text-sm text-neutral-500">Listado de documentos emitidos</p>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número o cliente..."
              className="input pl-9"
            />
          </div>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as TipoDocumento | 'Todos')} className="input">
            <option value="Todos">Todos los tipos</option>
            <option value="FCF">FCF - Factura de Consumidor Final</option>
            <option value="CCF">CCF - Comprobante de Crédito Fiscal</option>
            <option value="NC">NC - Nota de Crédito</option>
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as EstadoDocumento | 'Todos')} className="input">
            <option value="Todos">Todos los estados</option>
            <option value="Procesada">Procesada</option>
            <option value="Invalidada">Invalidada</option>
            <option value="Contingencia">Contingencia</option>
            <option value="PendienteTransmision">Pendiente de transmisión</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FileMinus2 className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">No hay documentos que mostrar</p>
            <button onClick={() => navigate('nueva-venta')} className="btn-primary mt-4">
              Crear primera venta
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-semibold text-neutral-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">No. Generación</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-center">Correo</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const invalidacion = puedeInvalidar(doc.tipo, doc.fechaEmision);
                  const puedeInv = doc.estado === 'Procesada' && invalidacion.puede;
                  return (
                    <tr key={doc.id} className="border-b border-neutral-100 table-row-hover">
                      <td className="px-4 py-3 font-medium text-neutral-700">{doc.tipo}</td>
                      <td className="px-4 py-3 text-neutral-600 font-mono text-xs">{doc.numeroGeneracion}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatFechaHora(doc.fechaEmision)}</td>
                      <td className="px-4 py-3 text-neutral-600">{doc.clienteNombre}</td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-700">{formatMoneda(doc.total)}</td>
                      <td className="px-4 py-3"><EstadoBadge estado={doc.estado} /></td>
                      <td className="px-4 py-3 text-center">
                        {doc.envioCorreo ? (
                          <span className={`inline-flex items-center gap-1 text-xs ${
                            doc.envioCorreo.estado === 'Enviado' ? 'text-success-600' : 'text-error-600'
                          }`}>
                            <Mail className="h-3.5 w-3.5" />
                            {doc.envioCorreo.estado === 'Enviado' ? 'Sí' : 'Fallido'}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate('detalle-documento', { id: doc.id })}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => addToast('info', `Descargando PDF: ${doc.numeroGeneracion}.pdf`)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => addToast('info', `Descargando JSON: ${doc.numeroGeneracion}.json`)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                            title="Descargar JSON"
                          >
                            <FileMinus2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReenviarCorreo(doc)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            title="Reenviar correo"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          {puedeInv ? (
                            <button
                              onClick={() => navigate('detalle-documento', { id: doc.id, invalidar: 'true' })}
                              className="rounded-lg p-1.5 text-error-500 hover:bg-error-50 transition-colors"
                              title="Invalidar"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : doc.estado === 'Procesada' ? (
                            <span className="text-xs text-neutral-300 px-1" title="Plazo vencido">
                              <Ban className="h-4 w-4 opacity-30" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
