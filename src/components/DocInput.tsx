import { useState } from 'react';
import { InputField } from '@/components/FormFields';
import type { TipoDocumentoIdentificacion } from '@/types';
import { sinGuiones, validarPasaporte } from '@/utils/format';

interface DocInputProps {
  label?: string;
  required?: boolean;
  tipo: TipoDocumentoIdentificacion;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function DocInput({ label = 'Número de documento', required, tipo, value, onChange, error }: DocInputProps) {
  const [internalError, setInternalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Eliminar guiones automáticamente
    const limpio = sinGuiones(raw);

    // Para DUI y NIT, solo permitir dígitos
    if (tipo === 'DUI' || tipo === 'NIT') {
      const soloDigitos = limpio.replace(/\D/g, '');
      onChange(soloDigitos);

      // Validar longitud
      if (soloDigitos.length > 0) {
        if (tipo === 'DUI' && soloDigitos.length !== 9) {
          setInternalError('El DUI debe tener 9 dígitos sin guion');
        } else if (tipo === 'NIT' && soloDigitos.length !== 14) {
          setInternalError('El NIT debe tener 14 dígitos sin guion');
        } else {
          setInternalError('');
        }
      } else {
        setInternalError('');
      }
    } else if (tipo === 'Pasaporte') {
      // Alfanumérico sin guion
      const alnum = limpio.replace(/[^A-Za-z0-9]/g, '');
      onChange(alnum);
      if (alnum.length > 0 && !validarPasaporte(alnum)) {
        setInternalError('El pasaporte debe ser alfanumérico sin guion');
      } else {
        setInternalError('');
      }
    } else {
      onChange(limpio);
      setInternalError('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const limpio = sinGuiones(pasted);
    if (tipo === 'DUI' || tipo === 'NIT') {
      onChange(limpio.replace(/\D/g, ''));
    } else if (tipo === 'Pasaporte') {
      onChange(limpio.replace(/[^A-Za-z0-9]/g, ''));
    } else {
      onChange(limpio);
    }
  };

  const placeholder =
    tipo === 'DUI' ? '9 dígitos sin guion (ej: 123456789)' :
    tipo === 'NIT' ? '14 dígitos sin guion (ej: 06142002171034)' :
    tipo === 'Pasaporte' ? 'Alfanumérico sin guion' :
    'Ingrese el número';

  const displayError = error || internalError;
  const maxLength = tipo === 'DUI' ? 9 : tipo === 'NIT' ? 14 : 20;

  return (
    <InputField
      label={label}
      required={required}
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      error={displayError}
      placeholder={placeholder}
      maxLength={maxLength}
    />
  );
}
