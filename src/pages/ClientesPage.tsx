import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { InputField, SelectField, TextAreaField } from '@/components/FormFields';
import DocInput from '@/components/DocInput';
import DeptoMuniSelector from '@/components/DeptoMuniSelector';
import Modal from '@/components/Modal';
import { actividadesEconomicas } from '@/data/catalogos';
import { sinGuiones, validarCorreo, generarId } from '@/utils/format';
import { Search, Plus, Pencil, Trash2, Users, Mail, AlertCircle } from 'lucide-react';
import type { Cliente, TipoCliente, TipoDocumentoIdentificacion } from '@/types';

export default function ClientesPage() {
  const { clientes, addCliente, updateCliente, deleteCliente, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null);
  const [confirmNoCorreo, setConfirmNoCorreo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emptyForm: Cliente = {
    id: '',
    tipoCliente: 'ConsumidorFinal',
    tipoDocumento: 'DUI',
    numeroDocumento: '',
    nombreRazonSocial: '',
    actividadEconomica: '',
    nrc: '',
    departamento: '',
    municipio: '',
    direccion: '',
    telefono: '',
    correo: '',
    estado: 'Activo',
  };

  const [form, setForm] = useState<Cliente>(emptyForm);

  const filtered = useMemo(() => {
    if (!search) return clientes;
    const s = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombreRazonSocial.toLowerCase().includes(s) ||
        c.numeroDocumento.toLowerCase().includes(s) ||
        c.correo.toLowerCase().includes(s)
    );
  }, [clientes, search]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({ ...c });
    setErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nombreRazonSocial.trim()) errs.nombreRazonSocial = 'El nombre es obligatorio';
    if (!form.numeroDocumento.trim() && form.tipoCliente === 'Contribuyente') {
      errs.numeroDocumento = 'El número de documento es obligatorio';
    }
    if (form.tipoCliente === 'Contribuyente') {
      if (!form.nrc.trim()) errs.nrc = 'El NRC es obligatorio';
      if (!form.direccion.trim()) errs.direccion = 'La dirección es obligatoria';
      if (!form.departamento) errs.departamento = 'El departamento es obligatorio';
      if (!form.municipio) errs.municipio = 'El municipio es obligatorio';
    }
    if (form.correo && !validarCorreo(form.correo)) {
      errs.correo = 'El correo no es válido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const doSave = () => {
    if (editing) {
      updateCliente(form);
      addToast('exito', 'Cliente actualizado correctamente');
    } else {
      addCliente({ ...form, id: generarId() });
      addToast('exito', 'Cliente creado correctamente');
    }
    setModalOpen(false);
  };

  const handleSave = () => {
    if (!validateForm()) {
      addToast('error', 'Por favor corrija los campos marcados');
      return;
    }
    if (!form.correo) {
      setConfirmNoCorreo(true);
      return;
    }
    doSave();
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteCliente(confirmDelete.id);
    addToast('info', `Cliente "${confirmDelete.nombreRazonSocial}" eliminado`);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Clientes</h1>
          <p className="mt-1 text-sm text-neutral-500">Clientes consumidores finales y contribuyentes</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, documento o correo..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">No hay clientes que mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-semibold text-neutral-600">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Documento</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Correo</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-neutral-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 table-row-hover">
                    <td className="px-4 py-3 font-medium text-neutral-700">{c.nombreRazonSocial}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.tipoCliente === 'Contribuyente' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {c.tipoCliente === 'Contribuyente' ? 'Contribuyente' : 'Consumidor final'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {c.numeroDocumento && c.numeroDocumento !== '000000000' ? `${c.tipoDocumento}: ${c.numeroDocumento}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {c.correo ? (
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{c.correo}</span>
                      ) : (
                        <span className="text-neutral-300">Sin correo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.estado === 'Activo' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(c)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-error-50 hover:text-error-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal de cliente */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} className="btn-primary">
              {editing ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField
            label="Tipo de cliente"
            value={form.tipoCliente}
            onChange={(e) => setForm({ ...form, tipoCliente: e.target.value as TipoCliente, numeroDocumento: '', nrc: '', actividadEconomica: '', departamento: '', municipio: '', direccion: '' })}
          >
            <option value="ConsumidorFinal">Consumidor final</option>
            <option value="Contribuyente">Contribuyente</option>
          </SelectField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Tipo de documento"
              value={form.tipoDocumento}
              onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value as TipoDocumentoIdentificacion })}
            >
              <option value="DUI">DUI</option>
              <option value="NIT">NIT</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Otro">Otro</option>
            </SelectField>
            <DocInput
              tipo={form.tipoDocumento}
              value={form.numeroDocumento}
              onChange={(val) => setForm({ ...form, numeroDocumento: val })}
              error={errors.numeroDocumento}
            />
          </div>

          <InputField
            label="Nombre o razón social"
            required
            value={form.nombreRazonSocial}
            onChange={(e) => setForm({ ...form, nombreRazonSocial: e.target.value })}
            error={errors.nombreRazonSocial}
          />

          {form.tipoCliente === 'Contribuyente' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Actividad económica"
                  value={form.actividadEconomica}
                  onChange={(e) => setForm({ ...form, actividadEconomica: e.target.value })}
                >
                  <option value="">Seleccionar actividad</option>
                  {actividadesEconomicas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </SelectField>
                <InputField
                  label="NRC"
                  value={form.nrc}
                  onChange={(e) => setForm({ ...form, nrc: sinGuiones(e.target.value).replace(/\D/g, '') })}
                  error={errors.nrc}
                  hint="Solo dígitos"
                />
              </div>
              <DeptoMuniSelector
                departamento={form.departamento}
                municipio={form.municipio}
                onDeptoChange={(v) => setForm({ ...form, departamento: v })}
                onMuniChange={(v) => setForm({ ...form, municipio: v })}
                required
                deptoError={errors.departamento}
                muniError={errors.municipio}
              />
              <TextAreaField
                label="Dirección completa"
                required
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                error={errors.direccion}
              />
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <InputField
              label="Correo electrónico"
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              error={errors.correo}
              hint="Obligatorio para enviar el documento por correo"
            />
          </div>
        </div>
      </Modal>

      {/* Confirmar sin correo */}
      <Modal
        open={confirmNoCorreo}
        onClose={() => setConfirmNoCorreo(false)}
        title="Cliente sin correo electrónico"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmNoCorreo(false)} className="btn-secondary">Cancelar</button>
            <button onClick={() => { setConfirmNoCorreo(false); doSave(); }} className="btn-primary">
              Guardar de todos modos
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning-500" />
          <p className="text-sm text-neutral-600">
            Este cliente no tiene correo electrónico. Los documentos que se emitan a su nombre no se podrán enviar automáticamente por correo.
            ¿Desea continuar?
          </p>
        </div>
      </Modal>

      {/* Confirmar eliminar */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar cliente"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleDelete} className="btn-danger">Eliminar</button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          ¿Está seguro de eliminar el cliente "{confirmDelete?.nombreRazonSocial}"? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
