import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import ClienteSelector from '@/components/ClienteSelector';
import Modal from '@/components/Modal';
import { InputField } from '@/components/FormFields';
import { formatMoneda, generarNumeroGeneracion, generarCodigoRecepcion, generarId, numeroALetras } from '@/utils/format';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  FileText,
  Download,
  Mail,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { Producto, ItemDocumento, MetodoPago, Documento, TipoDocumento } from '@/types';

interface PuntoVentaProps {
  tipoDocumento: TipoDocumento;
  requiereContribuyente: boolean;
  titulo: string;
  subtitulo: string;
  mensajeAyuda?: string;
}

export default function PuntoVenta({ tipoDocumento, requiereContribuyente, titulo, subtitulo, mensajeAyuda }: PuntoVentaProps) {
  const { productos, clientes, contribuyente, contingenciaActiva, addDocumento, addToast, navigate } = useApp();

  const [clienteId, setClienteId] = useState('');
  const [clienteError, setClienteError] = useState('');
  const [correoConsumidor, setCorreoConsumidor] = useState('');
  const [showCorreoInput, setShowCorreoInput] = useState(false);

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ItemDocumento[]>([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);

  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<Documento | null>(null);


  const productosActivos = productos.filter((p) => p.estado === 'Activo');

  const filteredProductos = useMemo(() => {
    if (!search) return productosActivos.slice(0, 6);
    const s = search.toLowerCase();
    return productosActivos.filter(
      (p) => p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s)
    );
  }, [productosActivos, search]);

  const clienteSeleccionado = clientes.find((c) => c.id === clienteId);
  const esConsumidorFinal = clienteSeleccionado?.tipoCliente === 'ConsumidorFinal' || !clienteSeleccionado;

  // Cálculos
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const sub = item.cantidad * item.precioUnitario - item.descuento;
      return acc + sub;
    }, 0);
  }, [items]);

  const totalDescuento = descuentoGlobal;
  const baseGravable = subtotal - totalDescuento;
  const iva = useMemo(() => {
    const gravado = items
      .filter((i) => i.tipoImpuesto === 'GravadoIVA13')
      .reduce((acc, item) => {
        const sub = item.cantidad * item.precioUnitario - item.descuento;
        const proporcion = subtotal > 0 ? sub / subtotal : 0;
        return acc + sub - totalDescuento * proporcion;
      }, 0);
    return gravado * 0.13;
  }, [items, subtotal, totalDescuento]);

  const total = baseGravable + iva;
  const cambio = metodoPago === 'Efectivo' && montoRecibido > 0 ? montoRecibido - total : 0;

  const addItem = (producto: Producto) => {
    const existing = items.find((i) => i.productoId === producto.id);
    if (existing) {
      setItems(items.map((i) =>
        i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setItems([...items, {
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precioUnitario,
        descuento: 0,
        tipoImpuesto: producto.tipoImpuesto,
      }]);
    }
    setSearch('');
  };

  const updateItem = (productoId: string, field: keyof ItemDocumento, value: number) => {
    setItems(items.map((i) => (i.productoId === productoId ? { ...i, [field]: value } : i)));
  };

  const removeItem = (productoId: string) => {
    setItems(items.filter((i) => i.productoId !== productoId));
  };

  const limpiarVenta = () => {
    setClienteId('');
    setClienteError('');
    setCorreoConsumidor('');
    setShowCorreoInput(false);
    setItems([]);
    setDescuentoGlobal(0);
    setMontoRecibido(0);
    setMetodoPago('Efectivo');
    setSearch('');
  };

  const validar = (): boolean => {
    if (items.length === 0) {
      addToast('error', 'Debe agregar al menos un producto');
      return false;
    }
    if (!clienteId) {
      setClienteError('Seleccione un cliente o use "Consumidor final"');
      return false;
    }
    if (requiereContribuyente && clienteSeleccionado?.tipoCliente !== 'Contribuyente') {
      setClienteError('Para CCF el cliente debe ser contribuyente con NIT y NRC');
      return false;
    }
    if (requiereContribuyente && (!clienteSeleccionado?.numeroDocumento || !clienteSeleccionado?.nrc)) {
      setClienteError('El cliente contribuyente debe tener NIT y NRC');
      return false;
    }
    return true;
  };

  const handleEmitir = () => {
    if (!validar()) return;
    setShowConfirm(true);
  };

  const procesarEmision = (enContingencia: boolean = false) => {
    setProcesando(true);
    setShowConfirm(false);

    setTimeout(() => {
      setProcesando(false);

      const correoDestino = esConsumidorFinal
        ? correoConsumidor || ''
        : clienteSeleccionado?.correo || '';

      const doc: Documento = {
        id: generarId(),
        tipo: tipoDocumento,
        numeroGeneracion: generarNumeroGeneracion(),
        fechaEmision: new Date().toISOString(),
        clienteId: clienteId,
        clienteNombre: clienteSeleccionado?.nombreRazonSocial || 'Consumidor Final',
        items: [...items],
        subtotal,
        descuentoGlobal: totalDescuento,
        iva,
        total,
        metodoPago,
        montoRecibido: metodoPago === 'Efectivo' ? montoRecibido : undefined,
        cambio: metodoPago === 'Efectivo' && cambio > 0 ? cambio : undefined,
        estado: enContingencia ? 'Contingencia' : 'Procesada',
        codigoRecepcion: enContingencia ? 'PEND-' + generarId() : generarCodigoRecepcion(),
        ambiente: contribuyente.ambiente,
        envioCorreo: correoDestino
          ? {
              destinatario: correoDestino,
              fechaEnvio: new Date().toISOString(),
              estado: 'Enviado',
            }
          : null,
      };

      addDocumento(doc);
      setResultado(doc);

      if (correoDestino) {
        addToast('exito', `Documento enviado a ${correoDestino}`);
      } else if (enContingencia) {
        addToast('advertencia', 'Documento emitido en contingencia. Se transmitirá al MH cuando se restablezca la conexión.');
      } else {
        addToast('exito', 'Documento emitido correctamente');
      }
    }, 1200);
  };

  const handleConfirmar = () => {
    if (contingenciaActiva) {
      procesarEmision(true);
    } else {
      // Simular: siempre procesa con éxito, pero mostramos opción de contingencia
      procesarEmision(false);
    }
  };

  const handleDescargarPDF = () => {
    if (!resultado) return;
    addToast('info', `Descargando PDF: ${resultado.numeroGeneracion}.pdf`);
  };

  const handleDescargarJSON = () => {
    if (!resultado) return;
    addToast('info', `Descargando JSON: ${resultado.numeroGeneracion}.json`);
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

          <h1 className="mt-4 text-xl font-bold text-neutral-800">
            {resultado.estado === 'Contingencia' ? 'Documento emitido en contingencia' : 'Documento emitido correctamente'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{resultado.tipo} · {resultado.numeroGeneracion}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-left">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Número de generación</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{resultado.numeroGeneracion}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Código de recepción</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700 font-mono text-xs">{resultado.codigoRecepcion}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Cliente</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{resultado.clienteNombre}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Total</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">{formatMoneda(resultado.total)}</p>
            </div>
          </div>

          {resultado.envioCorreo && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3">
              <Mail className="h-4 w-4 text-success-600" />
              <p className="text-sm text-success-800">
                Documento enviado a <strong>{resultado.envioCorreo.destinatario}</strong> (JSON y PDF)
              </p>
            </div>
          )}

          {resultado.estado === 'Contingencia' && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-accent-200 bg-accent-50 p-3">
              <AlertTriangle className="h-4 w-4 text-accent-600" />
              <p className="text-sm text-accent-800">
                Se transmitirá al MH cuando se restablezca la conexión
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate('detalle-documento', { id: resultado.id })} className="btn-secondary">
              <FileText className="h-4 w-4" />
              Ver documento
            </button>
            <button onClick={handleDescargarPDF} className="btn-secondary">
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
            <button onClick={handleDescargarJSON} className="btn-secondary">
              <Download className="h-4 w-4" />
              Descargar JSON
            </button>
            <button
              onClick={() => { setResultado(null); limpiarVenta(); }}
              className="btn-primary"
            >
              <ShoppingCart className="h-4 w-4" />
              {tipoDocumento === 'FCF' ? 'Nueva venta' : tipoDocumento === 'CCF' ? 'Nuevo CCF' : 'Nueva NC'}
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
          <p className="mt-4 text-lg font-semibold text-neutral-700">Procesando documento...</p>
          <p className="mt-1 text-sm text-neutral-500">Enviando al Ministerio de Hacienda</p>
        </div>
      </div>
    );
  }

  // === RENDER FORMULARIO ===
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">{titulo}</h1>
        <p className="mt-1 text-sm text-neutral-500">{subtitulo}</p>
      </div>

      {mensajeAyuda && (
        <div className="flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-primary-600" />
          <p className="text-sm text-primary-800">{mensajeAyuda}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: cliente + productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-neutral-700 mb-3">Cliente</h2>
            <ClienteSelector
              clientes={clientes}
              value={clienteId}
              onChange={(id) => { setClienteId(id); setClienteError(''); }}
              onAddNew={() => navigate('clientes')}
              filterTipo={requiereContribuyente ? 'Contribuyente' : undefined}
              required
              error={clienteError}
            />
            {clienteSeleccionado && clienteSeleccionado.tipoCliente === 'ConsumidorFinal' && (
              <div className="mt-3">
                {!showCorreoInput ? (
                  <button
                    onClick={() => setShowCorreoInput(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Agregar correo para enviar el documento
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <InputField
                      label="Correo del cliente"
                      type="email"
                      value={correoConsumidor}
                      onChange={(e) => setCorreoConsumidor(e.target.value)}
                      placeholder="cliente@correo.com"
                    />
                    <button
                      onClick={() => { setShowCorreoInput(false); setCorreoConsumidor(''); }}
                      className="mt-5 rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            {clienteSeleccionado && clienteSeleccionado.tipoCliente === 'Contribuyente' && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-400">NIT</p>
                  <p className="font-medium text-neutral-700">{clienteSeleccionado.numeroDocumento}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">NRC</p>
                  <p className="font-medium text-neutral-700">{clienteSeleccionado.nrc}</p>
                </div>
                {clienteSeleccionado.direccion && (
                  <div className="col-span-2">
                    <p className="text-xs text-neutral-400">Dirección</p>
                    <p className="font-medium text-neutral-700">{clienteSeleccionado.direccion}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-neutral-700 mb-3">Productos</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por código o nombre..."
                className="input pl-9"
                autoFocus
              />
            </div>
            {search && filteredProductos.length > 0 && (
              <div className="mb-3 rounded-lg border border-neutral-200 max-h-48 overflow-y-auto">
                {filteredProductos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-700">{p.nombre}</p>
                      <p className="text-xs text-neutral-400">{p.codigo} · {formatMoneda(p.precioUnitario)}</p>
                    </div>
                    <Plus className="h-4 w-4 text-primary-500" />
                  </button>
                ))}
              </div>
            )}

            {/* Tabla de items */}
            {items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-400">Agregue productos a la venta</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="pb-2 font-semibold text-neutral-600">Producto</th>
                      <th className="pb-2 font-semibold text-neutral-600 text-center">Cant.</th>
                      <th className="pb-2 font-semibold text-neutral-600 text-right">Precio</th>
                      <th className="pb-2 font-semibold text-neutral-600 text-right">Desc.</th>
                      <th className="pb-2 font-semibold text-neutral-600 text-right">Subtotal</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const sub = item.cantidad * item.precioUnitario - item.descuento;
                      return (
                        <tr key={item.productoId} className="border-b border-neutral-100">
                          <td className="py-2">
                            <p className="font-medium text-neutral-700">{item.nombre}</p>
                            {requiereContribuyente && item.tipoImpuesto === 'GravadoIVA13' && (
                              <p className="text-xs text-neutral-400">
                                IVA: {formatMoneda(sub * 0.13)}
                              </p>
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => updateItem(item.productoId, 'cantidad', Math.max(1, item.cantidad - 1))}
                                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.cantidad}</span>
                              <button
                                onClick={() => updateItem(item.productoId, 'cantidad', item.cantidad + 1)}
                                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 text-right text-neutral-600">{formatMoneda(item.precioUnitario)}</td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.descuento || ''}
                              onChange={(e) => updateItem(item.productoId, 'descuento', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-20 rounded border border-neutral-200 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-2 text-right font-medium text-neutral-700">{formatMoneda(sub)}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => removeItem(item.productoId)}
                              className="rounded p-1 text-neutral-400 hover:bg-error-50 hover:text-error-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

        {/* Columna derecha: totales + pago */}
        <div className="space-y-6">
          <div className="card p-5 sticky top-0">
            <h2 className="text-sm font-bold text-neutral-700 mb-4">Totales</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium text-neutral-700">{formatMoneda(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Descuento global</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={descuentoGlobal || ''}
                  onChange={(e) => setDescuentoGlobal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 rounded border border-neutral-200 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">IVA 13%</span>
                <span className="font-medium text-neutral-700">{formatMoneda(iva)}</span>
              </div>
              <div className="border-t border-neutral-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-neutral-800">Total a pagar</span>
                  <span className="text-lg font-bold text-primary-600">{formatMoneda(total)}</span>
                </div>
              </div>
              {total > 0 && (
                <p className="text-xs text-neutral-400 italic">{numeroALetras(total)}</p>
              )}
            </div>

            {/* Pago */}
            <div className="mt-4 border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-bold text-neutral-700 mb-3">Pago</h3>
              <div className="mb-3">
                <label className="label">Método de pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="input"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Credito">Crédito</option>
                </select>
              </div>
              {metodoPago === 'Efectivo' && (
                <div className="space-y-2">
                  <InputField
                    label="Monto recibido"
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoRecibido || ''}
                    onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  {cambio > 0 && (
                    <div className="flex justify-between rounded-lg bg-success-50 px-3 py-2 text-sm">
                      <span className="text-success-700">Cambio</span>
                      <span className="font-bold text-success-700">{formatMoneda(cambio)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleEmitir}
                disabled={items.length === 0}
                className="btn-primary w-full"
              >
                <CheckCircle2 className="h-4 w-4" />
                {tipoDocumento === 'FCF' ? 'Emitir factura' : 'Emitir CCF'}
              </button>
              <button
                onClick={() => { if (items.length > 0) { if (confirm('¿Seguro que desea cancelar la venta?')) limpiarVenta(); } }}
                className="btn-secondary w-full"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirmar emisión"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowConfirm(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleConfirmar} className="btn-primary">
              {contingenciaActiva ? 'Emitir en contingencia' : 'Confirmar y emitir'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">¿Está seguro de emitir el siguiente documento?</p>
          <div className="rounded-lg bg-neutral-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Tipo</span><span className="font-medium">{tipoDocumento}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Cliente</span><span className="font-medium">{clienteSeleccionado?.nombreRazonSocial || 'Consumidor Final'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Items</span><span className="font-medium">{items.length}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Total</span><span className="font-bold text-primary-600">{formatMoneda(total)}</span></div>
          </div>
          {contingenciaActiva && (
            <div className="flex items-start gap-2 rounded-lg border border-accent-200 bg-accent-50 p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-accent-600" />
              <p className="text-xs text-accent-800">El documento se emitirá en modo contingencia y se transmitirá al MH cuando se restablezca la conexión.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
