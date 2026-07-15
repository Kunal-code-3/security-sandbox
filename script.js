// ==========================
// SECURITY SANDBOX QUIZ
// ==========================

// Elements
const startBtn = document.querySelector(".start-btn");
const quizHero = document.querySelector(".quiz-hero");
const quizContainer = document.querySelector(".quiz-container");

const question = document.getElementById("question");
const answers = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");

const qno = document.getElementById("qno");
const scoreText = document.getElementById("score");
const progress = document.getElementById("progress");
const explanationBox = document.getElementById("explanationBox");

// Variables
let currentQuestion = 0;
let score = 0;

const quizData = [

{
question:"Which password is the strongest?",
answers:[
"12345678",
"password123",
"P@ssw0rd!2026",
"qwerty"
],
correct:2,
correctExplanation:"P@ssw0rd!2026 is strong because it uses upper- and lower-case letters, numbers, and symbols, making it hard to guess.",
wrongExplanations:[
"12345678 is too common and easy for attackers to guess.",
"password123 is weak because it is a predictable phrase with no special characters.",
"(Correct answer)",
"qwerty is a very common keyboard pattern and not secure."
]
},

{
question:"What does HTTPS mean on a website?",
answers:[
"The site is completely virus free",
"The connection is encrypted",
"The website is government approved",
"The website cannot be hacked"
],
correct:1,
correctExplanation:"HTTPS means the connection between your browser and the website is encrypted, protecting your data from snooping.",
wrongExplanations:[
"HTTPS does not guarantee a site is virus-free.",
"(Correct answer)",
"HTTPS is not a government approval stamp.",
"No website can be guaranteed to never be hacked."
]
},

{
question:"Utkarsh receives an email saying 'Your bank account will be suspended within 30 minutes. Click here to verify.' What should Utkarsh do?",
answers:[
"Click the link immediately",
"Verify using the official bank website or app",
"Reply with his password",
"Share the OTP"
],
correct:1,
correctExplanation:"The safe action is to verify the message through the bank's official website or app instead of using links from the email.",
wrongExplanations:[
"Clicking the link immediately is risky because the email may be a phishing attempt.",
"(Correct answer)",
"Never reply with your password; banks will not ask for it by email.",
"Sharing your OTP can give attackers access to your account."
]
},

{
question:"Which one is an example of phishing?",
answers:[
"A fake banking email asking for login details",
"Installing Windows Update",
"Watching YouTube",
"Using Calculator"
],
correct:0,
correctExplanation:"A fake banking email asking for login details is phishing because it tries to trick you into revealing sensitive information.",
wrongExplanations:[
"(Correct answer)",
"Installing Windows Update is a normal security practice.",
"Watching YouTube is unrelated to phishing.",
"Using Calculator is safe and not phishing."
]
},

{
question:"Which device should always have a screen lock?",
answers:[
"Laptop only",
"Phone only",
"Every personal device",
"Desktop only"
],
correct:2,
correctExplanation:"Every personal device should have a screen lock to keep your data protected if the device is lost or stolen.",
wrongExplanations:[
"A laptop should have a lock, but so should other devices too.",
"A phone must have a lock, yet it is not the only device that needs one.",
"(Correct answer)",
"A desktop should also have a lock if it stores personal information."
]
},

{
question:"Why should software be updated?",
answers:[
"To increase security",
"To make battery drain faster",
"To delete files",
"To slow down PC"
],
correct:0,
correctExplanation:"Software updates often fix security vulnerabilities, so keeping software updated increases your protection.",
wrongExplanations:[
"(Correct answer)",
"Updates typically improve software, not make battery drain faster.",
"Updates are not intended to delete files.",
"Updates usually improve performance and security, not slow down the PC."
]
},

{
question:"Which email looks suspicious?",
answers:[
"support@amazon.com",
"billing@amazon.in",
"support-amazon-security.xyz",
"noreply@amazon.in"
],
correct:2,
correctExplanation:"support-amazon-security.xyz is suspicious because it uses a strange domain instead of the official Amazon domain.",
wrongExplanations:[
"support@amazon.com is a valid-looking official domain.",
"billing@amazon.in is more likely legitimate than a strange domain.",
"(Correct answer)",
"noreply@amazon.in looks like a normal corporate email address."
]
},

{
question:"What is the safest way to protect your online accounts?",
answers:[
"Use the same password everywhere",
"Enable Two-Factor Authentication",
"Share passwords with friends",
"Disable updates"
],
correct:1,
correctExplanation:"Enabling Two-Factor Authentication adds an extra security layer beyond passwords and makes accounts much harder to take over.",
wrongExplanations:[
"Using the same password everywhere is risky because one leak can compromise many accounts.",
"(Correct answer)",
"Sharing passwords with friends puts your account security at serious risk.",
"Disabling updates leaves your accounts exposed to known security flaws."
]
}
];
// ==========================
// LOAD QUESTION
// ==========================

function loadQuestion() {

    nextBtn.style.display = "none";
    explanationBox.style.display = "none";
    explanationBox.innerHTML = "";

    const current = quizData[currentQuestion];

    qno.innerText = currentQuestion + 1;

    question.innerText = current.question;

    answers.innerHTML = "";

    progress.style.width =
        ((currentQuestion + 1) / quizData.length) * 100 + "%";

    current.answers.forEach((answer, index) => {

        const btn = document.createElement("div");

        btn.classList.add("answer");

        btn.innerText = answer;

        btn.addEventListener("click", () => selectAnswer(btn, index));

        answers.appendChild(btn);

    });

}

// ==========================
// START QUIZ
// ==========================

startBtn.addEventListener("click", () => {

    quizHero.style.display = "none";

    quizContainer.style.display = "flex";

    loadQuestion();

});
// ==========================
// SELECT ANSWER
// ==========================

function selectAnswer(selectedBtn, index){

const correct = quizData[currentQuestion].correct;
const current = quizData[currentQuestion];

const allAnswers = document.querySelectorAll(".answer");

allAnswers.forEach(answer=>{

answer.style.pointerEvents="none";

});

if(index===correct){

selectedBtn.classList.add("correct");

score++;

scoreText.innerText=score;

explanationBox.innerHTML = `
<div class="explanation-title">✅ Correct Answer</div>
<p><strong>Why this answer is right:</strong> ${current.correctExplanation}</p>
<p><strong>Why your choice is good:</strong> ${current.answers[correct]} is the best choice for this question.</p>
`;

}else{

selectedBtn.classList.add("wrong");

allAnswers[correct].classList.add("correct");

explanationBox.innerHTML = `
<div class="explanation-title">🚩 Incorrect Answer</div>
<p><strong>Why this answer is wrong:</strong> ${current.wrongExplanations[index]}</p>
<p><strong>Correct answer:</strong> ${current.answers[correct]}</p>
<p><strong>Why this is correct:</strong> ${current.correctExplanation}</p>
`;

}

explanationBox.style.display="block";
nextBtn.style.display="inline-block";

}

// ==========================
// NEXT BUTTON
// ==========================

nextBtn.addEventListener("click",()=>{

currentQuestion++;

if(currentQuestion<quizData.length){

loadQuestion();

}else{

showResult();

}

});

// ==========================
// RESULT
// ==========================

function showResult(){

let message="";

if(score==quizData.length){

message="🏆 Excellent, Utkarsh! You are a Cyber Security Master.";

}
else if(score>=6){

message="🔥 Great Job, Utkarsh! Your cybersecurity knowledge is impressive.";

}
else if(score>=4){

message="👍 Good Work! Keep practicing to become even stronger.";

}
else{

message="📚 Keep Learning! Every cybersecurity expert starts somewhere.";

}

question.innerHTML=`
🎉 Quiz Completed!

<br><br>

You scored

<span style="color:#b68cff">${score}</span>

out of

${quizData.length}

<br><br>

<div style="font-size:22px;color:#b68cff;font-weight:600;margin-top:20px;">

${message}

</div>
`;

answers.innerHTML="";

progress.style.width="100%";

nextBtn.innerHTML="🔄 Restart Quiz";

nextBtn.style.display="inline-block";

nextBtn.onclick=()=>{

location.reload();

};

}