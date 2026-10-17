import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import EstadoBadge from '@/components/EstadoBadge';
import Modal from '@/components/Modal';
import { TextAreaField, SelectField } from '@/components/FormFields';
import { formatMoneda, formatFechaHora, formatFecha, puedeInvalidar } from '@/utils/format';
import { motivosInvalidacion } from '@/data/catalogos';
import {
  ArrowLeft,
  Download,
  Mail,
  Ban,
  Link2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DetalleDocumentoPage() {
  const { documentos, contribuyente, clientes, navParams, navigate, invalidarDocumento, addToast } = useApp();
  const [showInvalidar, setShowInvalidar] = useState(false);
  const [motivoInvalidacion, setMotivoInvalidacion] = useState('');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [invalidadoMsg, setInvalidadoMsg] = useState(false);

  const doc = documentos.find((d) => d.id === navParams.id);

  useEffect(() => {
    if (navParams.invalidar === 'true' && doc && doc.estado === 'Procesada') {
      const inv = puedeInvalidar(doc.tipo, doc.fechaEmision);
      if (inv.puede) setShowInvalidar(true);
    }
  }, [navParams, doc]);

  const invalidacion = useMemo(() => {
    if (!doc) return null;
    return puedeInvalidar(doc.tipo, doc.fechaEmision);
  }, [doc]);

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-neutral-500">Documento no encontrado</p>
        <button onClick={() => navigate('documentos')} className="btn-primary mt-4">Volver a documentos</button>
      </div>
    );
  }

  const cliente = clientes.find((c) => c.id === doc.clienteId);
  const docOriginal = doc.documentoOriginalId ? documentos.find((d) => d.id === doc.documentoOriginalId) : null;

  const handleInvalidar = () => {
    if (!motivoInvalidacion) {
      addToast('error', 'Debe seleccionar un motivo de invalidación');
      return;
    }
    const motivoFinal = motivoInvalidacion === 'Otro' ? motivoOtro : motivoInvalidacion;
    if (motivoFinal.length < 10) {
      addToast('error', 'El motivo debe tener al menos 10 caracteres');
      return;
    }
    if (!confirmIrreversible) {
      addToast('error', 'Debe marcar la casilla de confirmación');
      return;
    }

    invalidarDocumento(doc.id, motivoFinal);
    setShowInvalidar(false);
    setInvalidadoMsg(true);
    if (doc.envioCorreo) {
      addToast('exito', `Documento invalidado. Se envió un correo de notificación a ${doc.envioCorreo.destinatario}`);
    } else {
      addToast('exito', 'Documento invalidado correctamente');
    }
  };

  const tipoLabel = doc.tipo === 'FCF' ? 'Factura de Consumidor Final' : doc.tipo === 'CCF' ? 'Comprobante de Crédito Fiscal' : 'Nota de Crédito';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('documentos')} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-800">{tipoLabel}</h1>
            <EstadoBadge estado={doc.estado} />
          </div>
          <p className="mt-1 text-sm text-neutral-500">No. de generación: <span className="font-mono font-medium text-neutral-700">{doc.numeroGeneracion}</span></p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Datos del documento */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-3">Datos del documento</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Fecha de emisión</dt><dd className="font-medium text-neutral-700">{formatFechaHora(doc.fechaEmision)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Código de recepción</dt><dd className="font-mono text-xs font-medium text-neutral-700">{doc.codigoRecepcion}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Ambiente</dt><dd className="font-medium text-neutral-700">{doc.ambiente === 'Produccion' ? 'Producción' : 'Pruebas'}</dd></div>
            {doc.fechaInvalidacion && (
              <div className="flex justify-between"><dt className="text-neutral-500">Fecha de invalidación</dt><dd className="font-medium text-error-600">{formatFechaHora(doc.fechaInvalidacion)}</dd></div>
            )}
            {doc.motivoInvalidacion && (
              <div><dt className="text-neutral-500">Motivo de invalidación</dt><dd className="mt-1 text-neutral-700">{doc.motivoInvalidacion}</dd></div>
            )}
          </dl>
        </div>

        {/* Envío de correo */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-3">Envío de correo</h2>
          {doc.envioCorreo ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Destinatario</dt><dd className="font-medium text-neutral-700">{doc.envioCorreo.destinatario}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Fecha de envío</dt><dd className="font-medium text-neutral-700">{formatFechaHora(doc.envioCorreo.fechaEnvio)}</dd></div>
              <div className="flex justify-between items-center">
                <dt className="text-neutral-500">Estado</dt>
                <dd>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    doc.envioCorreo.estado === 'Enviado' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                  }`}>
                    {doc.envioCorreo.estado === 'Enviado' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {doc.envioCorreo.estado === 'Enviado' ? 'Enviado' : 'Fallido'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between"><dt className="text-neutral-500">Adjuntos</dt><dd className="text-xs text-neutral-600">{doc.numeroGeneracion}.json, {doc.numeroGeneracion}.pdf</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-neutral-400">No se envió correo (cliente sin correo electrónico)</p>
          )}
        </div>
      </div>

      {/* Emisor y receptor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-2">Emisor</h2>
          <dl className="space-y-1 text-sm text-neutral-600">
            <dt className="font-medium text-neutral-700">{contribuyente.nombreRazonSocial}</dt>
            <dd>NIT: {contribuyente.nit} · NRC: {contribuyente.nrc}</dd>
            <dd>{contribuyente.direccion}, {contribuyente.municipio}, {contribuyente.departamento}</dd>
            <dd>{contribuyente.correo}</dd>
          </dl>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-2">Receptor</h2>
          <dl className="space-y-1 text-sm text-neutral-600">
            <dt className="font-medium text-neutral-700">{doc.clienteNombre}</dt>
            {cliente?.numeroDocumento && cliente.numeroDocumento !== '000000000' && <dd>{cliente.tipoDocumento}: {cliente.numeroDocumento}</dd>}
            {cliente?.nrc && <dd>NRC: {cliente.nrc}</dd>}
            {cliente?.direccion && <dd>{cliente.direccion}, {cliente.municipio}, {cliente.departamento}</dd>}
            {cliente?.correo && <dd>{cliente.correo}</dd>}
          </dl>
        </div>
      </div>

      {/* NC: documento original vinculado */}
      {docOriginal && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-700 mb-2">Documento original vinculado</h2>
          <button
            onClick={() => navigate('detalle-documento', { id: docOriginal.id })}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Link2 className="h-4 w-4" />
            {docOriginal.tipo} · {docOriginal.numeroGeneracion} · {docOriginal.clienteNombre} · {formatMoneda(docOriginal.total)}
          </button>
          {doc.motivoNC && (
            <p className="mt-2 text-sm text-neutral-500">
              Motivo: <span className="font-medium text-neutral-700">
                {doc.motivoNC === 'Devolucion' ? 'Devolución' :
                 doc.motivoNC === 'Descuento' ? 'Descuento' :
                 doc.motivoNC === 'ErrorFacturacion' ? 'Error de facturación' :
                 doc.motivoNC === 'ProductoMalEstado' ? 'Producto en mal estado' : 'Otro'}
              </span>
              {doc.motivoNCDetalle && ` - ${doc.motivoNCDetalle}`}
            </p>
          )}
        </div>
      )}

      {/* Items y totales */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-neutral-700 mb-3">Detalle de items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="pb-2 font-semibold text-neutral-600">Producto</th>
                <th className="pb-2 font-semibold text-neutral-600 text-center">Cantidad</th>
                <th className="pb-2 font-semibold text-neutral-600 text-right">Precio</th>
                <th className="pb-2 font-semibold text-neutral-600 text-right">Descuento</th>
                <th className="pb-2 font-semibold text-neutral-600 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => {
                const sub = item.cantidad * item.precioUnitario - item.descuento;
                return (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2 font-medium text-neutral-700">{item.nombre}</td>
                    <td className="py-2 text-center text-neutral-600">{item.cantidad}</td>
                    <td className="py-2 text-right text-neutral-600">{formatMoneda(item.precioUnitario)}</td>
                    <td className="py-2 text-right text-neutral-600">{item.descuento > 0 ? formatMoneda(item.descuento) : '-'}</td>
                    <td className="py-2 text-right font-medium text-neutral-700">{formatMoneda(sub)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-t border-neutral-200 pt-4 space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-medium">{formatMoneda(doc.subtotal)}</span></div>
          {doc.descuentoGlobal > 0 && <div className="flex justify-between"><span className="text-neutral-500">Descuento global</span><span className="font-medium">{formatMoneda(doc.descuentoGlobal)}</span></div>}
          <div className="flex justify-between"><span className="text-neutral-500">IVA 13%</span><span className="font-medium">{formatMoneda(doc.iva)}</span></div>
          <div className="flex justify-between border-t border-neutral-200 pt-1"><span className="font-bold text-neutral-800">Total</span><span className="font-bold text-primary-600">{formatMoneda(doc.total)}</span></div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('documentos')} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => addToast('info', `Descargando PDF: ${doc.numeroGeneracion}.pdf`)} className="btn-secondary">
            <Download className="h-4 w-4" /> Descargar PDF
          </button>
          <button onClick={() => addToast('info', `Descargando JSON: ${doc.numeroGeneracion}.json`)} className="btn-secondary">
            <Download className="h-4 w-4" /> Descargar JSON
          </button>
          {doc.envioCorreo && (
            <button
              onClick={() => addToast('exito', `Correo reenviado a ${doc.envioCorreo!.destinatario}`)}
              className="btn-secondary"
            >
              <Mail className="h-4 w-4" /> Reenviar correo
            </button>
          )}
          {doc.estado === 'Procesada' && invalidacion && invalidacion.puede ? (
            <button onClick={() => setShowInvalidar(true)} className="btn-danger">
              <Ban className="h-4 w-4" /> Invalidar documento
            </button>
          ) : doc.estado === 'Procesada' && invalidacion && !invalidacion.puede ? (
            <button disabled className="btn-secondary opacity-50 cursor-not-allowed" title="Plazo vencido">
              <Ban className="h-4 w-4" /> Plazo de invalidación vencido el {formatFecha(invalidacion.fechaLimite.toISOString())}
            </button>
          ) : null}
        </div>
      </div>

      {/* Modal de invalidación */}
      <Modal
        open={showInvalidar}
        onClose={() => setShowInvalidar(false)}
        title="Invalidar documento"
        size="md"
        footer={
          <>
            <button onClick={() => setShowInvalidar(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={handleInvalidar}
              disabled={!motivoInvalidacion || !confirmIrreversible}
              className="btn-danger"
            >
              <Ban className="h-4 w-4" /> Confirmar invalidación
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-neutral-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Tipo</span><span className="font-medium">{doc.tipo} · {tipoLabel}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">No. generación</span><span className="font-mono font-medium">{doc.numeroGeneracion}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Fecha de emisión</span><span className="font-medium">{formatFecha(doc.fechaEmision)}</span></div>
            {invalidacion && (
              <>
                <div className="flex justify-between"><span className="text-neutral-500">Fecha límite para invalidar</span><span className="font-medium">{formatFecha(invalidacion.fechaLimite.toISOString())}</span></div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Días restantes</span>
                  <span className={`font-medium ${invalidacion.diasRestantes <= 7 ? 'text-warning-600' : 'text-success-600'}`}>
                    {invalidacion.diasRestantes} día(s)
                  </span>
                </div>
              </>
            )}
          </div>

          <SelectField
            label="Motivo de invalidación"
            required
            value={motivoInvalidacion}
            onChange={(e) => setMotivoInvalidacion(e.target.value)}
          >
            <option value="">Seleccionar motivo</option>
            {motivosInvalidacion.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </SelectField>

          {motivoInvalidacion === 'Otro' && (
            <TextAreaField
              label="Describa el motivo"
              required
              value={motivoOtro}
              onChange={(e) => setMotivoOtro(e.target.value)}
              placeholder="Mínimo 10 caracteres..."
            />
          )}

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmIrreversible}
              onChange={(e) => setConfirmIrreversible(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-error-600 focus:ring-error-500"
            />
            <span className="text-sm text-neutral-600">
              Entiendo que esta acción <strong>no se puede deshacer</strong> y el documento quedará invalidado permanentemente.
            </span>
          </label>
        </div>
      </Modal>

      {/* Mensaje de invalidación exitosa */}
      {invalidadoMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-white p-4 shadow-2xl animate-slide-up max-w-md">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-success-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-800">Documento invalidado</p>
              {doc.envioCorreo && (
                <p className="text-xs text-neutral-500">Se envió un correo de notificación a {doc.envioCorreo.destinatario}</p>
              )}
            </div>
            <button onClick={() => setInvalidadoMsg(false)} className="ml-auto text-neutral-400 hover:text-neutral-600">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
