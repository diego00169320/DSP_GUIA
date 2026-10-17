import { AppProvider, useApp } from '@/context/AppContext';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage';
import ProductosPage from '@/pages/ProductosPage';
import ClientesPage from '@/pages/ClientesPage';
import PuntoVenta from '@/pages/PuntoVenta';
import NotaCreditoPage from '@/pages/NotaCreditoPage';
import DocumentosPage from '@/pages/DocumentosPage';
import DetalleDocumentoPage from '@/pages/DetalleDocumentoPage';
import RespaldoPage from '@/pages/RespaldoPage';
import ContingenciaPage from '@/pages/ContingenciaPage';
import AyudaPage from '@/pages/AyudaPage';

function AppContent() {
  const { usuario, paginaActual } = useApp();

  if (!usuario || paginaActual === 'login') {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (paginaActual) {
      case 'dashboard':
        return <DashboardPage />;
      case 'configuracion':
        return <ConfiguracionPage />;
      case 'productos':
        return <ProductosPage />;
      case 'clientes':
        return <ClientesPage />;
      case 'nueva-venta':
        return (
          <PuntoVenta
            tipoDocumento="FCF"
            requiereContribuyente={false}
            titulo="Nueva venta"
            subtitulo="Factura de Consumidor Final Electrónica (FCF)"
          />
        );
      case 'nuevo-ccf':
        return (
          <PuntoVenta
            tipoDocumento="CCF"
            requiereContribuyente={true}
            titulo="Nuevo Comprobante de Crédito Fiscal"
            subtitulo="CCF Electrónico para clientes contribuyentes"
            mensajeAyuda="Este documento otorga derecho a crédito fiscal al cliente."
          />
        );
      case 'nueva-nc':
        return <NotaCreditoPage />;
      case 'documentos':
        return <DocumentosPage />;
      case 'detalle-documento':
        return <DetalleDocumentoPage />;
      case 'respaldo':
        return <RespaldoPage />;
      case 'contingencia':
        return <ContingenciaPage />;
      case 'ayuda':
        return <AyudaPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
