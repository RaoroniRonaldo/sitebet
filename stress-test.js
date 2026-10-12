

const BASE_URL = 'http://localhost:3000';

async function runStressTest() {
  console.log('🚀 Iniciando Teste de Estresse ACID nas Apostas...');

  const randomString = Math.random().toString(36).substring(7);
  const email = `stresstest_${randomString}@email.com`;
  
  // 1. Registro
  console.log(`\n[1] Registrando usuário: ${email}`);
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: '123', fullName: 'Stress Test User' })
  });
  let data = await res.json();
  const token = data.token;
  if (!token) throw new Error('Falha no registro');
  console.log('✅ Usuário registrado com sucesso.');

  // 2. Depósito de R$ 1.000,00
  console.log(`\n[2] Realizando depósito de R$ 1.000,00...`);
  res = await fetch(`${BASE_URL}/wallet/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount: 1000 })
  });
  data = await res.json();
  console.log(`✅ Depósito concluído. Saldo atual: R$ ${data.newBalance}`);

  // 3. Disparo de Apostas Concorrentes (Gatilho da Concorrência)
  const CONCURRENT_REQUESTS = 50;
  const BET_AMOUNT = 10;
  console.log(`\n[3] 🔥 Disparando ${CONCURRENT_REQUESTS} apostas SIMULTÂNEAS de R$ ${BET_AMOUNT} no Fortune Tiger...`);
  
  const startTime = Date.now();
  
  // Promise.all executa todos de uma vez, testando o lock do banco de dados (ACID)
  const requests = Array.from({ length: CONCURRENT_REQUESTS }).map(() => 
    fetch(`${BASE_URL}/games/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ gameCode: 'fortune-tiger', betAmount: BET_AMOUNT })
    }).then(r => r.json())
  );

  const results = await Promise.all(requests);
  const endTime = Date.now();

  console.log(`⏱️ Tempo total: ${endTime - startTime}ms`);

  // 4. Analisando Resultados
  let successfulSpins = 0;
  let totalWins = 0;
  let totalPrizes = 0;
  let errors = 0;

  results.forEach(r => {
    if (r.error) {
      errors++;
    } else {
      successfulSpins++;
      if (r.isWin) {
        totalWins++;
        totalPrizes += r.prizeAmount;
      }
    }
  });

  console.log(`\n📊 [Resultados da Execução]`);
  console.log(`- Spins Completados: ${successfulSpins}`);
  console.log(`- Erros/Rejeições: ${errors}`);
  console.log(`- Rodadas Vencedoras: ${totalWins}`);
  console.log(`- Total de Prêmios Distribuídos: R$ ${totalPrizes.toFixed(2)}`);

  // 5. Checando Integridade do Saldo (ACID Check)
  console.log(`\n[4] Verificando integridade matemática do banco de dados...`);
  res = await fetch(`${BASE_URL}/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  data = await res.json();
  const finalBalance = data.balance;

  const totalBetDeducted = successfulSpins * BET_AMOUNT;
  const expectedBalance = 1000 - totalBetDeducted + totalPrizes;

  console.log(`- Saldo Final Real: R$ ${finalBalance.toFixed(2)}`);
  console.log(`- Saldo Esperado (Matemático): R$ ${expectedBalance.toFixed(2)}`);
  
  if (Math.abs(finalBalance - expectedBalance) < 0.01) {
    console.log(`\n✅ TESTE ACID PASSOU COM SUCESSO! Banco de dados transacional suportou concorrência sem vazar centavos.`);
  } else {
    console.log(`\n❌ FALHA DE INTEGRIDADE DETECTADA. Condição de corrida (Race Condition) ocorreu.`);
  }

}

runStressTest().catch(console.error);
