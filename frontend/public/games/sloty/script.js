const ICONS = [
    'apple', 'apricot', 'banana', 'big_win', 'cherry', 'grapes', 'lemon', 'lucky_seven', 'orange', 'pear', 'strawberry', 'watermelon',
];

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
let balance = parseFloat(urlParams.get('balance') || 0);

const balanceDisplay = document.getElementById('balance-display');
const betDisplay = document.getElementById('bet-display');
const btnMinus = document.getElementById('btn-minus');
const btnPlus = document.getElementById('btn-plus');
const btnSpin = document.getElementById('btn-spin');
const winMessage = document.getElementById('win-message');
const cols = document.querySelectorAll('.col');

let currentBet = 1.00;
const BET_STEPS = [0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
let betIndex = 1;
let isSpinning = false;

function updateUI() {
    balanceDisplay.textContent = balance.toFixed(2);
    betDisplay.textContent = currentBet.toFixed(2);
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

function setInitialItems() {
    let baseItemAmount = 40;
    for (let i = 0; i < cols.length; ++i) {
        let col = cols[i];
        let amountOfItems = baseItemAmount + (i * 3);
        let elms = '';
        let firstThreeElms = '';

        for (let x = 0; x < amountOfItems; x++) {
            let icon = ICONS[Math.floor(Math.random() * ICONS.length)];
            let item = '<div class="icon" data-item="' + icon + '"><img src="items/' + icon + '.png"></div>';
            elms += item;
            if (x < 3) firstThreeElms += item;
        }
        col.innerHTML = elms + firstThreeElms;
    }
}

setInitialItems();

btnSpin.addEventListener('click', async () => {
    if (isSpinning) return;
    if (balance < currentBet) {
        alert("Saldo Insuficiente!");
        return;
    }

    isSpinning = true;
    btnSpin.disabled = true;
    winMessage.classList.remove('show');
    
    const container = document.getElementById('container');
    container.classList.remove('spinning');
    // Force DOM reflow to reset animation
    void container.offsetWidth;

    try {
        const res = await fetch('http://localhost:3000/games/originals/sloty/spin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ betAmount: currentBet })
        });

        if (!res.ok) throw new Error("Erro no servidor");
        const data = await res.json();
        
        let maxDuration = 0;

        for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            const icons = col.querySelectorAll('.icon img');
            
            const topIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
            const midIcon = data.result[i];
            const botIcon = ICONS[Math.floor(Math.random() * ICONS.length)];

            const finalThree = [topIcon, midIcon, botIcon];

            for (let x = 0; x < 3; x++) {
                icons[x].setAttribute('src', 'items/' + finalThree[x] + '.png');
                icons[(icons.length - 3) + x].setAttribute('src', 'items/' + finalThree[x] + '.png');
            }
            
            // Set dynamic animation duration (base 2.7s + stagger + slight randomness)
            let duration = 2.7 + (i * 0.3) + (Math.floor(Math.random() * 10) / 100);
            col.style.animationDuration = duration + 's';
            if (duration > maxDuration) maxDuration = duration;
        }

        // Add class to trigger CSS animation AFTER DOM is updated
        container.classList.add('spinning');

        setTimeout(() => {
            container.classList.remove('spinning');
            
            balance = data.newBalance;
            updateUI();

            if (data.netAmount > 0) {
                winMessage.textContent = `GANHOU R$ ${data.totalWin.toFixed(2)}`;
                winMessage.classList.add('show');
                window.parent.postMessage({ type: 'HALLOWEEN_BALANCE_UPDATE', newBalance: balance }, '*');
            }

            btnSpin.disabled = false;
            isSpinning = false;
        }, maxDuration * 1000);

    } catch (e) {
        alert(e.message);
        btnSpin.disabled = false;
        isSpinning = false;
    }
});