import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { InputField, SelectField, TextAreaField } from '@/components/FormFields';
import { categoriasProducto, unidadesMedida } from '@/data/catalogos';
import { formatMoneda, generarId } from '@/utils/format';
import Modal from '@/components/Modal';
import { Search, Plus, Pencil, Power, Package } from 'lucide-react';
import type { Producto, TipoImpuesto, EstadoProducto } from '@/types';

const tipoImpuestoLabels: Record<TipoImpuesto, string> = {
  GravadoIVA13: 'IVA 13%',
  Exento: 'Exento',
  NoSujeto: 'No sujeto',
};

export default function ProductosPage() {
  const { productos, addProducto, updateProducto, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [confirmDesactivar, setConfirmDesactivar] = useState<Producto | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Producto>({
    id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    unidadMedida: 'UNI',
    precioUnitario: 0,
    tipoImpuesto: 'GravadoIVA13',
    estado: 'Activo',
  });

  const filtered = useMemo(() => {
    let list = productos;
    if (filtroCategoria) list = list.filter((p) => p.categoria === filtroCategoria);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) => p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s)
      );
    }
    return list;
  }, [productos, search, filtroCategoria]);

  const openNew = () => {
    setEditing(null);
    setForm({ id: '', codigo: '', nombre: '', descripcion: '', categoria: '', unidadMedida: 'UNI', precioUnitario: 0, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({ ...p });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.codigo.trim()) errs.codigo = 'El código es obligatorio';
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (form.precioUnitario <= 0) errs.precioUnitario = 'El precio debe ser mayor que 0';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (editing) {
      updateProducto(form);
      addToast('exito', 'Producto actualizado correctamente');
    } else {
      addProducto({ ...form, id: generarId() });
      addToast('exito', 'Producto creado correctamente');
    }
    setModalOpen(false);
  };

  const handleDesactivar = () => {
    if (!confirmDesactivar) return;
    if (confirmDesactivar.estado === 'Activo') {
      updateProducto({ ...confirmDesactivar, estado: 'Inactivo' });
      addToast('info', `Producto "${confirmDesactivar.nombre}" desactivado`);
    } else {
      updateProducto({ ...confirmDesactivar, estado: 'Activo' });
      addToast('exito', `Producto "${confirmDesactivar.nombre}" activado`);
    }
    setConfirmDesactivar(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Productos</h1>
          <p className="mt-1 text-sm text-neutral-500">Catálogo de productos y servicios</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="input pl-9"
            />
          </div>
          <SelectField value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categoriasProducto.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">No hay productos que mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-semibold text-neutral-600">Código</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Categoría</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-right">Precio</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Impuesto</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100 table-row-hover">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{p.nombre}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.categoria || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-700">{formatMoneda(p.precioUnitario)}</td>
                    <td className="px-4 py-3 text-neutral-600">{tipoImpuestoLabels[p.tipoImpuesto]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.estado === 'Activo' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDesactivar(p)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            p.estado === 'Activo'
                              ? 'text-neutral-500 hover:bg-error-50 hover:text-error-600'
                              : 'text-neutral-500 hover:bg-success-50 hover:text-success-600'
                          }`}
                          title={p.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de producto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} className="btn-primary">
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Código"
            required
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            error={errors.codigo}
          />
          <InputField
            label="Nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            error={errors.nombre}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <SelectField
            label="Categoría"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          >
            <option value="">Seleccionar categoría</option>
            {categoriasProducto.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectField>
          <SelectField
            label="Unidad de medida"
            value={form.unidadMedida}
            onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
          >
            {unidadesMedida.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </SelectField>
          <InputField
            label="Precio unitario ($)"
            required
            type="number"
            step="0.01"
            min="0"
            value={form.precioUnitario || ''}
            onChange={(e) => setForm({ ...form, precioUnitario: parseFloat(e.target.value) || 0 })}
            error={errors.precioUnitario}
          />
          <SelectField
            label="Tipo de impuesto"
            value={form.tipoImpuesto}
            onChange={(e) => setForm({ ...form, tipoImpuesto: e.target.value as TipoImpuesto })}
          >
            <option value="GravadoIVA13">Gravado con IVA 13%</option>
            <option value="Exento">Exento</option>
            <option value="NoSujeto">No sujeto</option>
          </SelectField>
          <SelectField
            label="Estado"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoProducto })}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </SelectField>
        </div>
      </Modal>

      {/* Confirmar desactivar */}
      <Modal
        open={confirmDesactivar !== null}
        onClose={() => setConfirmDesactivar(null)}
        title={confirmDesactivar?.estado === 'Activo' ? 'Desactivar producto' : 'Activar producto'}
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDesactivar(null)} className="btn-secondary">Cancelar</button>
            <button
              onClick={handleDesactivar}
              className={confirmDesactivar?.estado === 'Activo' ? 'btn-danger' : 'btn-primary'}
            >
              {confirmDesactivar?.estado === 'Activo' ? 'Desactivar' : 'Activar'}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          {confirmDesactivar?.estado === 'Activo'
            ? `¿Está seguro de desactivar el producto "${confirmDesactivar?.nombre}"? No estará disponible para nuevas ventas.`
            : `¿Está seguro de activar el producto "${confirmDesactivar?.nombre}"?`}
        </p>
      </Modal>
    </div>
  );
}
