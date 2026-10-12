'use client';
import { API_URL } from '@/lib/api';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SlotyGame() {
  const [balance, setBalance] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);
  const router = useRouter();

  const initialBalance = useRef<number | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.push('/');
      return;
    }
    setToken(savedToken);

    // Buscar Saldo do Banco
    fetch(`${API_URL}/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${savedToken}` }
    })
    .then(res => res.json())
    .then(data => {
      setBalance(data.balance);
      initialBalance.current = data.balance;
      
      setTimeout(() => {
        setIsWalletLoaded(true);
      }, 800);
    })
    .catch(err => console.error(err));
  }, [router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'HALLOWEEN_BALANCE_UPDATE') {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          fetch(`${API_URL}/wallet/balance`, {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          })
          .then(res => res.json())
          .then(data => setBalance(data.balance))
          .catch(e => console.error(e));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto pt-4 relative min-h-screen pb-20">
      
      {/* Header Syncado */}
      <div className="w-full flex justify-between items-center bg-gray-900/80 backdrop-blur border border-gray-800 p-4 rounded-2xl mb-4 relative z-20">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white flex items-center gap-2">
           Voltar
        </button>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Seu Saldo</p>
            <p className="text-green-500 font-black text-xl">
              R$ {balance !== null ? balance.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Frame do Jogo */}
      <div className="w-full max-w-4xl bg-black rounded-3xl overflow-hidden border-2 border-yellow-900 shadow-[0_0_50px_rgba(255,204,0,0.2)] relative" style={{ height: '700px' }}>
        
        {!isWalletLoaded && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-yellow-500 font-black tracking-widest animate-pulse">CARREGANDO SLOTY...</p>
          </div>
        )}

        {isWalletLoaded && initialBalance.current !== null && token && (
          <iframe 
            src={`/games/sloty/index.html?balance=${initialBalance.current}&token=${token}`}
            className="w-full h-full border-none"
            title="Sloty Game"
          />
        )}
      </div>

    </div>
  );
}
