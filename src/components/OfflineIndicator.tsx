import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#C0392B] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xl border border-red-400/30 animate-pulse"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo sin conexión — Mostrando contenido guardado</span>
    </div>
  );
};
