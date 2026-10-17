import { useState, useMemo } from 'react';
import { Search, UserPlus, ChevronDown } from 'lucide-react';
import type { Cliente, TipoCliente } from '@/types';

interface ClienteSelectorProps {
  clientes: Cliente[];
  value: string;
  onChange: (clienteId: string) => void;
  onAddNew?: () => void;
  filterTipo?: TipoCliente;
  required?: boolean;
  error?: string;
}

export default function ClienteSelector({ clientes, value, onChange, onAddNew, filterTipo, required, error }: ClienteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = clientes;
    if (filterTipo) {
      list = list.filter((c) => c.tipoCliente === filterTipo);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.nombreRazonSocial.toLowerCase().includes(s) ||
          c.numeroDocumento.toLowerCase().includes(s) ||
          c.correo.toLowerCase().includes(s)
      );
    }
    return list;
  }, [clientes, search, filterTipo]);

  const selected = clientes.find((c) => c.id === value);

  return (
    <div className="relative">
      <label className={`label ${required ? 'label-required' : ''}`}>Cliente</label>
      <div
        className={`input flex items-center justify-between cursor-pointer ${error ? 'input-error' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="text-sm">
            {selected.nombreRazonSocial}
            {selected.numeroDocumento && <span className="text-neutral-400 ml-2">({selected.numeroDocumento})</span>}
          </span>
        ) : (
          <span className="text-neutral-400">Seleccionar cliente</span>
        )}
        <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg max-h-80 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-neutral-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, documento o correo..."
                  className="w-full rounded-lg border border-neutral-200 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-neutral-400">No se encontraron clientes</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors ${
                      c.id === value ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-700">{c.nombreRazonSocial}</p>
                      <p className="text-xs text-neutral-400">
                        {c.tipoCliente === 'Contribuyente' ? 'Contribuyente' : 'Consumidor final'}
                        {c.numeroDocumento && c.numeroDocumento !== '000000000' && ` · ${c.numeroDocumento}`}
                        {c.correo && ` · ${c.correo}`}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            {onAddNew && (
              <button
                onClick={() => {
                  onAddNew();
                  setOpen(false);
                }}
                className="flex items-center gap-2 border-t border-neutral-200 px-3 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Agregar cliente nuevo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
