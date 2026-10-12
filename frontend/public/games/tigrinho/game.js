const SYMBOLS = {
    1: '🍊', // Laranja
    2: '🚀', // Foguete
    3: '🐸', // Sapo
    4: '💰', // Pote
    5: '🧧', // Envelope
    6: '🐯'  // Tigre (WILD)
};

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
let balance = parseFloat(urlParams.get('balance') || 0);

const balanceEl = document.getElementById('balance');
const betEl = document.getElementById('bet-value');
const btnMinus = document.getElementById('btn-bet-minus');
const btnPlus = document.getElementById('btn-bet-plus');
const btnSpin = document.getElementById('btn-spin');
const winOverlay = document.getElementById('win-overlay');

let currentBet = 1.00;
const BET_STEPS = [0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
let betIndex = 1;

let isSpinning = false;

// Initial Draw
function updateUI() {
    balanceEl.textContent = `R$ ${balance.toFixed(2)}`;
    betEl.textContent = `R$ ${currentBet.toFixed(2)}`;
}

updateUI();

btnMinus.addEventListener('click', () => {
    if (betIndex > 0 && !isSpinning) {
        betIndex--;
        currentBet = BET_STEPS[betIndex];
        updateUI();
    }
});

btnPlus.addEventListener('click', () => {
    if (betIndex < BET_STEPS.length - 1 && !isSpinning) {
        betIndex++;
        currentBet = BET_STEPS[betIndex];
        updateUI();
    }
});

// Setup reels
const REEL_SIZE = 3;
const SYMBOL_HEIGHT = 100;
const EXTRA_SYMBOLS = 20; // For spinning effect

function fillReel(reelId, symbolsArray) {
    const symbolsDiv = document.getElementById(`symbols-${reelId}`);
    symbolsDiv.innerHTML = '';
    
    // Add extra random symbols for the spin animation blur
    for(let i=0; i<EXTRA_SYMBOLS; i++) {
        const div = document.createElement('div');
        div.className = 'symbol';
        div.textContent = SYMBOLS[Math.floor(Math.random() * 6) + 1];
        symbolsDiv.appendChild(div);
    }

    // Add actual result at the bottom
    symbolsArray.forEach(symId => {
        const div = document.createElement('div');
        div.className = 'symbol result-symbol';
        div.textContent = SYMBOLS[symId] || '❓';
        symbolsDiv.appendChild(div);
    });

    // Reset position
    symbolsDiv.style.transition = 'none';
    symbolsDiv.style.transform = `translateY(0px)`;
}

async function spin() {
    if (isSpinning) return;
    if (balance < currentBet) {
        alert("Saldo Insuficiente!");
        return;
    }

    isSpinning = true;
    btnSpin.disabled = true;
    winOverlay.classList.remove('show');
    
    // Clear highlights
    document.querySelectorAll('.symbol').forEach(el => el.classList.remove('highlight'));

    try {
        const res = await fetch('http://localhost:3000/games/originals/tigrinho/spin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ betAmount: currentBet })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro no servidor');
        }

        const data = await res.json();
        
        // data.grid is 3x3 matrix (row, col)
        // Convert to (col, row) for the reels
        const finalReels = [
            [data.grid[0][0], data.grid[1][0], data.grid[2][0]],
            [data.grid[0][1], data.grid[1][1], data.grid[2][1]],
            [data.grid[0][2], data.grid[1][2], data.grid[2][2]]
        ];

        // Animate
        const spinPromises = [];
        for (let i = 0; i < 3; i++) {
            fillReel(i, finalReels[i]);
            
            const symbolsDiv = document.getElementById(`symbols-${i}`);
            
            // Force reflow
            symbolsDiv.offsetHeight; 

            // Calculate target translateY
            const targetY = -(EXTRA_SYMBOLS * SYMBOL_HEIGHT);
            
            const p = new Promise(resolve => {
                setTimeout(() => {
                    symbolsDiv.style.transition = `transform ${2 + i*0.5}s cubic-bezier(0.15, 0.85, 0.35, 1)`;
                    symbolsDiv.style.transform = `translateY(${targetY}px)`;
                    
                    symbolsDiv.addEventListener('transitionend', resolve, { once: true });
                }, i * 200);
            });
            spinPromises.push(p);
        }

        await Promise.all(spinPromises);

        // Update balance
        balance = data.newBalance;
        updateUI();

        // Show wins
        if (data.totalWin > 0) {
            winOverlay.textContent = data.isFullGrid ? `SUPER MEGA GANHO!\nR$ ${data.totalWin.toFixed(2)}` : `GANHOU!\nR$ ${data.totalWin.toFixed(2)}`;
            winOverlay.classList.add('show');
            
            // Notify parent to sync global balance
            window.parent.postMessage({ type: 'HALLOWEEN_BALANCE_UPDATE', newBalance: balance }, '*');
        }

    } catch(e) {
        alert(e.message);
    } finally {
        isSpinning = false;
        btnSpin.disabled = false;
    }
}

// Initial fake fill
fillReel(0, [1,2,3]);
fillReel(1, [4,5,6]);
fillReel(2, [1,6,3]);
document.querySelectorAll('.symbols').forEach(el => el.style.transform = `translateY(-${EXTRA_SYMBOLS * SYMBOL_HEIGHT}px)`);

btnSpin.addEventListener('click', spin);
