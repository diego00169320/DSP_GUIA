export type Ambiente = 'Pruebas' | 'Produccion';

export type TipoDocumento = 'FCF' | 'CCF' | 'NC';

export type EstadoDocumento =
  | 'Procesada'
  | 'Invalidada'
  | 'Contingencia'
  | 'PendienteTransmision';

export type TipoCliente = 'ConsumidorFinal' | 'Contribuyente';

export type TipoDocumentoIdentificacion = 'DUI' | 'NIT' | 'Pasaporte' | 'Otro';

export type TipoImpuesto = 'GravadoIVA13' | 'Exento' | 'NoSujeto';

export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Credito';

export type EstadoEnvioCorreo = 'Enviado' | 'Fallido' | 'Pendiente';

export type EstadoProducto = 'Activo' | 'Inactivo';

export type MotivoNC =
  | 'Devolucion'
  | 'Descuento'
  | 'ErrorFacturacion'
  | 'ProductoMalEstado'
  | 'Otro';

export interface Contribuyente {
  nombreRazonSocial: string;
  nombreComercial: string;
  nit: string;
  nrc: string;
  actividadEconomica: string;
  tipoEstablecimiento: string;
  departamento: string;
  municipio: string;
  direccion: string;
  telefono: string;
  correo: string;
  representanteLegal: string;
  // Certificado
  certificadoCargado: boolean;
  certificadoNombre: string;
  certificadoVencimiento: string; // ISO date
  // Ambiente
  ambiente: Ambiente;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  unidadMedida: string;
  precioUnitario: number;
  tipoImpuesto: TipoImpuesto;
  estado: EstadoProducto;
}

export interface Cliente {
  id: string;
  tipoCliente: TipoCliente;
  tipoDocumento: TipoDocumentoIdentificacion;
  numeroDocumento: string;
  nombreRazonSocial: string;
  actividadEconomica: string;
  nrc: string;
  departamento: string;
  municipio: string;
  direccion: string;
  telefono: string;
  correo: string;
  estado: 'Activo' | 'Inactivo';
}

export interface ItemDocumento {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoImpuesto: TipoImpuesto;
}

export interface EnvioCorreo {
  destinatario: string;
  fechaEnvio: string;
  estado: EstadoEnvioCorreo;
}

export interface Documento {
  id: string;
  tipo: TipoDocumento;
  numeroGeneracion: string;
  fechaEmision: string; // ISO datetime
  clienteId: string;
  clienteNombre: string;
  items: ItemDocumento[];
  subtotal: number;
  descuentoGlobal: number;
  iva: number;
  total: number;
  metodoPago: MetodoPago;
  montoRecibido?: number;
  cambio?: number;
  estado: EstadoDocumento;
  codigoRecepcion: string;
  ambiente: Ambiente;
  envioCorreo: EnvioCorreo | null;
  // NC-specific
  documentoOriginalId?: string;
  documentoOriginalNumero?: string;
  documentoOriginalTipo?: TipoDocumento;
  motivoNC?: MotivoNC;
  motivoNCDetalle?: string;
  // Invalidacion
  fechaInvalidacion?: string;
  motivoInvalidacion?: string;
}

export interface Backup {
  id: string;
  nombre: string;
  fecha: string;
  tamano: string;
}

export interface ContingenciaRegistro {
  id: string;
  fechaInicio: string;
  fechaFin: string | null;
  motivo: string;
  cantidadDocumentos: number;
  fechaSincronizacion: string | null;
}

export interface Usuario {
  nombre: string;
  correo: string;
}
