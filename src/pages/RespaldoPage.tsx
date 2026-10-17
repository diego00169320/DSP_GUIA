import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatFechaHora, generarId } from '@/utils/format';
import { HardDriveDownload, Download, Loader2, CheckCircle2, Database } from 'lucide-react';

export default function RespaldoPage() {
  const { backups, addBackup, addToast } = useApp();
  const [generando, setGenerando] = useState(false);

  const handleGenerar = () => {
    setGenerando(true);
    setTimeout(() => {
      const ahora = new Date();
      const dia = String(ahora.getDate()).padStart(2, '0');
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const anio = ahora.getFullYear();
      const nombre = `Backup (${dia}-${mes}-${anio})`;
      const tamano = `${(Math.random() * 50 + 10).toFixed(1)} MB`;

      addBackup({
        id: generarId(),
        nombre,
        fecha: ahora.toISOString(),
        tamano,
      });

      setGenerando(false);
      addToast('exito', `Respaldo creado: ${nombre}`);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Respaldo</h1>
        <p className="mt-1 text-sm text-neutral-500">Generar y descargar copias de seguridad del sistema</p>
      </div>

      {/* Generar respaldo */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
            <Database className="h-7 w-7 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-neutral-800">Generar nuevo respaldo</h2>
            <p className="text-sm text-neutral-500">
              El archivo se nombrará con el formato <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono">Backup (DD-MM-AAAA)</code>
            </p>
          </div>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="btn-primary"
          >
            {generando ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
            ) : (
              <><HardDriveDownload className="h-4 w-4" /> Generar respaldo</>
            )}
          </button>
        </div>

        {generando && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div className="h-full bg-primary-600 animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="mt-2 text-xs text-neutral-500">Procesando datos...</p>
          </div>
        )}
      </div>

      {/* Lista de respaldos */}
      <div>
        <h2 className="text-lg font-bold text-neutral-800 mb-3">Respaldos anteriores</h2>
        {backups.length === 0 ? (
          <div className="card p-8 text-center">
            <HardDriveDownload className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">No hay respaldos realizados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((b, i) => (
              <div key={b.id} className="card flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                  <CheckCircle2 className="h-5 w-5 text-success-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-700">{b.nombre}</p>
                  <p className="text-xs text-neutral-400">{formatFechaHora(b.fecha)} · {b.tamano}</p>
                </div>
                {i === 0 && (
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                    Más reciente
                  </span>
                )}
                <button
                  onClick={() => addToast('info', `Descargando: ${b.nombre}.zip`)}
                  className="btn-secondary text-xs"
                >
                  <Download className="h-4 w-4" /> Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
