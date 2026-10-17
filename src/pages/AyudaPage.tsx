import { useApp } from '@/context/AppContext';
import {
  ShoppingCart,
  FileText,
  Receipt,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

export default function AyudaPage() {
  const { navigate } = useApp();

  const documentos = [
    {
      tipo: 'FCF',
      nombre: 'Factura de Consumidor Final Electrónica',
      icon: ShoppingCart,
      color: 'bg-primary-100 text-primary-600',
      cuando: 'Cuando se vende a consumidores finales (personas comunes que no son contribuyentes).',
      dirigido: 'Consumidores finales, público en general.',
      creditoFiscal: 'No otorga derecho a crédito fiscal.',
      datos: 'Datos del emisor, datos del cliente (opcional), items, totales con IVA 13%.',
      invalidacion: 'Se puede invalidar hasta 3 meses después de emitida.',
    },
    {
      tipo: 'CCF',
      nombre: 'Comprobante de Crédito Fiscal Electrónico',
      icon: FileText,
      color: 'bg-success-100 text-success-600',
      cuando: 'Cuando se vende a otros contribuyentes (empresas o personas con NIT y NRC).',
      dirigido: 'Contribuyentes con NIT y NRC registrados en el MH.',
      creditoFiscal: 'Sí otorga derecho a crédito fiscal al cliente.',
      datos: 'Datos del emisor, datos completos del cliente contribuyente (NIT, NRC, dirección), items con IVA desglosado, totales.',
      invalidacion: 'Se puede invalidar hasta el 10º día hábil del mes siguiente a la emisión.',
    },
    {
      tipo: 'NC',
      nombre: 'Nota de Crédito Electrónica',
      icon: Receipt,
      color: 'bg-warning-100 text-warning-600',
      cuando: 'Para devoluciones, descuentos posteriores o corrección de errores en un documento ya emitido.',
      dirigido: 'Al cliente del documento original (FCF o CCF).',
      creditoFiscal: 'Acredita el IVA a favor del cliente (si el documento original era CCF).',
      datos: 'Documento original vinculado, items y cantidades a devolver/ajustar, motivo obligatorio.',
      invalidacion: 'Sigue las mismas reglas que el documento original al que está vinculada.',
    },
  ];

  const glosario = [
    { termino: 'DTE', definicion: 'Documento Tributario Electrónico. Es el formato digital de los comprobantes fiscales que se envían al Ministerio de Hacienda.' },
    { termino: 'NIT', definicion: 'Número de Identificación Tributaria. Identifica a los contribuyentes ante el MH. Consta de 14 dígitos sin guion.' },
    { termino: 'NRC', definicion: 'Número de Registro de Contribuyente. Identifica al negocio o empresa registrada ante el MH.' },
    { termino: 'DUI', definicion: 'Documento Único de Identidad. Es el carné de identidad personal en El Salvador, 9 dígitos sin guion.' },
    { termino: 'MH', definicion: 'Ministerio de Hacienda. Es la entidad gubernamental que regula y recibe los documentos tributarios electrónicos.' },
    { termino: 'Contingencia', definicion: 'Modo de operación cuando no hay conexión con el MH. Los documentos se guardan localmente y se transmiten cuando se restablece la conexión.' },
    { termino: 'Invalidación', definicion: 'Proceso por el cual se anula un documento emitido, dentro de los plazos legales establecidos (3 meses para FCF, 10º día hábil del mes siguiente para CCF).' },
    { termino: 'IVA', definicion: 'Impuesto al Valor Agregado. En El Salvador es del 13% sobre las operaciones gravadas.' },
    { termino: 'Número de generación', definicion: 'Número único que el sistema DTE asigna a cada documento al ser generado. Se usa como nombre del archivo enviado al cliente.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Ayuda y glosario</h1>
        <p className="mt-1 text-sm text-neutral-500">Tipos de documento y términos relacionados con la facturación electrónica</p>
      </div>

      {/* Tipos de documento */}
      <div>
        <h2 className="text-lg font-bold text-neutral-800 mb-3">Tipos de documento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documentos.map((doc) => {
            const Icon = doc.icon;
            return (
              <div key={doc.tipo} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${doc.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400">{doc.tipo}</p>
                    <p className="text-sm font-bold text-neutral-700">{doc.nombre}</p>
                  </div>
                </div>
                <dl className="space-y-2 text-xs text-neutral-600">
                  <div><dt className="font-semibold text-neutral-700">¿Cuándo se usa?</dt><dd className="mt-0.5">{doc.cuando}</dd></div>
                  <div><dt className="font-semibold text-neutral-700">Dirigido a</dt><dd className="mt-0.5">{doc.dirigido}</dd></div>
                  <div><dt className="font-semibold text-neutral-700">Crédito fiscal</dt><dd className="mt-0.5">{doc.creditoFiscal}</dd></div>
                  <div><dt className="font-semibold text-neutral-700">Datos que lleva</dt><dd className="mt-0.5">{doc.datos}</dd></div>
                  <div><dt className="font-semibold text-neutral-700">Invalidación</dt><dd className="mt-0.5">{doc.invalidacion}</dd></div>
                </dl>
                <button
                  onClick={() => navigate(doc.tipo === 'FCF' ? 'nueva-venta' : doc.tipo === 'CCF' ? 'nuevo-ccf' : 'nueva-nc')}
                  className="btn-secondary text-xs w-full mt-4"
                >
                  Crear {doc.tipo}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Glosario */}
      <div>
        <h2 className="text-lg font-bold text-neutral-800 mb-3">Glosario de términos</h2>
        <div className="card divide-y divide-neutral-100">
          {glosario.map((item) => (
            <div key={item.termino} className="flex gap-4 p-4">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-sm font-bold text-primary-700">
                  <BookOpen className="h-3.5 w-3.5" />
                  {item.termino}
                </span>
              </div>
              <p className="text-sm text-neutral-600 flex-1">{item.definicion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enlace oficial */}
      <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 p-4">
        <div>
          <p className="text-sm font-semibold text-primary-800">Portal oficial de facturación electrónica</p>
          <p className="text-xs text-primary-600">Consulte la normativa vigente en factura.gob.sv</p>
        </div>
        <a
          href="https://factura.gob.sv"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-xs"
        >
          <ExternalLink className="h-4 w-4" /> factura.gob.sv
        </a>
      </div>
    </div>
  );
}
