function fmt(num, d=2) { return num.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d}); }

function calculate() {
    console.log("Calculating..."); 

    // 1. GET INPUTS
    const capInput = document.getElementById('capital').value;
    const entryInput = document.getElementById('entryPrice').value;
    const atrInput = document.getElementById('atrValue').value;

    const cap = parseFloat(capInput) || 0;
    const riskPct = parseFloat(document.getElementById('riskPct').value) || 0;
    const entry = parseFloat(entryInput) || 0;
    const atr = parseFloat(atrInput) || 0;
    const mult = parseFloat(document.getElementById('atrMultiplier').value) || 0;
    const rr = parseFloat(document.getElementById('rrRatio').value) || 0;
    
    const tp1Mult = parseFloat(document.getElementById('tp1Mult').value) || 0;
    const commissionAsPct = parseFloat(document.getElementById('commission').value) || 0;
    const leverage = parseFloat(document.getElementById('leverage').value) || 1;
    
    const dirElement = document.querySelector('input[name="direction"]:checked');
    const dir = dirElement ? dirElement.value : 'LONG';

    // 2. SETUP STRINGS
    const checkedSetups = document.querySelectorAll('input[name="setup"]:checked');
    let setupString = Array.from(checkedSetups).map(cb => cb.value).join(" + ");
    if (setupString === "") setupString = "Unspecified";

    // 3. SAFETY CHECKS
    const journalBox = document.getElementById('journalString');
    if(!cap) { journalBox.innerText = "Waiting for Account Balance..."; return; }
    if(!entry) { journalBox.innerText = "Waiting for Entry Price..."; return; }
    if(!atr) { journalBox.innerText = "Waiting for ATR Value..."; return; }

    // 4. CORE MATH
    const riskAmt = cap * (riskPct/100);
    const dist = atr * mult;
    const size = riskAmt / dist; // Position Size in Units
    const reward = riskAmt * rr;
    const totalFees = riskAmt * (commissionAsPct / 100);

    // Calculate Margin (Cost to Open)
    const margin = (size * entry) / leverage;

    // 5. CALCULATE PRICES
    let sl, tp, tp1;
    if(dir === "LONG") { 
        sl = entry - dist; 
        tp = entry + (dist * rr); 
        tp1 = entry + (dist * tp1Mult); 
    }
    else { 
        sl = entry + dist; 
        tp = entry - (dist * rr); 
        tp1 = entry - (dist * tp1Mult);
    }

    // 6. UPDATE UI
    document.getElementById('outRisk').innerText = "$" + fmt(riskAmt);
    document.getElementById('outDist').innerText = fmt(dist);
    document.getElementById('outFee').innerText = "$" + fmt(totalFees); 
    document.getElementById('outSize').innerText = fmt(size, 4);
    
    // ** UPDATE: MARGIN CHECK **
    const marginEl = document.getElementById('outMargin');
    if(margin > cap) {
        marginEl.innerText = "$" + fmt(margin) + " (EXCEEDS BAL)";
        marginEl.style.color = "#ff5252"; // Red warning
    } else {
        marginEl.innerText = "$" + fmt(margin);
        marginEl.style.color = "#00bfff"; // Standard Blue
    }
    
    document.getElementById('outSL').innerText = fmt(sl);
    document.getElementById('outTP1').innerText = fmt(tp1);
    document.getElementById('outTP').innerText = fmt(tp);
    document.getElementById('outReward').innerText = "$" + fmt(reward);

    // 7. UPDATE JOURNAL STRING
    const date = new Date().toISOString().split('T')[0];
    const journalStr = `${date}\t${setupString}\t${dir}\t${entry}\t${sl.toFixed(2)}\t${tp1.toFixed(2)}\t${tp.toFixed(2)}\t${size.toFixed(4)}\t$${riskAmt.toFixed(2)}\t1:${rr}\t${leverage}X\t${commissionAsPct.toFixed(2)}%\t$${totalFees.toFixed(2)}`;
    
    journalBox.innerText = journalStr;
}

function copyToClipboard() {
    const text = document.getElementById('journalString').innerText;
    const c1 = document.getElementById('check1').checked;
    const c2 = document.getElementById('check2').checked;
    const copyButton = document.querySelector('.copy-btn');

    if(!c1 || !c2) {
        const originalText = copyButton.innerText;
        copyButton.innerText = "⚠️ CHECKLIST INCOMPLETE!";
        copyButton.style.backgroundColor = "#ff5252";
        setTimeout(() => { 
            copyButton.innerText = originalText; 
            copyButton.style.backgroundColor = "#333";
        }, 1500);
    }

    if(text.includes("Waiting")) return;

    navigator.clipboard.writeText(text).then(() => {
        copyButton.innerText = "COPIED!";
        copyButton.style.backgroundColor = "#4CAF50";
        setTimeout(() => { 
            copyButton.innerText = "COPY TO CLIPBOARD"; 
            copyButton.style.backgroundColor = "#333";
        }, 2000);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="number"], input[type="radio"], input[type="checkbox"]');
    inputs.forEach(input => {
        input.addEventListener(input.type === 'number' ? 'input' : 'change', calculate);
    });
    document.querySelector('.copy-btn').addEventListener('click', copyToClipboard);
    calculate();
});