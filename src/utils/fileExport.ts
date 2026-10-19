import type { Contribuyente, Documento } from '@/types';
import { formatFechaHora, formatMoneda } from '@/utils/format';

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  contribuyente: Contribuyente;
  documentos: Documento[];
  productos: unknown[];
  clientes: unknown[];
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombre;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function crearJSONBlob(documento: Documento, contribuyente: Contribuyente) {
  const payload = {
    identificacion: {
      version: 1,
      ambiente: documento.ambiente === 'Produccion' ? '01' : '00',
      tipoDte: documento.tipo,
      codigoGeneracion: documento.numeroGeneracion,
      fechaEmision: documento.fechaEmision.slice(0, 10),
    },
    emisor: contribuyente,
    receptor: {
      nombre: documento.clienteNombre,
      clienteId: documento.clienteId,
    },
    cuerpoDocumento: documento.items.map((item, index) => ({
      numItem: index + 1,
      codigo: item.codigo,
      descripcion: item.nombre,
      cantidad: item.cantidad,
      precioUni: item.precioUnitario,
      ventaGravada: item.tipoImpuesto === 'GravadoIVA13'
        ? item.cantidad * item.precioUnitario - item.descuento
        : 0,
      ventaExenta: item.tipoImpuesto === 'Exento'
        ? item.cantidad * item.precioUnitario - item.descuento
        : 0,
      ventaNoSuj: item.tipoImpuesto === 'NoSujeto'
        ? item.cantidad * item.precioUnitario - item.descuento
        : 0,
    })),
    resumen: {
      subtotal: documento.subtotal,
      descuento: documento.descuentoGlobal,
      iva: documento.iva,
      total: documento.total,
      metodoPago: documento.metodoPago,
    },
    documentoRelacionado: documento.documentoOriginalNumero
      ? {
          codigoGeneracion: documento.documentoOriginalNumero,
          tipoDte: documento.documentoOriginalTipo,
          motivo: documento.motivoNC,
        }
      : undefined,
    codigoRecepcion: documento.codigoRecepcion,
    estado: documento.estado,
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
}

export function descargarJSON(documento: Documento, contribuyente: Contribuyente) {
  descargarBlob(crearJSONBlob(documento, contribuyente), `${documento.numeroGeneracion}.json`);
}

function escaparPdf(texto: string) {
  return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function crearPDFBlob(documento: Documento, contribuyente: Contribuyente) {
  const lineas = [
    contribuyente.nombreRazonSocial,
    contribuyente.nombreComercial,
    `${documento.tipo} - ${documento.numeroGeneracion}`,
    `Fecha: ${formatFechaHora(documento.fechaEmision)}`,
    `Cliente: ${documento.clienteNombre}`,
    '',
    ...documento.items.map(
      (item) => `${item.cantidad} x ${item.nombre}  ${formatMoneda(item.cantidad * item.precioUnitario - item.descuento)}`,
    ),
    '',
    `Subtotal: ${formatMoneda(documento.subtotal)}`,
    `IVA: ${formatMoneda(documento.iva)}`,
    `Total: ${formatMoneda(documento.total)}`,
    `Estado: ${documento.estado}`,
    `Codigo de recepcion: ${documento.codigoRecepcion}`,
  ];

  const stream = [
    'BT',
    '/F1 12 Tf',
    '50 770 Td',
    ...lineas.flatMap((linea, index) => [
      `(${escaparPdf(linea)}) Tj`,
      ...(index < lineas.length - 1 ? ['0 -18 Td'] : []),
    ]),
    'ET',
  ].join('\n');
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objetos.forEach((objeto, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function descargarPDF(documento: Documento, contribuyente: Contribuyente) {
  descargarBlob(crearPDFBlob(documento, contribuyente), `${documento.numeroGeneracion}.pdf`);
}

export function descargarBackup(payload: BackupPayload, nombre: string) {
  descargarBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    `${nombre}.json`,
  );
}

export async function blobABase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
