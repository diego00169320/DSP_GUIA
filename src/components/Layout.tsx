import type { ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ContingencyBanner from '@/components/ContingencyBanner';
import ToastContainer from '@/components/ToastContainer';

export default function Layout({ children }: { children: ReactNode }) {
  const { contingenciaActiva } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        {contingenciaActiva && <ContingencyBanner />}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
