const sampleEmails = {
    spam1: `URGENT SECURITY NOTICE: Your Online Banking Account has been suspended due to unauthorized access attempts! You must verify your identity immediately or your funds will be frozen within 24 hours. Click here to confirm your password and account details: http://online-security-verify-bank.com/login`,
    spam2: `CONGRATULATION! You have been selected as the lucky winner of $1,000,000 in our international online cash prize draw! Reply immediately with your full name, bank details, and home address to claim your money prize!`,
    safe1: `Hi Team, Just a reminder that our weekly project sync is scheduled for tomorrow at 10:00 AM in Conference Room B. Please review the updated slides attached before the meeting. Best regards, Sarah`,
    safe2: `Hello, Here is your weekly cybersecurity digest covering the latest updates in network defense, patch updates, and best practices for password hygiene. Read full articles on our internal portal.`
};

function loadSample(key) {
    const text = sampleEmails[key];
    if (text) {
        document.getElementById('email-input').value = text;
        analyzeEmail();
    }
}

function clearInput() {
    document.getElementById('email-input').value = '';
    const resultBox = document.getElementById('result-box');
    resultBox.style.display = 'none';
    resultBox.className = 'result-box';
}

async function analyzeEmail() {
    const emailInput = document.getElementById('email-input').value.trim();
    if (!emailInput) {
        alert('Please paste or type email text before analyzing!');
        return;
    }

    const analyzeBtn = document.getElementById('analyze-btn');
    const resultBox = document.getElementById('result-box');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const tokensContainer = document.getElementById('tokens-container');
    const adviceList = document.getElementById('advice-list');

    // UI Loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing with ML...';

    try {
        const response = await fetch('/api/email-detection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emailText: emailInput })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to communicate with prediction backend');
        }

        // Show result box
        resultBox.style.display = 'block';

        if (data.is_spam) {
            resultBox.className = 'result-box spam';
            statusIcon.className = 'fa-solid fa-triangle-exclamation';
            statusText.textContent = `SPAM DETECTED! (High Risk)`;

            adviceList.innerHTML = `
                <li><i class="fa-solid fa-xmark" style="color: #f87171;"></i> <strong>Do not click any links</strong> inside this email.</li>
                <li><i class="fa-solid fa-xmark" style="color: #f87171;"></i> Never enter passwords or personal info on unverified domains.</li>
                <li><i class="fa-solid fa-shield-halved" style="color: #38bdf8;"></i> Report this email to your IT / Security team immediately.</li>
            `;
        } else {
            resultBox.className = 'result-box safe';
            statusIcon.className = 'fa-solid fa-circle-check';
            statusText.textContent = `LEGITIMATE EMAIL (Low Risk)`;

            adviceList.innerHTML = `
                <li><i class="fa-solid fa-check" style="color: #34d399;"></i> Text pattern matches legitimate correspondence.</li>
                <li><i class="fa-solid fa-shield" style="color: #38bdf8;"></i> Always verify sender email domain as a safe practice.</li>
            `;
        }

        // Populate NLTK Tokens
        tokensContainer.innerHTML = '';
        if (data.stemmed_tokens && data.stemmed_tokens.length > 0) {
            data.stemmed_tokens.forEach(token => {
                const tag = document.createElement('span');
                tag.className = 'token-tag';
                tag.textContent = token;
                tokensContainer.appendChild(tag);
            });
        } else {
            tokensContainer.innerHTML = '<span class="token-tag">No key tokens extracted</span>';
        }

    } catch (error) {
        console.error('Email detection error:', error);
        resultBox.style.display = 'block';
        resultBox.className = 'result-box spam';
        statusIcon.className = 'fa-solid fa-circle-exclamation';
        statusText.textContent = `Error: ${error.message}`;
        adviceList.innerHTML = `<li><i class="fa-solid fa-bug" style="color: #f87171;"></i> Ensure Node.js server and Python ML environment are running.</li>`;
        tokensContainer.innerHTML = `<span class="token-tag">Error analyzing text</span>`;
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Analyze Email';
    }
}
