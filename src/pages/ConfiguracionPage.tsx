import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { InputField, SelectField, TextAreaField } from '@/components/FormFields';
import DeptoMuniSelector from '@/components/DeptoMuniSelector';
import { actividadesEconomicas, tiposEstablecimiento } from '@/data/catalogos';
import { sinGuiones, validarCorreo, formatFecha } from '@/utils/format';
import { Upload, ShieldCheck, Save, X, AlertCircle } from 'lucide-react';
import type { Contribuyente } from '@/types';

export default function ConfiguracionPage() {
  const { contribuyente, setContribuyente, addToast } = useApp();
  const [form, setForm] = useState<Contribuyente>({ ...contribuyente });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProduccionWarning, setShowProduccionWarning] = useState(false);

  const update = (field: keyof Contribuyente, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmbienteChange = (val: string) => {
    if (val === 'Produccion' && form.ambiente !== 'Produccion') {
      setShowProduccionWarning(true);
    }
    update('ambiente', val);
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        certificadoCargado: true,
        certificadoNombre: file.name,
        certificadoVencimiento: prev.certificadoVencimiento || '2027-12-31',
      }));
      addToast('exito', 'Certificado digital cargado correctamente');
    }
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.nombreRazonSocial.trim()) errs.nombreRazonSocial = 'El nombre o razón social es obligatorio';
    if (!form.nit.trim()) errs.nit = 'El NIT es obligatorio';
    else if (!/^\d{14}$/.test(form.nit)) errs.nit = 'El NIT debe tener 14 dígitos sin guion';
    if (!form.nrc.trim()) errs.nrc = 'El NRC es obligatorio';
    if (!form.actividadEconomica) errs.actividadEconomica = 'La actividad económica es obligatoria';
    if (!form.departamento) errs.departamento = 'El departamento es obligatorio';
    if (!form.municipio) errs.municipio = 'El municipio es obligatorio';
    if (!form.direccion.trim()) errs.direccion = 'La dirección es obligatoria';
    if (!form.correo.trim()) errs.correo = 'El correo es obligatorio';
    else if (!validarCorreo(form.correo)) errs.correo = 'El correo no es válido';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast('error', 'Por favor corrija los campos marcados');
      return;
    }

    setContribuyente(form);
    addToast('exito', 'Configuración del contribuyente guardada correctamente');
  };

  const handleCancel = () => {
    setForm({ ...contribuyente });
    setErrors({});
    addToast('info', 'Cambios descartados');
  };

  // Estado del certificado
  const certEstado = (() => {
    if (!form.certificadoCargado) return { label: 'No cargado', class: 'bg-error-100 text-error-700' };
    const venc = new Date(form.certificadoVencimiento);
    const hoy = new Date();
    const dias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { label: 'Vencido', class: 'bg-error-100 text-error-700' };
    if (dias < 60) return { label: 'Por vencer', class: 'bg-warning-100 text-warning-700' };
    return { label: 'Vigente', class: 'bg-success-100 text-success-700' };
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Configuración del contribuyente</h1>
        <p className="mt-1 text-sm text-neutral-500">Datos del negocio que aparecen en todos los documentos</p>
      </div>

      {/* Datos fiscales */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Datos fiscales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Nombre o razón social"
            required
            value={form.nombreRazonSocial}
            onChange={(e) => update('nombreRazonSocial', e.target.value)}
            error={errors.nombreRazonSocial}
          />
          <InputField
            label="Nombre comercial"
            value={form.nombreComercial}
            onChange={(e) => update('nombreComercial', e.target.value)}
          />
          <InputField
            label="NIT"
            required
            value={form.nit}
            onChange={(e) => update('nit', sinGuiones(e.target.value).replace(/\D/g, ''))}
            error={errors.nit}
            hint="14 dígitos sin guion"
            maxLength={14}
          />
          <InputField
            label="NRC"
            required
            value={form.nrc}
            onChange={(e) => update('nrc', sinGuiones(e.target.value).replace(/\D/g, ''))}
            error={errors.nrc}
            hint="Número de registro de contribuyente (solo dígitos)"
          />
          <SelectField
            label="Actividad económica"
            required
            value={form.actividadEconomica}
            onChange={(e) => update('actividadEconomica', e.target.value)}
            error={errors.actividadEconomica}
          >
            <option value="">Seleccionar actividad</option>
            {actividadesEconomicas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </SelectField>
          <SelectField
            label="Tipo de establecimiento"
            value={form.tipoEstablecimiento}
            onChange={(e) => update('tipoEstablecimiento', e.target.value)}
          >
            <option value="">Seleccionar tipo</option>
            {tiposEstablecimiento.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </SelectField>
        </div>
        <div className="mt-4">
          <DeptoMuniSelector
            departamento={form.departamento}
            municipio={form.municipio}
            onDeptoChange={(v) => update('departamento', v)}
            onMuniChange={(v) => update('municipio', v)}
            required
            deptoError={errors.departamento}
            muniError={errors.municipio}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextAreaField
            label="Dirección completa"
            required
            value={form.direccion}
            onChange={(e) => update('direccion', e.target.value)}
            error={errors.direccion}
            placeholder="Calle, colonia, número, referencias..."
          />
          <div className="grid grid-cols-1 gap-4">
            <InputField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => update('telefono', e.target.value)}
              placeholder="0000-0000"
            />
            <InputField
              label="Correo electrónico"
              required
              type="email"
              value={form.correo}
              onChange={(e) => update('correo', e.target.value)}
              error={errors.correo}
            />
            <InputField
              label="Nombre del representante legal"
              value={form.representanteLegal}
              onChange={(e) => update('representanteLegal', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Certificado digital */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Certificado digital</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${certEstado.class}`}>
            <ShieldCheck className="h-4 w-4" />
            {certEstado.label}
          </div>
          {form.certificadoCargado && (
            <p className="text-sm text-neutral-500">
              Archivo: <span className="font-medium text-neutral-700">{form.certificadoNombre}</span>
              {' · '}Vence: <span className="font-medium text-neutral-700">{formatFecha(form.certificadoVencimiento)}</span>
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Cargar certificado (.pfx o .p12)</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-600">
              <Upload className="h-5 w-5" />
              {form.certificadoCargado ? 'Reemplazar certificado' : 'Seleccionar archivo'}
              <input type="file" accept=".pfx,.p12" className="hidden" onChange={handleCertUpload} />
            </label>
          </div>
          <InputField
            label="Contraseña del certificado"
            type="password"
            placeholder="Ingrese la contraseña del certificado"
          />
        </div>
        <div className="mt-4">
          <button
            onClick={() => addToast('info', 'Prueba de firma: el certificado responde correctamente')}
            className="btn-secondary"
          >
            <ShieldCheck className="h-4 w-4" />
            Probar firma
          </button>
        </div>
      </div>

      {/* Ambiente */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Ambiente</h2>
        <SelectField
          label="Ambiente de operación"
          value={form.ambiente}
          onChange={(e) => handleAmbienteChange(e.target.value)}
        >
          <option value="Pruebas">Pruebas</option>
          <option value="Produccion">Producción</option>
        </SelectField>
        {showProduccionWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning-600" />
            <p className="text-sm text-warning-800">
              <strong>Aviso:</strong> Al cambiar a Producción, los documentos emitidos tendrán validez legal ante el Ministerio de Hacienda.
            </p>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={handleCancel} className="btn-secondary">
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button onClick={handleSave} className="btn-primary">
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
