'use client';
import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'games'>('overview');
  
  const [stats, setStats] = useState({ totalUsers: 0, totalDeposited: 0, totalWithdrawn: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    // Simplification for the demo: if they are logged in, we let them see the admin
    if (!savedToken) {
      router.push('/');
      return;
    }
    setToken(savedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        const [statsRes, usersRes, txRes, gamesRes] = await Promise.all([
          fetch(`${API_URL}/admin/stats`, { headers }),
          fetch(`${API_URL}/admin/users`, { headers }),
          fetch(`${API_URL}/admin/transactions`, { headers }),
          fetch(`${API_URL}/admin/games`, { headers })
        ]);
        
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
        setTransactions(await txRes.json());
        setGames(await gamesRes.json());
      } catch (e) {
        console.error('Erro ao buscar dados do admin', e);
      }
    };
    
    fetchAll();
  }, [token]);

  const handleUpdateRTP = async (id: string, newRTP: number) => {
    try {
      await fetch(`${API_URL}/admin/games/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rtpLevel: newRTP, isActive: true })
      });
      // Atualiza localmente para refletir na interface
      setGames(games.map(g => g.id === id ? { ...g, rtpLevel: newRTP } : g));
    } catch (e) {
      alert('Erro ao salvar RTP');
    }
  };

  if (!token) return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">Redirecionando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black border-r border-gray-800 p-6 flex flex-col h-auto md:h-screen sticky top-0">
        <h1 className="text-2xl font-black italic text-yellow-500 tracking-tighter mb-10">
          SITE<span className="text-white">BET</span> <span className="text-xs text-red-500 font-bold ml-1">ADMIN</span>
        </h1>
        
        <nav className="flex flex-col gap-2 flex-1">
          {['overview', 'users', 'transactions', 'games'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${activeTab === tab ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              {tab === 'overview' && '📊 Visão Geral'}
              {tab === 'users' && '👥 Usuários'}
              {tab === 'transactions' && '💸 Transações'}
              {tab === 'games' && '🎰 Jogos (RTP)'}
            </button>
          ))}
        </nav>
        
        <button onClick={() => router.push('/')} className="mt-8 text-gray-500 text-sm hover:text-white text-left">
          &larr; Voltar para a Loja
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-bold">
            {activeTab === 'overview' && 'Visão Geral'}
            {activeTab === 'users' && 'Gerenciar Usuários'}
            {activeTab === 'transactions' && 'Histórico Global'}
            {activeTab === 'games' && 'Configuração de Jogos (RTP)'}
          </h2>
          <p className="text-gray-400 mt-1">Bem-vindo ao Painel Administrativo</p>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl">
              <span className="text-gray-400 text-sm font-semibold uppercase">Total de Usuários</span>
              <div className="text-4xl font-black mt-2 text-blue-400">{stats.totalUsers}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl">
              <span className="text-gray-400 text-sm font-semibold uppercase">Total Depositado</span>
              <div className="text-4xl font-black mt-2 text-green-400">R$ {stats.totalDeposited?.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl">
              <span className="text-gray-400 text-sm font-semibold uppercase">Total Sacado</span>
              <div className="text-4xl font-black mt-2 text-red-400">R$ {stats.totalWithdrawn?.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl md:col-span-3">
              <span className="text-gray-400 text-sm font-semibold uppercase">Lucro da Casa (GGR Estimado)</span>
              <div className="text-5xl font-black mt-2 text-yellow-500">R$ {(stats.totalDeposited - stats.totalWithdrawn).toFixed(2)}</div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="p-4 text-gray-400 font-semibold">Nome / Email</th>
                  <th className="p-4 text-gray-400 font-semibold">Data Cadastro</th>
                  <th className="p-4 text-gray-400 font-semibold">Saldo Atual</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) && users.map(u => (
                  <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-4">
                      <div className="font-bold text-white">{u.fullName || 'Sem Nome'}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 font-bold text-green-400">R$ {u.wallet?.balance?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="p-4 text-gray-400 font-semibold">Usuário</th>
                  <th className="p-4 text-gray-400 font-semibold">Tipo</th>
                  <th className="p-4 text-gray-400 font-semibold">Valor</th>
                  <th className="p-4 text-gray-400 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(transactions) && transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-4">
                      <div className="font-bold text-white">{t.wallet?.user?.fullName}</div>
                      <div className="text-xs text-gray-400">{t.wallet?.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        t.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' :
                        t.type === 'WITHDRAW' ? 'bg-red-500/20 text-red-400' :
                        t.type === 'WIN' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`p-4 font-bold ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.amount > 0 ? '+' : ''} R$ {Math.abs(t.amount).toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-gray-300">{new Date(t.createdAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(games) && games.map(game => (
              <div key={game.id} className="bg-gray-800 border border-gray-700 p-6 rounded-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{game.imageUrl || '🎰'}</div>
                  <div>
                    <h3 className="text-xl font-bold">{game.name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">{game.provider}</span>
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">RTP (Taxa de Retorno)</span>
                    <span className={`font-black ${game.rtpLevel >= 90 ? 'text-green-400' : game.rtpLevel >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {game.rtpLevel}%
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={game.rtpLevel}
                    onChange={(e) => setGames(games.map(g => g.id === game.id ? { ...g, rtpLevel: Number(e.target.value) } : g))}
                    onMouseUp={(e) => handleUpdateRTP(game.id, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleUpdateRTP(game.id, Number((e.target as HTMLInputElement).value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    (0% = Casa ganha tudo | 100% = Jogador ganha sempre)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
