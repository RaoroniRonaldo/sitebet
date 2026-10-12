'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import MinesGame from '../../components/games/MinesGame';
import DoubleGame from '../../components/games/DoubleGame';
import HalloweenGame from '../../components/games/HalloweenGame';
import TigrinhoGame from '../../components/games/TigrinhoGame';
import SlotyGame from '../../components/games/SlotyGame';

// ==========================================
// MOCK DO JOGO DE SLOT (FORTUNE TIGER, ETC)
// ==========================================
function SlotGame({ code, token, balance, setBalance }: any) {
  const [betAmount, setBetAmount] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ isWin?: boolean, multiplier?: number, prize?: number } | null>(null);
  const [reels, setReels] = useState(['🐯', '🐯', '🐯']);

  const getEmojiForGame = () => {
    if (code.includes('tiger')) return ['🐯', '💰', '🧧', '💣', '🍊'];
    if (code.includes('ox')) return ['🐂', '💰', '🔥', '🪙', '🍒'];
    return ['💎', '7️⃣', '🍒', '🍉', '🔔'];
  };

  const playSpin = async () => {
    if (!token) return alert('Faça login primeiro!');
    if (balance < betAmount) return alert('Saldo insuficiente. Faça um depósito!');
    if (betAmount <= 0) return alert('Valor de aposta inválido');

    setSpinning(true);
    setResult(null);

    const symbols = getEmojiForGame();
    let interval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 100);

    try {
      const res = await fetch('http://localhost:3000/games/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameCode: code, betAmount })
      });
      const data = await res.json();
      
      setTimeout(() => {
        clearInterval(interval);
        setSpinning(false);
        
        if (data.error) { alert(data.error); return; }

        if (data.isWin) {
          const winSymbol = symbols[Math.floor(Math.random() * 2)];
          setReels([winSymbol, winSymbol, winSymbol]);
        }

        setBalance(data.newBalance);
        setResult({ isWin: data.isWin, multiplier: data.multiplier, prize: data.prizeAmount });
      }, 1500);

    } catch (e) {
      clearInterval(interval);
      setSpinning(false);
      alert('Erro de conexão');
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-8 z-10 mt-10">
      <div className="bg-gray-900 rounded-3xl p-6 border-4 border-gray-800 shadow-2xl relative">
        <div className="flex justify-between items-center bg-black rounded-xl p-6 border-2 border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
          {reels.map((emoji, idx) => (
            <div key={idx} className={`text-6xl ${spinning ? 'animate-bounce blur-[1px]' : ''} transition-all`}>
              {emoji}
            </div>
          ))}
        </div>
        
        {!spinning && result && (
          <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-black text-xl shadow-xl animate-bounce border-2 ${result.isWin ? 'bg-green-500 text-black border-green-300 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
            {result.isWin ? `GANHOU ${result.multiplier}x!` : 'PERDEU...'}
          </div>
        )}
      </div>

      {result?.isWin && !spinning && (
        <div className="text-center animate-pulse">
          <div className="text-green-400 text-5xl font-black drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">
            + R$ {result.prize?.toFixed(2)}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-bold uppercase text-xs">Valor da Aposta</span>
          <span className="text-white font-black text-lg">R$ {betAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex gap-2">
          {[1, 5, 10, 50].map(val => (
            <button 
              key={val} 
              onClick={() => setBetAmount(val)}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${betAmount === val ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              R$ {val}
            </button>
          ))}
        </div>

        <button 
          onClick={playSpin} 
          disabled={spinning}
          className={`w-full py-5 rounded-xl font-black text-2xl uppercase tracking-widest transition-all shadow-lg ${
            spinning ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-400 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
          }`}
        >
          {spinning ? 'Girando...' : 'GIRAR'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MOCK DO JOGO CRASH (AVIATOR)
// ==========================================
function CrashGame({ code, token, balance, setBalance }: any) {
  const [betAmount, setBetAmount] = useState(1);
  const [status, setStatus] = useState<'IDLE' | 'FLYING' | 'CRASHED'>('IDLE');
  const [multiplier, setMultiplier] = useState(1.00);
  const [trueCrashPoint, setTrueCrashPoint] = useState(1.00);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const multiplierRef = useRef(1.00);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startGame = async () => {
    if (!token) return alert('Faça login primeiro!');
    if (balance < betAmount) return alert('Saldo insuficiente!');
    if (betAmount <= 0) return alert('Aposta inválida');

    setStatus('IDLE');
    setMultiplier(1.00);
    setWinAmount(null);
    multiplierRef.current = 1.00;

    try {
      // 1. Inicia o jogo no servidor (desconta saldo e pega o ponto de crash real calculado pelo RTP)
      const res = await fetch('http://localhost:3000/games/crash/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameCode: code, betAmount })
      });
      const data = await res.json();
      
      if (data.error) return alert(data.error);

      setBalance(data.newBalance);
      setTrueCrashPoint(data.trueCrashPoint);
      setStatus('FLYING');

      // 2. Animação Visual do Multiplicador subindo
      timerRef.current = setInterval(() => {
        multiplierRef.current += 0.01 + (multiplierRef.current * 0.005); // Curva exponencial
        const currentMult = Number(multiplierRef.current.toFixed(2));
        
        if (currentMult >= data.trueCrashPoint) {
          // Bateu no crash point real! Voo acabou.
          clearInterval(timerRef.current);
          setMultiplier(data.trueCrashPoint);
          setStatus('CRASHED');
        } else {
          setMultiplier(currentMult);
        }
      }, 50);

    } catch (e) {
      alert('Erro de conexão ao iniciar voo');
    }
  };

  const cashOut = async () => {
    if (status !== 'FLYING') return;

    clearInterval(timerRef.current);
    setStatus('IDLE'); // Pausa a tela p/ mostrar o ganho

    const prize = Number((betAmount * multiplier).toFixed(2));
    setWinAmount(prize);

    try {
      const res = await fetch('http://localhost:3000/games/crash/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameCode: code, prizeAmount: prize })
      });
      const data = await res.json();
      
      if (data.newBalance) {
        setBalance(data.newBalance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-4 z-10 mt-4">
      <div className="bg-[#1c1c1e] rounded-3xl p-4 border border-gray-800 shadow-2xl relative h-[300px] flex items-center justify-center overflow-hidden">
        
        {/* Gráfico Fake Visual */}
        <svg className="absolute bottom-0 left-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          {status !== 'IDLE' && (
            <path d={`M 0 100 Q 50 ${100 - (multiplier * 5)} 100 ${100 - (multiplier * 20)}`} fill="none" stroke="#ef4444" strokeWidth="2" />
          )}
        </svg>

        {/* Aviãozinho Emoji Visual */}
        {status !== 'IDLE' && status !== 'CRASHED' && (
          <div 
            className="absolute text-5xl transition-all" 
            style={{ 
              bottom: `${Math.min(80, multiplier * 10)}%`, 
              left: `${Math.min(80, multiplier * 15)}%`,
              transform: `rotate(-15deg)`
            }}
          >
            ✈️
          </div>
        )}

        <div className="z-10 text-center flex flex-col items-center">
          {status === 'CRASHED' && (
            <div className="text-red-500 font-black text-2xl uppercase tracking-widest mb-2 animate-pulse">
              Voou para longe
            </div>
          )}
          
          <div className={`font-black tracking-tighter ${status === 'CRASHED' ? 'text-red-500 text-6xl' : 'text-white text-8xl'}`}>
            {multiplier.toFixed(2)}x
          </div>

          {winAmount !== null && status !== 'CRASHED' && (
            <div className="mt-4 bg-green-500/20 border border-green-500 text-green-400 px-6 py-2 rounded-full font-black text-xl animate-bounce">
              Você ganhou R$ {winAmount.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-bold uppercase text-xs">Valor da Aposta</span>
          <span className="text-white font-black text-lg">R$ {betAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex gap-2">
          {[1, 5, 10, 50].map(val => (
            <button 
              key={val} 
              onClick={() => { if(status === 'IDLE' || status === 'CRASHED') setBetAmount(val); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${(status==='FLYING') ? 'opacity-50 cursor-not-allowed' : ''} ${betAmount === val ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              R$ {val}
            </button>
          ))}
        </div>

        {status === 'IDLE' || status === 'CRASHED' ? (
          <button 
            onClick={startGame} 
            className="w-full py-5 rounded-xl font-black text-2xl uppercase tracking-widest transition-all bg-red-500 text-white hover:bg-red-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            APOSTAR
          </button>
        ) : (
          <button 
            onClick={cashOut} 
            className="w-full py-5 rounded-xl font-black text-2xl uppercase tracking-widest transition-all bg-yellow-500 text-gray-900 hover:bg-yellow-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse"
          >
            SACAR (R$ {(betAmount * multiplier).toFixed(2)})
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// CONTAINER PRINCIPAL DA TELA DE PLAY
// ==========================================

function GameScreen() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'game';
  
  const [token, setToken] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchBalance(savedToken);
    }
  }, []);

  const fetchBalance = async (jwt: string) => {
    try {
      const res = await fetch('http://localhost:3000/wallet/balance', { headers: { Authorization: `Bearer ${jwt}` } });
      const data = await res.json();
      if (data.balance !== undefined) setBalance(data.balance);
    } catch (e) { }
  };

  const renderGame = () => {
    if (code === 'mines') return <MinesGame code={code} token={token} balance={balance} setBalance={setBalance} />;
    if (code === 'double') return <DoubleGame code={code} token={token} balance={balance} setBalance={setBalance} />;
    if (code === 'halloween') return <HalloweenGame token={token} balance={balance} setBalance={setBalance} />;
    if (code === 'fortune-tiger' || code === 'tigrinho') return <TigrinhoGame />;
    if (code === 'sloty' || code === 'fortune-ox') return <SlotyGame />;
    if (code.includes('aviator') || code.includes('spaceman')) return <CrashGame code={code} token={token} balance={balance} setBalance={setBalance} />;
    return <SlotGame code={code} token={token} balance={balance} setBalance={setBalance} />;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] blur-[150px] pointer-events-none opacity-20 bg-blue-600 transition-colors duration-1000"></div>

      <header className="absolute top-0 w-full p-4 flex justify-between items-center z-10 border-b border-gray-800 bg-black/50">
        <div className="font-bold text-gray-400 capitalize flex items-center gap-2">
          <span className="text-xl">🎮</span> SITEBET ORIGINALS
        </div>
        <div className="bg-gray-900 px-4 py-2 rounded-full border border-yellow-500/30 text-yellow-500 font-black text-xl shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          R$ {balance.toFixed(2)}
        </div>
      </header>

      {renderGame()}

      <button onClick={() => window.close()} className="absolute bottom-6 text-gray-500 hover:text-white font-medium z-10">
        Sair do Jogo
      </button>
    </div>
  );
}

export default function Play() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
      <GameScreen />
    </Suspense>
  );
}
