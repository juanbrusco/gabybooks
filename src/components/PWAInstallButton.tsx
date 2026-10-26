import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA on home screen, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        id="btn-pwa-install"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-bold transition-all shadow-sm border border-emerald-400/40 cursor-pointer ${className}`}
        title="Instalar La Biblioteca de Gaby como aplicación en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#34495E] hover:bg-[#2C3E50] text-gray-200 text-xs font-semibold transition-all border border-gray-500/30 cursor-pointer ${className}`}
          title="Cómo instalar en iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#3498DB] shrink-0" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[#2D3E50] text-white p-6 shadow-2xl border border-gray-600 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                aria-label="Cerrar guía"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#E67E22] flex items-center justify-center text-white font-black text-lg shadow-md">
                  G
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instalar en iPhone o iPad</h3>
                  <p className="text-xs text-gray-300">Agrega la app a tu pantalla de inicio</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-gray-200 bg-[#1A252F] p-4 rounded-xl border border-gray-700/60">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#34495E] text-[#3498DB] shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">1. Presiona Compartir</p>
                    <p className="text-gray-400 text-xs">Toca el botón compartir en la barra inferior de Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#34495E] text-[#2ECC71] shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">2. Agregar a inicio</p>
                    <p className="text-gray-400 text-xs">Desliza y selecciona "Agregar a la pantalla de inicio".</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
