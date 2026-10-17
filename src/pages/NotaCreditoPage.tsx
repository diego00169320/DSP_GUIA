import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SelectField, TextAreaField } from '@/components/FormFields';
import Modal from '@/components/Modal';
import { formatMoneda, formatFechaHora, generarNumeroGeneracion, generarCodigoRecepcion, generarId } from '@/utils/format';
import { motivosNC } from '@/data/catalogos';
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileText,
  Download,
  Mail,
  X,
} from 'lucide-react';
import type { Documento, ItemDocumento, MotivoNC } from '@/types';

export default function NotaCreditoPage() {
  const { documentos, clientes, contribuyente, contingenciaActiva, addDocumento, addToast, navigate } = useApp();

  const [search, setSearch] = useState('');
  const [docOriginalId, setDocOriginalId] = useState('');
  const [itemsNC, setItemsNC] = useState<{ productoId: string; nombre: string; cantidadOriginal: number; cantidadDevuelta: number; precioUnitario: number; tipoImpuesto: string }[]>([]);
  const [motivo, setMotivo] = useState<MotivoNC | ''>('');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showConfirm, setShowConfirm] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<Documento | null>(null);

  const documentosValidos = useMemo(() => {
    return documentos.filter((d) => d.estado === 'Procesada' && (d.tipo === 'FCF' || d.tipo === 'CCF'));
  }, [documentos]);

  const filteredDocs = useMemo(() => {
    if (!search) return documentosValidos;
    const s = search.toLowerCase();
    return documentosValidos.filter(
      (d) =>
        d.numeroGeneracion.toLowerCase().includes(s) ||
        d.clienteNombre.toLowerCase().includes(s)
    );
  }, [documentosValidos, search]);

  const docOriginal = documentos.find((d) => d.id === docOriginalId);

  const seleccionarDoc = (doc: Documento) => {
    setDocOriginalId(doc.id);
    setItemsNC(
      doc.items.map((i) => ({
        productoId: i.productoId,
        nombre: i.nombre,
        cantidadOriginal: i.cantidad,
        cantidadDevuelta: 0,
        precioUnitario: i.precioUnitario,
        tipoImpuesto: i.tipoImpuesto,
      }))
    );
  };

  const updateCantidadDevuelta = (productoId: string, cantidad: number) => {
    setItemsNC(itemsNC.map((i) => {
      if (i.productoId === productoId) {
        const max = i.cantidadOriginal;
        return { ...i, cantidadDevuelta: Math.max(0, Math.min(max, cantidad)) };
      }
      return i;
    }));
  };

  const itemsSeleccionados = itemsNC.filter((i) => i.cantidadDevuelta > 0);
  const subtotalNC = itemsSeleccionados.reduce((acc, i) => acc + i.cantidadDevuelta * i.precioUnitario, 0);
  const ivaNC = itemsSeleccionados
    .filter((i) => i.tipoImpuesto === 'GravadoIVA13')
    .reduce((acc, i) => acc + i.cantidadDevuelta * i.precioUnitario * 0.13, 0);
  const totalNC = subtotalNC + ivaNC;

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!docOriginalId) errs.docOriginal = 'Debe seleccionar un documento original';
    if (itemsSeleccionados.length === 0) errs.items = 'Debe seleccionar al menos un item con cantidad a devolver';
    if (!motivo) errs.motivo = 'El motivo es obligatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmitir = () => {
    if (!validar()) {
      addToast('error', 'Por favor corrija los campos marcados');
      return;
    }
    setShowConfirm(true);
  };

  const procesarEmision = () => {
    setProcesando(true);
    setShowConfirm(false);

    setTimeout(() => {
      setProcesando(false);

      const cliente = clientes.find((c) => c.id === docOriginal?.clienteId);
      const correoDestino = cliente?.correo || docOriginal?.envioCorreo?.destinatario || '';

      const itemsDoc: ItemDocumento[] = itemsSeleccionados.map((i) => ({
        productoId: i.productoId,
        codigo: docOriginal!.items.find((it) => it.productoId === i.productoId)?.codigo || '',
        nombre: i.nombre,
        cantidad: i.cantidadDevuelta,
        precioUnitario: i.precioUnitario,
        descuento: 0,
        tipoImpuesto: i.tipoImpuesto as ItemDocumento['tipoImpuesto'],
      }));

      const doc: Documento = {
        id: generarId(),
        tipo: 'NC',
        numeroGeneracion: generarNumeroGeneracion(),
        fechaEmision: new Date().toISOString(),
        clienteId: docOriginal!.clienteId,
        clienteNombre: docOriginal!.clienteNombre,
        items: itemsDoc,
        subtotal: subtotalNC,
        descuentoGlobal: 0,
        iva: ivaNC,
        total: totalNC,
        metodoPago: docOriginal!.metodoPago,
        estado: contingenciaActiva ? 'Contingencia' : 'Procesada',
        codigoRecepcion: contingenciaActiva ? 'PEND-' + generarId() : generarCodigoRecepcion(),
        ambiente: contribuyente.ambiente,
        envioCorreo: correoDestino
          ? { destinatario: correoDestino, fechaEnvio: new Date().toISOString(), estado: 'Enviado' }
          : null,
        documentoOriginalId: docOriginal!.id,
        documentoOriginalNumero: docOriginal!.numeroGeneracion,
        documentoOriginalTipo: docOriginal!.tipo,
        motivoNC: motivo as MotivoNC,
        motivoNCDetalle: motivoDetalle,
      };

      addDocumento(doc);
      setResultado(doc);

      if (correoDestino) {
        addToast('exito', `Nota de crédito enviada a ${correoDestino}`);
      } else {
        addToast('exito', 'Nota de crédito emitida correctamente');
      }
    }, 1200);
  };

  // === RENDER RESULTADO ===
  if (resultado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center animate-slide-up">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            resultado.estado === 'Contingencia' ? 'bg-accent-100' : 'bg-success-100'
          }`}>
            {resultado.estado === 'Contingencia' ? (
              <AlertTriangle className="h-8 w-8 text-accent-600" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-success-600" />
            )}
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-800">Nota de crédito emitida correctamente</h1>
          <p className="mt-1 text-sm text-neutral-500">NC · {resultado.numeroGeneracion}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-left">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Número de generación</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{resultado.numeroGeneracion}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Documento original</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{resultado.documentoOriginalTipo} · {resultado.documentoOriginalNumero}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Total a acreditar</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{formatMoneda(resultado.total)}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">IVA a favor</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{formatMoneda(resultado.iva)}</p>
            </div>
          </div>

          {resultado.envioCorreo && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3">
              <Mail className="h-4 w-4 text-success-600" />
              <p className="text-sm text-success-800">Enviada a <strong>{resultado.envioCorreo.destinatario}</strong></p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate('detalle-documento', { id: resultado.id })} className="btn-secondary">
              <FileText className="h-4 w-4" /> Ver documento
            </button>
            <button onClick={() => addToast('info', `Descargando PDF: ${resultado.numeroGeneracion}.pdf`)} className="btn-secondary">
              <Download className="h-4 w-4" /> Descargar PDF
            </button>
            <button onClick={() => { setResultado(null); setDocOriginalId(''); setItemsNC([]); setMotivo(''); setMotivoDetalle(''); }} className="btn-primary">
              <Plus className="h-4 w-4" /> Nueva nota de crédito
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER PROCESANDO ===
  if (procesando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-lg font-semibold text-neutral-700">Procesando nota de crédito...</p>
        </div>
      </div>
    );
  }

  // === RENDER FORMULARIO ===
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Nueva nota de crédito</h1>
        <p className="mt-1 text-sm text-neutral-500">Devoluciones, descuentos posteriores o corrección de errores</p>
      </div>

      {/* Paso 1: Buscar documento original */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-neutral-700 mb-3">Paso 1: Seleccionar documento original</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número de generación o cliente..."
            className="input pl-9"
          />
        </div>

        {errors.docOriginal && <p className="mb-2 text-xs text-error-600">{errors.docOriginal}</p>}

        {!docOriginalId && (
          <div className="rounded-lg border border-neutral-200 max-h-64 overflow-y-auto">
            {filteredDocs.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-neutral-400">No hay documentos válidos para crear nota de crédito</p>
            ) : (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => seleccionarDoc(doc)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-700">{doc.tipo} · {doc.numeroGeneracion}</p>
                    <p className="text-xs text-neutral-400">{doc.clienteNombre} · {formatFechaHora(doc.fechaEmision)} · {formatMoneda(doc.total)}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary-500" />
                </button>
              ))
            )}
          </div>
        )}

        {docOriginal && (
          <div className="rounded-lg border border-success-200 bg-success-50 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-success-800">{docOriginal.tipo} · {docOriginal.numeroGeneracion}</p>
                <p className="text-xs text-success-700">{docOriginal.clienteNombre} · {formatFechaHora(docOriginal.fechaEmision)} · {formatMoneda(docOriginal.total)}</p>
              </div>
              <button
                onClick={() => { setDocOriginalId(''); setItemsNC([]); }}
                className="rounded p-1 text-success-600 hover:bg-success-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Paso 2: Seleccionar items */}
      {docOriginal && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-3">Paso 2: Seleccionar items y cantidades a devolver</h2>
          {errors.items && <p className="mb-2 text-xs text-error-600">{errors.items}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <th className="pb-2 font-semibold text-neutral-600">Producto</th>
                  <th className="pb-2 font-semibold text-neutral-600 text-center">Cant. original</th>
                  <th className="pb-2 font-semibold text-neutral-600 text-center">Cant. a devolver</th>
                  <th className="pb-2 font-semibold text-neutral-600 text-right">Precio</th>
                  <th className="pb-2 font-semibold text-neutral-600 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {itemsNC.map((item) => (
                  <tr key={item.productoId} className="border-b border-neutral-100">
                    <td className="py-2 font-medium text-neutral-700">{item.nombre}</td>
                    <td className="py-2 text-center text-neutral-600">{item.cantidadOriginal}</td>
                    <td className="py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateCantidadDevuelta(item.productoId, item.cantidadDevuelta - 1)}
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center font-medium">{item.cantidadDevuelta}</span>
                        <button
                          onClick={() => updateCantidadDevuelta(item.productoId, item.cantidadDevuelta + 1)}
                          disabled={item.cantidadDevuelta >= item.cantidadOriginal}
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 text-right text-neutral-600">{formatMoneda(item.precioUnitario)}</td>
                    <td className="py-2 text-right font-medium text-neutral-700">
                      {item.cantidadDevuelta > 0 ? formatMoneda(item.cantidadDevuelta * item.precioUnitario) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales NC */}
          {itemsSeleccionados.length > 0 && (
            <div className="mt-4 border-t border-neutral-200 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal a acreditar</span><span className="font-medium">{formatMoneda(subtotalNC)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">IVA a favor</span><span className="font-medium">{formatMoneda(ivaNC)}</span></div>
              <div className="flex justify-between border-t border-neutral-200 pt-1"><span className="font-bold text-neutral-800">Total a acreditar</span><span className="font-bold text-primary-600">{formatMoneda(totalNC)}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Paso 3: Motivo */}
      {docOriginal && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-3">Paso 3: Motivo de la nota de crédito</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Motivo"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoNC)}
              error={errors.motivo}
            >
              <option value="">Seleccionar motivo</option>
              {motivosNC.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </SelectField>
            <TextAreaField
              label="Detalle del motivo (opcional)"
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              placeholder="Describa el motivo en detalle..."
            />
          </div>
        </div>
      )}

      {/* Botones */}
      {docOriginal && (
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => { setDocOriginalId(''); setItemsNC([]); setMotivo(''); setMotivoDetalle(''); setErrors({}); }} className="btn-secondary">
            <X className="h-4 w-4" /> Cancelar
          </button>
          <button onClick={handleEmitir} className="btn-primary">
            <CheckCircle2 className="h-4 w-4" /> Emitir nota de crédito
          </button>
        </div>
      )}

      {/* Modal de confirmación */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirmar nota de crédito"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowConfirm(false)} className="btn-secondary">Cancelar</button>
            <button onClick={procesarEmision} className="btn-primary">
              {contingenciaActiva ? 'Emitir en contingencia' : 'Confirmar y emitir'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">¿Está seguro de emitir esta nota de crédito?</p>
          <div className="rounded-lg bg-neutral-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Documento original</span><span className="font-medium">{docOriginal?.tipo} · {docOriginal?.numeroGeneracion}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Items</span><span className="font-medium">{itemsSeleccionados.length}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Motivo</span><span className="font-medium">{motivosNC.find(m => m.value === motivo)?.label}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Total a acreditar</span><span className="font-bold text-primary-600">{formatMoneda(totalNC)}</span></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
