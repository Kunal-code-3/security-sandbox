// ============================================
// SECURITY SANDBOX — AI QUIZ SIMULATOR
// Frontend logic for Gemini-powered MCQ quiz
// ============================================

const generateBtn = document.getElementById('generate-ai');
const regenerateBtn = document.getElementById('regenerate-ai');
const topicEl = document.getElementById('ai-topic');
const difficultyEl = document.getElementById('ai-difficulty');
const countEl = document.getElementById('ai-count');
const questionsContainer = document.getElementById('ai-questions');
const toastEl = document.getElementById('toast');
const providerBadge = document.getElementById('provider-badge');
const scoreBar = document.getElementById('score-bar');
const scoreCorrect = document.getElementById('score-correct');
const scoreWrong = document.getElementById('score-wrong');
const scoreAnswered = document.getElementById('score-answered');

let lastRequest = null;
let totalQuestions = 0;
let answeredCount = 0;
let correctCount = 0;
let wrongCount = 0;

// ========================
// CHECK API STATUS
// ========================
async function checkProviderStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();

        const badge = providerBadge;
        if (data.providers.gemini === 'configured') {
            badge.className = 'provider-badge gemini';
            badge.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Gemini AI Connected</span>';
        } else if (data.providers.openai === 'configured') {
            badge.className = 'provider-badge openai';
            badge.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>OpenAI Connected</span>';
        } else {
            badge.className = 'provider-badge mock';
            badge.innerHTML = '<i class="fa-solid fa-flask"></i> <span>Demo Mode — Add API key for AI questions</span>';
        }
    } catch (err) {
        providerBadge.className = 'provider-badge mock';
        providerBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>Server offline — Start with npm start</span>';
    }
}

// ========================
// TOAST NOTIFICATIONS
// ========================
function showToast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;

    // Trigger reflow for animation
    void toastEl.offsetWidth;
    toastEl.classList.add('show');

    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3500);
}

// ========================
// RENDER QUESTIONS
// ========================
function renderQuestions(data) {
    questionsContainer.innerHTML = '';

    // Reset scores
    totalQuestions = data.questions.length;
    answeredCount = 0;
    correctCount = 0;
    wrongCount = 0;
    updateScoreBar();
    scoreBar.classList.add('visible');

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    data.questions.forEach((q, qIndex) => {
        const card = document.createElement('div');
        card.className = 'q-card';
        card.style.animationDelay = `${qIndex * 0.1}s`;

        // Header
        const header = document.createElement('div');
        header.className = 'q-header';

        const qNum = document.createElement('span');
        qNum.className = 'q-number';
        qNum.textContent = `Q${qIndex + 1}`;

        const qDiff = document.createElement('span');
        qDiff.className = `q-difficulty ${q.difficulty || difficultyEl.value}`;
        qDiff.textContent = (q.difficulty || difficultyEl.value).toUpperCase();

        header.appendChild(qNum);
        header.appendChild(qDiff);
        card.appendChild(header);

        // Question text
        const qText = document.createElement('p');
        qText.className = 'q-text';
        qText.textContent = q.question;
        card.appendChild(qText);

        // Choices
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'q-choices';

        if (Array.isArray(q.choices)) {
            q.choices.forEach((choice, cIndex) => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';

                const letter = document.createElement('span');
                letter.className = 'choice-letter';
                letter.textContent = letters[cIndex] || (cIndex + 1);

                const text = document.createElement('span');
                text.textContent = choice;

                btn.appendChild(letter);
                btn.appendChild(text);

                btn.addEventListener('click', () => {
                    handleAnswer(btn, choicesDiv, q, choice, card);
                });

                choicesDiv.appendChild(btn);
            });
        }

        card.appendChild(choicesDiv);

        // Explanation (hidden by default)
        const expDiv = document.createElement('div');
        expDiv.className = 'q-explanation';
        expDiv.innerHTML = `
            <div class="exp-title">💡 Explanation</div>
            <div class="exp-text">${q.explanation || 'No explanation available.'}</div>
        `;
        card.appendChild(expDiv);

        questionsContainer.appendChild(card);
    });

    // Show provider used
    if (data.provider) {
        const providerNames = {
            'google-gemini': '✨ Questions generated by Gemini AI',
            'openai': '✨ Questions generated by OpenAI',
            'mock': '🧪 Showing demo questions (add API key for AI-generated)'
        };
        showToast(providerNames[data.provider] || 'Questions loaded', data.provider === 'mock' ? 'info' : 'success');
    }
}

// ========================
// HANDLE ANSWER SELECTION
// ========================
function handleAnswer(selectedBtn, choicesDiv, question, selectedChoice, card) {
    const allBtns = choicesDiv.querySelectorAll('.choice-btn');
    const isCorrect = selectedChoice === question.correct_answer;

    // Disable all buttons
    allBtns.forEach(btn => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';

        // Highlight correct answer
        const btnText = btn.querySelector('span:last-child').textContent;
        if (btnText === question.correct_answer) {
            btn.classList.add('correct-answer');
        }
    });

    // Mark selected
    if (isCorrect) {
        selectedBtn.classList.add('correct-answer');
        correctCount++;
    } else {
        selectedBtn.classList.add('wrong-answer');
        wrongCount++;
    }

    answeredCount++;
    updateScoreBar();

    // Show explanation
    const exp = card.querySelector('.q-explanation');
    if (exp) {
        exp.classList.add('visible');
    }
}

// ========================
// UPDATE SCORE BAR
// ========================
function updateScoreBar() {
    scoreCorrect.textContent = correctCount;
    scoreWrong.textContent = wrongCount;
    scoreAnswered.textContent = `${answeredCount} / ${totalQuestions}`;
}

// ========================
// API CALL
// ========================
async function callGenerate(body) {
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;

    generateBtn.innerHTML = '<div class="spinner"></div> Generating...';
    generateBtn.classList.add('loading');

    try {
        const res = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Request failed');
        }

        const data = await res.json();
        lastRequest = body;
        renderQuestions(data);
        regenerateBtn.disabled = false;

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
        console.error('Generation error:', err);
    } finally {
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Questions';
    }
}

// ========================
// EVENT LISTENERS
// ========================
generateBtn.addEventListener('click', () => {
    const body = {
        topic: topicEl.value,
        difficulty: difficultyEl.value,
        count: Number(countEl.value)
    };
    callGenerate(body);
});

regenerateBtn.addEventListener('click', () => {
    if (!lastRequest) return;
    callGenerate(lastRequest);
});

// Check status on load
checkProviderStatus();
