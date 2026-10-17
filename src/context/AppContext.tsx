import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  Usuario,
  Contribuyente,
  Producto,
  Cliente,
  Documento,
  Backup,
  ContingenciaRegistro,
  EstadoDocumento,
} from '@/types';
import { generarId } from '@/utils/format';

interface Toast {
  id: string;
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  mensaje: string;
}

interface AppState {
  // Auth
  usuario: Usuario | null;
  login: (correo: string, password: string) => boolean;
  logout: () => void;
  sessionExpirada: boolean;
  setSessionExpirada: (v: boolean) => void;

  // Contribuyente
  contribuyente: Contribuyente;
  setContribuyente: (c: Contribuyente) => void;

  // Productos
  productos: Producto[];
  addProducto: (p: Producto) => void;
  updateProducto: (p: Producto) => void;
  deleteProducto: (id: string) => void;

  // Clientes
  clientes: Cliente[];
  addCliente: (c: Cliente) => void;
  updateCliente: (c: Cliente) => void;
  deleteCliente: (id: string) => void;

  // Documentos
  documentos: Documento[];
  addDocumento: (d: Documento) => void;
  updateDocumento: (d: Documento) => void;
  invalidarDocumento: (id: string, motivo: string) => void;

  // Backups
  backups: Backup[];
  addBackup: (b: Backup) => void;

  // Contingencia
  contingenciaActiva: boolean;
  setContingenciaActiva: (v: boolean) => void;
  contingencias: ContingenciaRegistro[];
  addContingencia: (c: ContingenciaRegistro) => void;
  finalizarContingencia: (id: string, sincronizado: boolean) => void;
  documentosPendientesTransmitir: number;
  transmitirPendientes: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (tipo: Toast['tipo'], mensaje: string) => void;
  removeToast: (id: string) => void;

  // Navegación
  paginaActual: string;
  navigate: (pagina: string, params?: Record<string, string>) => void;
  navParams: Record<string, string>;
}

const AppContext = createContext<AppState | null>(null);

// Datos iniciales (seed)
const contribuyenteInicial: Contribuyente = {
  nombreRazonSocial: 'Tienda La Esperanza S.A. de C.V.',
  nombreComercial: 'Tienda La Esperanza',
  nit: '06142002171034',
  nrc: '12345678',
  actividadEconomica: 'Comercio al por menor de alimentos',
  tipoEstablecimiento: 'Casa matriz',
  departamento: 'San Salvador',
  municipio: 'San Salvador',
  direccion: 'Col. Centroamérica, Pasaje 2, Casa #15',
  telefono: '22223344',
  correo: 'tienda@esperanza.com',
  representanteLegal: 'Juan Carlos Hernández',
  certificadoCargado: true,
  certificadoNombre: 'certificado.p12',
  certificadoVencimiento: '2027-12-31',
  ambiente: 'Pruebas',
};

const productosIniciales: Producto[] = [
  { id: 'p1', codigo: 'P001', nombre: 'Coca-Cola 2L', descripcion: 'Bebida gaseosa 2 litros', categoria: 'Bebidas', unidadMedida: 'Botella', precioUnitario: 1.75, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' },
  { id: 'p2', codigo: 'P002', nombre: 'Arroz Premium 5lb', descripcion: 'Arroz blanco de grano largo', categoria: 'Abarrotes', unidadMedida: 'Paquete', precioUnitario: 3.50, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' },
  { id: 'p3', codigo: 'P003', nombre: 'Frijoles 1lb', descripcion: 'Frijoles rojos', categoria: 'Abarrotes', unidadMedida: 'UNI', precioUnitario: 1.25, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' },
  { id: 'p4', codigo: 'P004', nombre: 'Pan Francés', descripcion: 'Pan dulce tradicional', categoria: 'Panadería', unidadMedida: 'UNI', precioUnitario: 0.15, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' },
  { id: 'p5', codigo: 'P005', nombre: 'Leche Entera 1L', descripcion: 'Leche entera pasteurizada', categoria: 'Lácteos', unidadMedida: 'Litro', precioUnitario: 1.10, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' },
  { id: 'p6', codigo: 'P006', nombre: 'Huevos (docena)', descripcion: 'Huevos frescos de gallina', categoria: 'Abarrotes', unidadMedida: 'Docena', precioUnitario: 2.40, tipoImpuesto: 'GravadoIVA13', estado: 'Activo' },
];

const clientesIniciales: Cliente[] = [
  { id: 'c1', tipoCliente: 'ConsumidorFinal', tipoDocumento: 'DUI', numeroDocumento: '000000000', nombreRazonSocial: 'Consumidor Final', actividadEconomica: '', nrc: '', departamento: '', municipio: '', direccion: '', telefono: '', correo: '', estado: 'Activo' },
  { id: 'c2', tipoCliente: 'Contribuyente', tipoDocumento: 'NIT', numeroDocumento: '06142002171034', nombreRazonSocial: 'Distribuidora El Sol S.A. de C.V.', actividadEconomica: 'Comercio al por mayor de alimentos', nrc: '87654321', departamento: 'San Salvador', municipio: 'Santa Tecla', direccion: 'Final 1ª Av. Sur, Col. Las Mercedes', telefono: '22445566', correo: 'compras@elsol.com', estado: 'Activo' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sessionExpirada, setSessionExpirada] = useState(false);
  const [contribuyente, setContribuyenteState] = useState<Contribuyente>(contribuyenteInicial);
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [contingenciaActiva, setContingenciaActiva] = useState(false);
  const [contingencias, setContingencias] = useState<ContingenciaRegistro[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paginaActual, setPaginaActual] = useState('login');
  const [navParams, setNavParams] = useState<Record<string, string>>({});

  const addToast = useCallback((tipo: Toast['tipo'], mensaje: string) => {
    const id = generarId();
    setToasts((prev) => [...prev, { id, tipo, mensaje }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback((_correo: string, _password: string) => {
    void _password;
    setUsuario({ nombre: 'Carlos Hernández', correo: _correo || 'admin@factusys.com' });
    setSessionExpirada(false);
    setPaginaActual('dashboard');
    return true;
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    setPaginaActual('login');
  }, []);

  const navigate = useCallback((pagina: string, params: Record<string, string> = {}) => {
    setPaginaActual(pagina);
    setNavParams(params);
  }, []);

  const setContribuyente = useCallback((c: Contribuyente) => {
    setContribuyenteState(c);
  }, []);

  const addProducto = useCallback((p: Producto) => {
    setProductos((prev) => [...prev, p]);
  }, []);

  const updateProducto = useCallback((p: Producto) => {
    setProductos((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  }, []);

  const deleteProducto = useCallback((id: string) => {
    setProductos((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addCliente = useCallback((c: Cliente) => {
    setClientes((prev) => [...prev, c]);
  }, []);

  const updateCliente = useCallback((c: Cliente) => {
    setClientes((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  }, []);

  const deleteCliente = useCallback((id: string) => {
    setClientes((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addDocumento = useCallback((d: Documento) => {
    setDocumentos((prev) => [d, ...prev]);
  }, []);

  const updateDocumento = useCallback((d: Documento) => {
    setDocumentos((prev) => prev.map((x) => (x.id === d.id ? d : x)));
  }, []);

  const invalidarDocumento = useCallback((id: string, motivo: string) => {
    setDocumentos((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, estado: 'Invalidada' as EstadoDocumento, fechaInvalidacion: new Date().toISOString(), motivoInvalidacion: motivo }
          : x
      )
    );
  }, []);

  const addBackup = useCallback((b: Backup) => {
    setBackups((prev) => [b, ...prev]);
  }, []);

  const addContingencia = useCallback((c: ContingenciaRegistro) => {
    setContingencias((prev) => [c, ...prev]);
  }, []);

  const finalizarContingencia = useCallback((id: string, sincronizado: boolean) => {
    setContingencias((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, fechaFin: new Date().toISOString(), fechaSincronizacion: sincronizado ? new Date().toISOString() : null }
          : x
      )
    );
  }, []);

  const documentosPendientesTransmitir = documentos.filter(
    (d) => d.estado === 'Contingencia' || d.estado === 'PendienteTransmision'
  ).length;

  const transmitirPendientes = useCallback(() => {
    setDocumentos((prev) =>
      prev.map((x) =>
        x.estado === 'Contingencia' || x.estado === 'PendienteTransmision'
          ? { ...x, estado: 'Procesada' as EstadoDocumento }
          : x
      )
    );
    setContingenciaActiva(false);
  }, []);

  const value: AppState = {
    usuario,
    login,
    logout,
    sessionExpirada,
    setSessionExpirada,
    contribuyente,
    setContribuyente,
    productos,
    addProducto,
    updateProducto,
    deleteProducto,
    clientes,
    addCliente,
    updateCliente,
    deleteCliente,
    documentos,
    addDocumento,
    updateDocumento,
    invalidarDocumento,
    backups,
    addBackup,
    contingenciaActiva,
    setContingenciaActiva,
    contingencias,
    addContingencia,
    finalizarContingencia,
    documentosPendientesTransmitir,
    transmitirPendientes,
    toasts,
    addToast,
    removeToast,
    paginaActual,
    navigate,
    navParams,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
