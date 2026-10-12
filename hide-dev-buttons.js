const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Hide Admin Dropdown Button
const adminBtnRegex = /<button onClick=\{\(\) => window\.open\('\/admin', '_blank'\)\}[^>]+>\s*.[^\s]*\s*Painel Admin \(Teste\)\s*<\/button>/g;
c = c.replace(adminBtnRegex, `
                        {userData?.role === 'ADMIN' && (
                          <button onClick={() => window.open('/admin', '_blank')} className="px-4 py-3 text-left text-sm font-bold text-yellow-500 hover:bg-gray-700 border-b border-gray-700 flex items-center gap-3">
                            🛠️ Painel Admin (Teste)
                          </button>
                        )}
`);

// 2. Hide [DEV] Simular Pagamento Button
const devBtnRegex = /<button[^>]+onClick=\{simulateGatewayPayment\}[^>]+>[\s\S]*?\{checkingPayment \? 'PROCESSANDO\.\.\.' : '.*\[DEV\] SIMULAR PAGAMENTO PAGO'\}[\s\S]*?<\/button>/g;
c = c.replace(devBtnRegex, `
                    {userData?.role === 'ADMIN' && (
                    <button 
                      onClick={simulateGatewayPayment}
                      disabled={checkingPayment}
                      className="bg-blue-600/20 text-blue-400 border border-blue-500/50 font-black py-3 rounded-xl hover:bg-blue-600 hover:text-white transition mt-2 flex items-center justify-center gap-2 text-sm"
                    >
                      {checkingPayment ? 'PROCESSANDO...' : '🚀 [DEV] SIMULAR PAGAMENTO PAGO'}
                    </button>
                    )}
`);

fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
