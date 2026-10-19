import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
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
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'factusys-state-v1';

function cargar<T>(key: string, fallback: T): T {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>;
    return (state[key] as T | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

interface Toast {
  id: string;
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  mensaje: string;
}

interface AppState {
  // Auth
  usuario: Usuario | null;
  login: (correo: string, password: string) => Promise<{ error?: string }>;
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
  const userIdRef = useRef<string | null>(null);
  const [sessionExpirada, setSessionExpirada] = useState(false);
  const [contribuyente, setContribuyenteState] = useState<Contribuyente>(() => cargar('contribuyente', contribuyenteInicial));
  const [productos, setProductos] = useState<Producto[]>(() => cargar('productos', productosIniciales));
  const [clientes, setClientes] = useState<Cliente[]>(() => cargar('clientes', clientesIniciales));
  const [documentos, setDocumentos] = useState<Documento[]>(() => cargar('documentos', []));
  const documentosRef = useRef(documentos);
  const datosRef = useRef({ contribuyente, productos, clientes });
  const [backups, setBackups] = useState<Backup[]>(() => cargar('backups', []));
  const [contingenciaActiva, setContingenciaActiva] = useState(false);
  const [contingencias, setContingencias] = useState<ContingenciaRegistro[]>([]);
  const contingenciasRef = useRef(contingencias);
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ contribuyente, productos, clientes, documentos, backups }));
  }, [contribuyente, productos, clientes, documentos, backups]);

  useEffect(() => {
    documentosRef.current = documentos;
  }, [documentos]);

  useEffect(() => {
    datosRef.current = { contribuyente, productos, clientes };
  }, [contribuyente, productos, clientes]);

  useEffect(() => {
    contingenciasRef.current = contingencias;
  }, [contingencias]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const guardarColeccion = async <T extends { id: string }>(
      tabla: 'productos' | 'clientes',
      userId: string,
      locales: T[],
    ) => {
      const { data: remotos, error } = await client
        .from(tabla)
        .select('datos')
        .eq('user_id', userId);
      if (error) {
        addToast('error', `No se pudieron cargar ${tabla}: ${error.message}`);
        return locales;
      }
      const remotosPorId = new Map(
        (remotos ?? []).map((fila) => {
          const dato = fila.datos as T;
          return [dato.id, dato];
        }),
      );
      const pendientes = locales.filter((item) => !remotosPorId.has(item.id));
      if (pendientes.length > 0) {
        const { error: migracionError } = await client.from(tabla).insert(
          pendientes.map((datos) => ({ user_id: userId, datos })),
        );
        if (migracionError) {
          addToast('error', `No se pudieron sincronizar ${tabla}: ${migracionError.message}`);
          return locales;
        }
      }
      return [...pendientes, ...Array.from(remotosPorId.values())];
    };

    const sincronizarDatos = async (userId: string) => {
      const productosRemotos = await guardarColeccion('productos', userId, datosRef.current.productos);
      const clientesRemotos = await guardarColeccion('clientes', userId, datosRef.current.clientes);
      setProductos(productosRemotos);
      setClientes(clientesRemotos);

      const { data: contribuyenteRemoto, error: contribuyenteError } = await client
        .from('contribuyentes')
        .select('datos')
        .eq('user_id', userId)
        .maybeSingle();
      if (contribuyenteError) {
        addToast('error', `No se pudo cargar el contribuyente: ${contribuyenteError.message}`);
      } else if (contribuyenteRemoto?.datos) {
        setContribuyenteState(contribuyenteRemoto.datos as Contribuyente);
      } else {
        const { error } = await client.from('contribuyentes').upsert(
          { user_id: userId, datos: datosRef.current.contribuyente },
          { onConflict: 'user_id' },
        );
        if (error) addToast('error', `No se pudo guardar el contribuyente: ${error.message}`);
      }

      const { data: contingenciasRemotas, error: contingenciasError } = await client
        .from('contingencias')
        .select('datos')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (contingenciasError) {
        addToast('error', `No se pudieron cargar las contingencias: ${contingenciasError.message}`);
      } else {
        const remotas = (contingenciasRemotas ?? []).map((fila) => fila.datos as ContingenciaRegistro);
        const idsRemotos = new Set(remotas.map((item) => item.id));
        const pendientes = contingenciasRef.current.filter((item) => !idsRemotos.has(item.id));
        if (pendientes.length > 0) {
          const { error: migracionError } = await client.from('contingencias').insert(
            pendientes.map((datos) => ({ user_id: userId, datos })),
          );
          if (migracionError) {
            addToast('error', `No se pudieron sincronizar las contingencias: ${migracionError.message}`);
            return;
          }
        }
        setContingencias([...pendientes, ...remotas]);
      }
    };

    const sincronizarDocumentos = async (userId: string, documentosLocales: Documento[]) => {
      const { data: remotos, error: consultaError } = await client
        .from('documentos')
        .select('numero_generacion, datos')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (consultaError) {
        addToast('error', `No se pudieron cargar los documentos guardados: ${consultaError.message}`);
        return;
      }

      const documentosRemotos = (remotos ?? [])
        .map((fila) => fila.datos as Documento)
        .filter((documento) => documento?.numeroGeneracion);
      const numerosRemotos = new Set(documentosRemotos.map((documento) => documento.numeroGeneracion));
      const pendientes = documentosLocales.filter((documento) => !numerosRemotos.has(documento.numeroGeneracion));

      if (pendientes.length > 0) {
        const { error: migracionError } = await client
          .from('documentos')
          .upsert(
            pendientes.map((documento) => ({
              user_id: userId,
              tipo: documento.tipo,
              numero_generacion: documento.numeroGeneracion,
              estado: documento.estado,
              fecha_emision: documento.fechaEmision,
              datos: documento,
            })),
            { onConflict: 'user_id,numero_generacion' },
          );

        if (migracionError) {
          addToast('error', `No se pudieron sincronizar documentos locales: ${migracionError.message}`);
          return;
        }
      }

      setDocumentos([...pendientes, ...documentosRemotos]);
    };

    const establecerSesion = async (user: { id: string; email?: string; user_metadata?: { nombre?: string } }, sincronizarLocales: boolean) => {
      userIdRef.current = user.id;
      setUsuario({ nombre: user.user_metadata?.nombre || user.email || 'Usuario', correo: user.email || '' });
      if (sincronizarLocales) {
        await sincronizarDocumentos(user.id, documentosRef.current);
        await sincronizarDatos(user.id);
      }
      setPaginaActual('dashboard');
    };

    void client.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        void establecerSesion(user, true);
      }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        userIdRef.current = null;
        setUsuario(null);
        setPaginaActual('login');
        return;
      }
      void establecerSesion(session.user, true);
    });
    return () => listener.subscription.unsubscribe();
  }, [addToast]);

  const login = useCallback(async (correo: string, password: string) => {
    if (!supabase) return { error: 'Supabase no está configurado. Revise las variables VITE_SUPABASE_*.' };
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (error) return { error: error.message };
    setSessionExpirada(false);
    return {};
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUsuario(null);
    setPaginaActual('login');
  }, []);

  const navigate = useCallback((pagina: string, params: Record<string, string> = {}) => {
    setPaginaActual(pagina);
    setNavParams(params);
  }, []);

  const setContribuyente = useCallback((c: Contribuyente) => {
    setContribuyenteState(c);
    const userId = userIdRef.current;
    if (supabase && userId) {
      void supabase.from('contribuyentes').upsert(
        { user_id: userId, datos: c },
        { onConflict: 'user_id' },
      ).then(({ error }) => {
        if (error) addToast('error', `El contribuyente no se pudo guardar: ${error.message}`);
      });
    }
  }, [addToast]);

  const addProducto = useCallback((p: Producto) => {
    setProductos((prev) => [...prev, p]);
    const userId = userIdRef.current;
    if (supabase && userId) void supabase.from('productos').insert({ user_id: userId, datos: p });
  }, []);

  const updateProducto = useCallback((p: Producto) => {
    setProductos((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    const userId = userIdRef.current;
    if (supabase && userId) void supabase.from('productos').update({ datos: p }).eq('user_id', userId).eq('datos->>id', p.id);
  }, []);

  const deleteProducto = useCallback((id: string) => {
    setProductos((prev) => prev.filter((x) => x.id !== id));
    const userId = userIdRef.current;
    if (supabase && userId) void supabase.from('productos').delete().eq('user_id', userId).eq('datos->>id', id);
  }, []);

  const addCliente = useCallback((c: Cliente) => {
    setClientes((prev) => [...prev, c]);
    const userId = userIdRef.current;
    if (supabase && userId) void supabase.from('clientes').insert({ user_id: userId, datos: c });
  }, []);

  const updateCliente = useCallback((c: Cliente) => {
    setClientes((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    const userId = userIdRef.current;
    if (supabase && userId) void supabase.from('clientes').update({ datos: c }).eq('user_id', userId).eq('datos->>id', c.id);
  }, []);

  const deleteCliente = useCallback((id: string) => {
    setClientes((prev) => prev.filter((x) => x.id !== id));
    const userId = userIdRef.current;
    if (supabase && userId) void supabase.from('clientes').delete().eq('user_id', userId).eq('datos->>id', id);
  }, []);

  const addDocumento = useCallback((d: Documento) => {
    setDocumentos((prev) => [d, ...prev]);
    const userId = userIdRef.current;
    if (supabase && userId) {
      const client = supabase;
      void client.from('documentos').upsert({
        user_id: userId,
        tipo: d.tipo,
        numero_generacion: d.numeroGeneracion,
        estado: d.estado,
        fecha_emision: d.fechaEmision,
        datos: d,
      }, { onConflict: 'user_id,numero_generacion' }).then(({ error }) => {
        if (error) addToast('error', `El documento no se pudo guardar en Supabase: ${error.message}`);
      });
    }
  }, [addToast]);

  const updateDocumento = useCallback((d: Documento) => {
    setDocumentos((prev) => prev.map((x) => (x.id === d.id ? d : x)));
    const userId = userIdRef.current;
    if (supabase && userId) {
      const client = supabase;
      void client.from('documentos').update({
        tipo: d.tipo,
        estado: d.estado,
        fecha_emision: d.fechaEmision,
        datos: d,
      }).eq('user_id', userId).eq('numero_generacion', d.numeroGeneracion).then(({ error }) => {
        if (error) addToast('error', `El documento no se pudo actualizar en Supabase: ${error.message}`);
      });
      if (d.envioCorreo) {
        void client.from('documentos').select('id').eq('user_id', userId)
          .eq('numero_generacion', d.numeroGeneracion).single().then(({ data, error }) => {
            if (error || !data) {
              if (error) addToast('error', `No se pudo registrar el envío del correo: ${error.message}`);
              return;
            }
            return client.from('envios_correo').insert({
              user_id: userId,
              documento_id: data.id,
              destinatario: d.envioCorreo!.destinatario,
              tipo: 'emision',
              estado: d.envioCorreo!.estado,
              enviado_at: d.envioCorreo!.estado === 'Enviado' ? d.envioCorreo!.fechaEnvio : null,
              error: d.envioCorreo!.estado === 'Fallido' ? 'Resend rechazó el envío' : null,
            });
          });
      }
    }
  }, [addToast]);

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
    const userId = userIdRef.current;
    if (supabase && userId) {
      void supabase.from('contingencias').insert({ user_id: userId, datos: c }).then(({ error }) => {
        if (error) addToast('error', `La contingencia no se pudo guardar: ${error.message}`);
      });
    }
  }, [addToast]);

  const finalizarContingencia = useCallback((id: string, sincronizado: boolean) => {
    const actualizada = {
      fechaFin: new Date().toISOString(),
      fechaSincronizacion: sincronizado ? new Date().toISOString() : null,
    };
    const contingencia = contingenciasRef.current.find((item) => item.id === id);
    setContingencias((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, ...actualizada }
          : x
      )
    );
    const userId = userIdRef.current;
    if (supabase && userId) {
      void supabase.from('contingencias').update({ datos: { ...contingencia, ...actualizada } })
        .eq('user_id', userId).eq('datos->>id', id)
        .then(({ error }) => {
          if (error) addToast('error', `La contingencia no se pudo actualizar: ${error.message}`);
        });
    }
  }, [addToast]);

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
