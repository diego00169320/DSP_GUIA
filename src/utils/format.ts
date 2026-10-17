import { feriadosNacionales } from '@/data/catalogos';

// Formato de moneda: dólar estadounidense con 2 decimales
export function formatMoneda(valor: number): string {
  return '$' + valor.toFixed(2);
}

// Formato de fecha: DD/MM/AAAA
export function formatFecha(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// Formato de fecha y hora: DD/MM/AAAA HH:MM
export function formatFechaHora(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${anio} ${hora}:${min}`;
}

// Fecha de hoy en formato ISO (date only)
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Generar número de generación aleatorio (formato DTE)
export function generarNumeroGeneracion(): string {
  const prefix = 'DTE-';
  const num = Math.floor(100000000 + Math.random() * 899999999);
  return `${prefix}${num}`;
}

// Generar código de recepción del MH
export function generarCodigoRecepcion(): string {
  const chars = '0123456789ABCDEF';
  let code = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      code += '-';
    } else {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

// Generar ID único simple
export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Eliminar guiones de un string
export function sinGuiones(valor: string): string {
  return valor.replace(/-/g, '');
}

// Validar correo electrónico
export function validarCorreo(correo: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

// Validar DUI: 9 dígitos sin guion
export function validarDUI(dui: string): boolean {
  return /^\d{9}$/.test(dui);
}

// Validar NIT: 14 dígitos sin guion
export function validarNIT(nit: string): boolean {
  return /^\d{14}$/.test(nit);
}

// Validar NRC: solo dígitos
export function validarNRC(nrc: string): boolean {
  return /^\d+$/.test(nrc) && nrc.length > 0;
}

// Validar pasaporte: alfanumérico sin guion
export function validarPasaporte(pasaporte: string): boolean {
  return /^[A-Za-z0-9]+$/.test(pasaporte) && pasaporte.length > 0;
}

// Verificar si una fecha es feriado (formato MM-DD)
function esFeriado(fecha: Date): boolean {
  const mesDia = `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  return feriadosNacionales.includes(mesDia);
}

// Verificar si una fecha es día hábil (lunes a viernes, no feriado)
function esDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
  return diaSemana >= 1 && diaSemana <= 5 && !esFeriado(fecha);
}

// Calcular fecha límite para invalidar FCF: 3 meses después de la emisión
export function fechaLimiteFCF(fechaEmision: string): Date {
  const fecha = new Date(fechaEmision);
  fecha.setMonth(fecha.getMonth() + 3);
  return fecha;
}

// Calcular fecha límite para invalidar CCF: 10º día hábil del mes siguiente
export function fechaLimiteCCF(fechaEmision: string): Date {
  const fecha = new Date(fechaEmision);
  // Ir al primer día del mes siguiente
  fecha.setMonth(fecha.getMonth() + 1);
  fecha.setDate(1);

  let diasHabiles = 0;
  while (diasHabiles < 10) {
    fecha.setDate(fecha.getDate() + 1);
    if (esDiaHabil(fecha)) {
      diasHabiles++;
    }
  }
  return fecha;
}

// Calcular días restantes hasta una fecha límite
export function diasRestantes(fechaLimite: Date): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const diff = limite.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Verificar si un documento puede ser invalidado
export function puedeInvalidar(tipo: string, fechaEmision: string): { puede: boolean; fechaLimite: Date; diasRestantes: number } {
  let limite: Date;
  if (tipo === 'FCF') {
    limite = fechaLimiteFCF(fechaEmision);
  } else if (tipo === 'CCF') {
    limite = fechaLimiteCCF(fechaEmision);
  } else {
    // NC: no se invalida generalmente, pero si se permite, 3 meses
    limite = fechaLimiteFCF(fechaEmision);
  }
  const restantes = diasRestantes(limite);
  return { puede: restantes >= 0, fechaLimite: limite, diasRestantes: restantes };
}

// Convertir número a letras (versión simple para el total)
export function numeroALetras(num: number): string {
  const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const entero = Math.floor(num);
  const decimal = Math.round((num - entero) * 100);

  function convertir(n: number): string {
    if (n === 0) return 'cero';
    if (n < 10) return unidades[n];
    if (n < 20) return especiales[n - 10];
    if (n < 30) return n === 20 ? 'veinte' : 'veinti' + unidades[n - 20];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u]}`;
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      if (n === 100) return 'cien';
      return r === 0 ? centenas[c] : `${centenas[c]} ${convertir(r)}`;
    }
    if (n < 1000000) {
      const m = Math.floor(n / 1000);
      const r = n % 1000;
      if (m === 1) return r === 0 ? 'mil' : `mil ${convertir(r)}`;
      return r === 0 ? `${convertir(m)} mil` : `${convertir(m)} mil ${convertir(r)}`;
    }
    return n.toString();
  }

  let resultado = convertir(entero);
  if (decimal > 0) {
    resultado += ` con ${decimal}/100`;
  } else {
    resultado += ` con 00/100`;
  }
  return resultado.charAt(0).toUpperCase() + resultado.slice(1) + ' dólares de los Estados Unidos de América';
}
