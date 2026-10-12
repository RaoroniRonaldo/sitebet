'use client';
import { API_URL } from '@/lib/api';
import React, { useState, useRef, useEffect } from 'react';

export default function MinesGame({ code, token, balance, setBalance }: any) {
  const [betAmount, setBetAmount] = useState(1);
  const [bombsCount, setBombsCount] = useState(3);
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'WON' | 'LOST'>('IDLE');
  const [grid, setGrid] = useState<{ isBomb: boolean; revealed: boolean }[]>([]);
  const [multiplier, setMultiplier] = useState(1.0);
  const [diamondsFound, setDiamondsFound] = useState(0);
  
  // Audio refs for a richer experience
  const soundClick = useRef(typeof Audio !== "undefined" ? new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3') : null);
  const soundBomb = useRef(typeof Audio !== "undefined" ? new Audio('https://freesound.org/data/previews/128/128299_2337290-lq.mp3') : null);
  const soundWin = useRef(typeof Audio !== "undefined" ? new Audio('https://freesound.org/data/previews/270/270319_5123851-lq.mp3') : null);

  const totalCells = 25;

  const calculateNextMultiplier = (found: number, totalB: number) => {
    // Formula baseada em probabilidade real de Campo Minado
    let currentProbability = 1.0;
    for (let i = 0; i < found; i++) {
      currentProbability *= (totalCells - totalB - i) / (totalCells - i);
    }
    const houseEdge = 0.95; // 95% RTP
    return Number(((1 / currentProbability) * houseEdge).toFixed(2));
  };

  const startGame = async () => {
    if (!token) return alert('Faça login!');
    if (balance < betAmount) return alert('Saldo insuficiente!');
    
    // Dispara a aposta no backend
    try {
      const res = await fetch(`${API_URL}/games/originals/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: 'MINES', betAmount, winAmount: 0 }) // Só aposta inicial
      });
      const data = await res.json();
      if (!data.success) return alert(data.error);
      setBalance(data.newBalance);
      
      // Gera a grade localmente (No futuro mover pro servidor)
      let newGrid = Array(totalCells).fill({ isBomb: false, revealed: false });
      let bombsPlaced = 0;
      while(bombsPlaced < bombsCount) {
        let r = Math.floor(Math.random() * totalCells);
        if(!newGrid[r].isBomb) {
          newGrid[r] = { isBomb: true, revealed: false };
          bombsPlaced++;
        }
      }
      setGrid(newGrid);
      setStatus('PLAYING');
      setDiamondsFound(0);
      setMultiplier(1.0);
    } catch(e) {
      alert('Erro de conexão');
    }
  };

  const handleCellClick = (index: number) => {
    if (status !== 'PLAYING') return;
    if (grid[index].revealed) return;

    const newGrid = [...grid];
    newGrid[index] = { ...newGrid[index], revealed: true };
    setGrid(newGrid);

    if (newGrid[index].isBomb) {
      // PERDEU
      soundBomb.current?.play().catch(()=>{});
      setStatus('LOST');
      // Revela todas as bombas
      setGrid(newGrid.map(c => ({ ...c, revealed: c.isBomb ? true : c.revealed })));
    } else {
      // DIAMANTE
      soundClick.current?.play().catch(()=>{});
      const newFound = diamondsFound + 1;
      setDiamondsFound(newFound);
      setMultiplier(calculateNextMultiplier(newFound, bombsCount));
      
      if (newFound === totalCells - bombsCount) {
        // Venceu tudo! Auto-cashout
        cashout();
      }
    }
  };

  const cashout = async () => {
    if (status !== 'PLAYING' || diamondsFound === 0) return;
    setStatus('WON');
    soundWin.current?.play().catch(()=>{});
    
    const winAmount = betAmount * multiplier;
    
    try {
      const res = await fetch(`${API_URL}/games/originals/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: 'MINES', betAmount: 0, winAmount }) // Sem aposta nova, apenas envia o prêmio
      });
      const data = await res.json();
      if (data.success) setBalance(data.newBalance);
    } catch(e) {}
  };

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 mt-4 items-stretch z-10">
      
      {/* Sidebar Controls */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col gap-6 w-full md:w-[300px]">
        
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold uppercase text-xs">Valor da Aposta</label>
          <div className="flex bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <span className="p-4 text-gray-500 font-bold">R$</span>
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={status === 'PLAYING'} className="w-full bg-transparent text-white font-black text-xl outline-none" />
            <div className="flex flex-col border-l border-gray-700">
              <button onClick={()=>setBetAmount(b=>b/2)} disabled={status==='PLAYING'} className="px-3 flex-1 hover:bg-gray-700 font-bold text-xs border-b border-gray-700">/2</button>
              <button onClick={()=>setBetAmount(b=>b*2)} disabled={status==='PLAYING'} className="px-3 flex-1 hover:bg-gray-700 font-bold text-xs">x2</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold uppercase text-xs">Minas ({bombsCount})</label>
          <input type="range" min="1" max="24" value={bombsCount} onChange={(e) => setBombsCount(Number(e.target.value))} disabled={status === 'PLAYING'} className="w-full accent-green-500" />
        </div>

        {status === 'PLAYING' ? (
          <button onClick={cashout} className="w-full py-5 rounded-xl font-black text-2xl uppercase tracking-widest transition-all bg-green-500 text-gray-900 hover:bg-green-400 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
            SACAR {(betAmount * multiplier).toFixed(2)}
          </button>
        ) : (
          <button onClick={startGame} className="w-full py-5 rounded-xl font-black text-2xl uppercase tracking-widest transition-all bg-yellow-500 text-gray-900 hover:bg-yellow-400 hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            APOSTAR
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="bg-[#1c1c1e] rounded-3xl p-4 md:p-8 border border-gray-800 shadow-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Status Overlay */}
        {status === 'WON' && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-fade-in">
            <div className="text-5xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,1)] animate-bounce text-center">
              VOCÊ GANHOU!<br/>+ R$ {(betAmount * multiplier).toFixed(2)}
            </div>
            <span className="text-xl font-bold mt-2 text-white bg-black/50 px-4 py-1 rounded-full">{multiplier}x Multiplicador</span>
          </div>
        )}

        {status === 'LOST' && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm z-20 flex items-center justify-center animate-fade-in">
            <div className="text-6xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)] animate-pulse">ESTOUROU!</div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2 md:gap-3 w-full max-w-[400px] aspect-square relative z-10">
          {grid.length === 0 ? (
             Array(25).fill(0).map((_, i) => (
               <div key={i} className="bg-gray-800/80 rounded-lg shadow-inner border border-gray-700/50"></div>
             ))
          ) : (
            grid.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={status !== 'PLAYING' || cell.revealed}
                className={`rounded-lg md:rounded-xl shadow-lg border-b-4 flex items-center justify-center text-3xl md:text-5xl transition-all duration-300 transform
                  ${cell.revealed ? 
                    (cell.isBomb ? 'bg-red-500 border-red-700 scale-95' : 'bg-[#18181b] border-[#101012] scale-100 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]') 
                    : 'bg-gray-700 border-gray-800 hover:bg-gray-600 hover:-translate-y-1 cursor-pointer'
                  }
                `}
              >
                {cell.revealed && (cell.isBomb ? '💣' : '💎')}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
