import React, { useState, useEffect, useRef } from 'react';

export default function DoubleGame({ code, token, balance, setBalance }: any) {
  const [betAmount, setBetAmount] = useState(1);
  const [selectedColor, setSelectedColor] = useState<'RED' | 'BLACK' | 'WHITE' | null>(null);
  const [status, setStatus] = useState<'BETTING' | 'SPINNING' | 'FINISHED'>('BETTING');
  const [timeLeft, setTimeLeft] = useState(10);
  const [winnerColor, setWinnerColor] = useState<'RED' | 'BLACK' | 'WHITE' | null>(null);
  
  // Resultado do giro
  const [wheelOffset, setWheelOffset] = useState(0);

  // Histórico fake
  const [history, setHistory] = useState<('RED' | 'BLACK' | 'WHITE')[]>(['RED', 'BLACK', 'RED', 'WHITE', 'BLACK', 'BLACK', 'RED']);

  // Padrão de cores (Blaze: Branco=0, Vermelho=1-7, Preto=8-14)
  const pattern = [
    { c: 'WHITE', n: 0 }, { c: 'RED', n: 1 }, { c: 'BLACK', n: 14 }, { c: 'RED', n: 2 },
    { c: 'BLACK', n: 13 }, { c: 'RED', n: 3 }, { c: 'BLACK', n: 12 }, { c: 'RED', n: 4 },
    { c: 'WHITE', n: 0 }, { c: 'BLACK', n: 11 }, { c: 'RED', n: 5 }, { c: 'BLACK', n: 10 },
    { c: 'RED', n: 6 }, { c: 'BLACK', n: 9 }, { c: 'RED', n: 7 }, { c: 'BLACK', n: 8 }
  ];

  // Gera a esteira multiplicando o padrão pra dar a ilusão de infinito
  const wheelItems = Array(10).fill(pattern).flat();

  useEffect(() => {
    if (status === 'BETTING') {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timer);
            spinWheel();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const spinWheel = async () => {
    setStatus('SPINNING');

    // Faz a aposta se o usuário tiver escolhido cor
    let isParticipating = false;
    let localWinColor: 'RED'|'BLACK'|'WHITE' = 'BLACK';

    // Randomize a cor real (80% black/red, 20% white p/ mockup)
    const r = Math.random();
    if (r < 0.05) localWinColor = 'WHITE';
    else if (r < 0.525) localWinColor = 'RED';
    else localWinColor = 'BLACK';

    if (selectedColor && token && balance >= betAmount) {
      isParticipating = true;
      try {
        await fetch('http://localhost:3000/games/originals/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ game: 'DOUBLE', betAmount, winAmount: 0 })
        });
      } catch(e){}
    }

    // Calcula o offset visual para cair na cor exata no meio da roda
    // Pega o meio da esteira
    const startIndex = Math.floor(wheelItems.length / 2);
    let targetIndex = startIndex;
    while(wheelItems[targetIndex].c !== localWinColor) { targetIndex++; }
    
    // Cada caixa tem 80px + 8px gap = 88px.
    const randomOffsetInBox = Math.random() * 40 - 20; // pra não cair exato no meio sempre
    const finalOffset = -(targetIndex * 88) + (300) + randomOffsetInBox; // Ajuste baseado no width do container

    setWheelOffset(finalOffset);

    // Espera a animação terminar (5s)
    setTimeout(async () => {
      setWinnerColor(localWinColor);
      setStatus('FINISHED');
      setHistory(prev => [...prev.slice(1), localWinColor]);

      if (isParticipating && selectedColor === localWinColor) {
        // GANHOU
        const winAmount = selectedColor === 'WHITE' ? betAmount * 14 : betAmount * 2;
        try {
          const res = await fetch('http://localhost:3000/games/originals/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ game: 'DOUBLE', betAmount: 0, winAmount })
          });
          const data = await res.json();
          if (data.success) setBalance(data.newBalance);
        } catch(e){}
      }

      // Reinicia
      setTimeout(() => {
        setStatus('BETTING');
        setTimeLeft(10);
        setSelectedColor(null);
        setWinnerColor(null);
        setWheelOffset(0); // Reseta sutilmente
      }, 4000);

    }, 5500);
  };

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 mt-4 items-stretch z-10">
      
      {/* Sidebar Controls */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col gap-6 w-full md:w-[300px]">
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold uppercase text-xs">Valor da Aposta</label>
          <div className="flex bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <span className="p-4 text-gray-500 font-bold">R$</span>
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={status !== 'BETTING'} className="w-full bg-transparent text-white font-black text-xl outline-none" />
            <div className="flex flex-col border-l border-gray-700">
              <button onClick={()=>setBetAmount(b=>b/2)} disabled={status!=='BETTING'} className="px-3 flex-1 hover:bg-gray-700 font-bold text-xs border-b border-gray-700">/2</button>
              <button onClick={()=>setBetAmount(b=>b*2)} disabled={status!=='BETTING'} className="px-3 flex-1 hover:bg-gray-700 font-bold text-xs">x2</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold uppercase text-xs text-center">Cor da Aposta</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedColor('RED')}
              disabled={status !== 'BETTING'}
              className={`flex-1 py-4 rounded-xl font-black text-white transition border-4 ${selectedColor === 'RED' ? 'border-yellow-500 scale-105' : 'border-transparent hover:scale-105'} bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]`}
            >
              2X
            </button>
            <button 
              onClick={() => setSelectedColor('WHITE')}
              disabled={status !== 'BETTING'}
              className={`flex-1 py-4 rounded-xl font-black text-gray-900 transition border-4 ${selectedColor === 'WHITE' ? 'border-yellow-500 scale-105' : 'border-transparent hover:scale-105'} bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]`}
            >
              14X
            </button>
            <button 
              onClick={() => setSelectedColor('BLACK')}
              disabled={status !== 'BETTING'}
              className={`flex-1 py-4 rounded-xl font-black text-white transition border-4 ${selectedColor === 'BLACK' ? 'border-yellow-500 scale-105' : 'border-transparent hover:scale-105'} bg-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
            >
              2X
            </button>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800 text-center">
          {status === 'BETTING' && <div className="text-gray-400 font-bold animate-pulse">Aguardando...</div>}
          {status === 'SPINNING' && <div className="text-yellow-500 font-black animate-spin w-8 h-8 mx-auto border-4 border-yellow-500 border-t-transparent rounded-full"></div>}
          {status === 'FINISHED' && (
            <div className={`font-black text-2xl animate-bounce ${winnerColor === 'RED' ? 'text-red-500' : winnerColor === 'WHITE' ? 'text-white' : 'text-gray-500'}`}>
              DEU {winnerColor === 'RED' ? 'VERMELHO' : winnerColor === 'WHITE' ? 'BRANCO' : 'PRETO'}!
            </div>
          )}
        </div>
      </div>

      {/* Roda (Wheel) */}
      <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-gray-800 shadow-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Progress Bar Timer */}
        {status === 'BETTING' && (
          <div className="w-full bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
            <div className="bg-yellow-500 h-full transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 10) * 100}%` }}></div>
          </div>
        )}

        {/* Roleta Visual */}
        <div className="w-full max-w-[600px] h-28 bg-gray-900 rounded-xl border-4 border-gray-800 relative overflow-hidden shadow-inner flex items-center">
          
          {/* Fio da Navalha (Marcador) */}
          <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-yellow-500 z-20 shadow-[0_0_10px_rgba(234,179,8,1)]"></div>
          
          {/* Esteira que gira */}
          <div 
            className="flex gap-2 absolute top-0 h-full items-center pl-[50%]"
            style={{ 
              transform: `translateX(${status === 'BETTING' ? 0 : wheelOffset}px)`, 
              transition: status === 'SPINNING' ? 'transform 5s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none'
            }}
          >
            {wheelItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`w-[80px] h-[80px] rounded-lg shrink-0 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-black/20
                  ${item.c === 'RED' ? 'bg-red-600 text-red-900' : item.c === 'WHITE' ? 'bg-white text-gray-400' : 'bg-gray-800 text-gray-600'}
                `}
              >
                {item.c === 'WHITE' ? '⭐' : item.n}
              </div>
            ))}
          </div>
        </div>

        {/* Histórico Recente */}
        <div className="mt-8 flex gap-2">
          {history.map((c, i) => (
            <div key={i} className={`w-8 h-8 rounded-full shadow-md ${c === 'RED' ? 'bg-red-600' : c === 'WHITE' ? 'bg-white' : 'bg-gray-800'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
