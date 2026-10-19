import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login, sessionExpirada } = useApp();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [correoError, setCorreoError] = useState('');

  const validarCorreo = (val: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCorreoError('');

    if (!validarCorreo(correo)) {
      setCorreoError('Ingrese un correo electrónico válido');
      return;
    }
    if (!password) {
      setError('La contraseña es obligatoria');
      return;
    }

    setLoading(true);
    const result = await login(correo, password);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white text-2xl font-bold shadow-lg">
            F
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">FactuSys</h1>
          <p className="mt-1 text-sm text-neutral-400">Sistema de Facturación Electrónica</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl animate-slide-up">
          <h2 className="text-xl font-bold text-neutral-800">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-neutral-500">Ingrese sus credenciales para acceder</p>

          {sessionExpirada && (
            <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
              Tu sesión expiró. Por favor, vuelve a iniciar sesión.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="admin@factusys.com"
                  className={`input pl-9 ${correoError ? 'input-error' : ''}`}
                  disabled={loading}
                />
              </div>
              {correoError && <p className="mt-1 text-xs text-error-600">{correoError}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`input px-9 ${error && !password ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                Recordarme
              </label>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Demo: ingrese cualquier correo y contraseña para acceder
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          El Salvador · Facturación electrónica conforme a normativa MH
        </p>
      </div>
    </div>
  );
}
