import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FactuSys runtime error', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-error-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-100">
            <AlertTriangle className="h-7 w-7 text-error-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-800">No se pudo cargar FactuSys</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Ocurrió un problema al mostrar la aplicación. Recarga la página para intentarlo nuevamente.
          </p>
          <button onClick={this.handleReload} className="btn-primary mt-6">
            <RefreshCw className="h-4 w-4" />
            Recargar aplicación
          </button>
        </div>
      </div>
    );
  }
}
