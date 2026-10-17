import { departamentos, listaDepartamentos } from '@/data/catalogos';
import { SelectField } from '@/components/FormFields';

interface DeptoMuniSelectorProps {
  departamento: string;
  municipio: string;
  onDeptoChange: (depto: string) => void;
  onMuniChange: (muni: string) => void;
  required?: boolean;
  deptoError?: string;
  muniError?: string;
}

export default function DeptoMuniSelector({
  departamento,
  municipio,
  onDeptoChange,
  onMuniChange,
  required,
  deptoError,
  muniError,
}: DeptoMuniSelectorProps) {
  const municipios = departamento ? departamentos[departamento] || [] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SelectField
        label="Departamento"
        required={required}
        value={departamento}
        error={deptoError}
        onChange={(e) => {
          onDeptoChange(e.target.value);
          onMuniChange('');
        }}
      >
        <option value="">Seleccionar departamento</option>
        {listaDepartamentos.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </SelectField>
      <SelectField
        label="Municipio"
        required={required}
        value={municipio}
        error={muniError}
        disabled={!departamento}
        onChange={(e) => onMuniChange(e.target.value)}
      >
        <option value="">Seleccionar municipio</option>
        {municipios.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </SelectField>
    </div>
  );
}
