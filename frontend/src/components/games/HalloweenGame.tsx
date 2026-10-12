'use client';
import { API_URL } from '@/lib/api';
import React, { useEffect, useRef, useState } from 'react';

export default function HalloweenGame({ token, balance, setBalance }: { token: string | null, balance: number, setBalance: (b: number) => void }) {
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);
  const initialBalance = useRef<number | null>(null);

  // Aguarda um instante para garantir que o saldo principal da carteira foi recebido da API
  // antes de inicializar o Iframe com o valor correto
  useEffect(() => {
    if (token && !isWalletLoaded) {
      const timer = setTimeout(() => {
        initialBalance.current = balance; // Captura o saldo REAL depois do delay
        setIsWalletLoaded(true);
      }, 800); // 800ms é muito seguro para a chamada GET /wallet/balance retornar no parent
      return () => clearTimeout(timer);
    }
  }, [token, balance, isWalletLoaded]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'HALLOWEEN_BALANCE_UPDATE') {
        // Atualiza a carteira consultando o backend diretamente
        try {
          const res = await fetch(`${API_URL}/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data && data.balance !== undefined) {
            setBalance(data.balance);
          }
        } catch (e) {
          console.error("Erro ao atualizar saldo no frontend", e);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token, setBalance]);

  if (!isWalletLoaded || initialBalance.current === null) {
    return (
      <div className="w-full h-[600px] max-w-6xl mt-4 z-10 border-4 border-gray-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,165,0,0.3)] bg-black relative flex items-center justify-center">
        <div className="text-white font-bold text-xl animate-pulse">Sincronizando Carteira...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] max-w-6xl mt-4 z-10 border-4 border-gray-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,165,0,0.3)] bg-black relative">
      <iframe src={`/games/halloween/index.html?balance=${initialBalance.current}&token=${token}`} className="w-full h-full border-none" title="Halloween Slot"></iframe>
      
      <div className="absolute top-2 right-2 bg-green-500/20 text-green-500 text-xs px-3 py-1 rounded-full border border-green-500/50 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Sincronizado com Carteira Real
      </div>
    </div>
  );
}
