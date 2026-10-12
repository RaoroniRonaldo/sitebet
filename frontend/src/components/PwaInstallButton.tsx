'use client';

import React, { useState, useEffect } from 'react';

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Detectar se já está rodando instalado como App (Standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // 2. Detectar se é dispositivo iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
    }

    // 3. Capturar o evento nativo do Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('O aplicativo já está instalado no seu dispositivo!');
      return;
    }

    if (isIos) {
      // No iPhone/Safari, o prompt automático não é suportado pelo iOS, abre o tutorial
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Caso o navegador ainda não tenha disparado ou seja desktop
      alert('Para instalar:\n• No Android/Chrome: Toque nos 3 pontinhos no canto superior e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".\n• No PC: Clique no ícone de instalar na barra de endereço.');
    }
  };

  if (isInstalled) {
    return null; // Não exibe o botão se já estiver dentro do App instalado
  }

  return (
    <>
      {/* Botão de Instalar com Animação e Destaque */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-black px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm shadow-[0_0_15px_rgba(234,179,8,0.35)] hover:shadow-[0_0_20px_rgba(234,179,8,0.6)] transform hover:scale-105 transition-all duration-200 cursor-pointer border border-yellow-300/40"
        title="Instalar SiteBet no seu celular"
      >
        <span className="text-base md:text-lg animate-bounce">📲</span>
        <span className="font-extrabold tracking-wide uppercase"><span className="hidden sm:inline">Baixar </span>App</span>
      </button>

      {/* Modal explicativo para usuários de iPhone / iOS */}
      {showIosModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-yellow-500/40 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
                🍎
              </div>
              <h3 className="text-xl font-black text-yellow-400">Instalar no iPhone</h3>
              <p className="text-xs text-gray-400 mt-1">Siga os 3 passos simples no Safari:</p>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3 bg-gray-800/80 p-3 rounded-xl border border-gray-700/60">
                <span className="flex-shrink-0 w-7 h-7 bg-yellow-500 text-gray-950 rounded-full font-black flex items-center justify-center text-xs">1</span>
                <p className="text-gray-200">Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima ⎋ na barra do Safari).</p>
              </div>

              <div className="flex items-center gap-3 bg-gray-800/80 p-3 rounded-xl border border-gray-700/60">
                <span className="flex-shrink-0 w-7 h-7 bg-yellow-500 text-gray-950 rounded-full font-black flex items-center justify-center text-xs">2</span>
                <p className="text-gray-200">Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (ícone com sinal de +).</p>
              </div>

              <div className="flex items-center gap-3 bg-gray-800/80 p-3 rounded-xl border border-gray-700/60">
                <span className="flex-shrink-0 w-7 h-7 bg-yellow-500 text-gray-950 rounded-full font-black flex items-center justify-center text-xs">3</span>
                <p className="text-gray-200">Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!</p>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-6 w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs transition shadow-lg"
            >
              Entendi, fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
