import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Receipt,
  FileMinus2,
  Users,
  Package,
  Settings,
  HardDriveDownload,
  HelpCircle,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'nueva-venta', label: 'Nueva venta', icon: ShoppingCart },
  { id: 'nuevo-ccf', label: 'Nuevo CCF', icon: FileText },
  { id: 'nueva-nc', label: 'Nueva nota de crédito', icon: Receipt },
  { id: 'documentos', label: 'Documentos', icon: FileMinus2 },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
  { id: 'respaldo', label: 'Respaldo', icon: HardDriveDownload },
  { id: 'contingencia', label: 'Contingencia', icon: AlertTriangle },
  { id: 'ayuda', label: 'Ayuda', icon: HelpCircle },
];

export default function Sidebar() {
  const { paginaActual, navigate, logout, contingenciaActiva, documentosPendientesTransmitir } = useApp();

  return (
    <aside className="flex h-full w-64 flex-col bg-neutral-900 text-neutral-100">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-bold text-white text-lg">
          F
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">FactuSys</h1>
          <p className="text-xs text-neutral-400">Facturación Electrónica</p>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = paginaActual === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'documentos' && contingenciaActiva && documentosPendientesTransmitir > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-xs font-bold text-white">
                      {documentosPendientesTransmitir}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Contingencia status */}
      {contingenciaActiva && (
        <div className="mx-3 mb-3 rounded-lg border border-accent-500/30 bg-accent-500/10 p-3">
          <div className="flex items-center gap-2 text-accent-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold">Modo contingencia activo</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">{documentosPendientesTransmitir} documentos pendientes</p>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-neutral-800 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-all hover:bg-error-600/80 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
