const generateBtn = document.getElementById('generate-ai');
const regenerateBtn = document.getElementById('regenerate-ai');
const topicEl = document.getElementById('ai-topic');
const difficultyEl = document.getElementById('ai-difficulty');
const countEl = document.getElementById('ai-count');
const questionsContainer = document.getElementById('ai-questions');

let lastRequest = null;

function renderQuestions(data) {
  questionsContainer.innerHTML = '';
  data.questions.forEach(q => {
    const card = document.createElement('div');
    card.className = 'ai-question-card';

    const qText = document.createElement('p');
    qText.textContent = q.question;
    card.appendChild(qText);

    if (Array.isArray(q.choices)) {
      q.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice;
        btn.addEventListener('click', () => {
          if (choice === q.correct_answer) {
            btn.style.background = '#4caf50';
            alert('Correct! ' + q.explanation);
          } else {
            btn.style.background = '#f44336';
            alert('Wrong. ' + q.explanation);
          }
        });
        card.appendChild(btn);
      });
    }

    questionsContainer.appendChild(card);
  });
}

async function callGenerate(body) {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  try {
    const res = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    const data = await res.json();
    lastRequest = body;
    renderQuestions(data);
    regenerateBtn.disabled = false;
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Question(s)';
  }
}

generateBtn.addEventListener('click', () => {
  const body = { topic: topicEl.value, difficulty: difficultyEl.value, count: Number(countEl.value) };
  callGenerate(body);
});

regenerateBtn.addEventListener('click', () => {
  if (!lastRequest) return;
  callGenerate(lastRequest);
});
