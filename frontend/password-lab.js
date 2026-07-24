// ========================================
// SECURITY SANDBOX
// PASSWORD LAB
// PART 1
// ========================================

const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

const strengthFill = document.getElementById("strength-fill");

const strengthText = document.querySelector("#strength-text span");
const passwordMessage = document.getElementById("passwordMessage");

// ================= SHOW / HIDE PASSWORD =================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.innerHTML =
            '<i class="fa-solid fa-eye-slash"></i>';

    } else {

        passwordInput.type = "password";

        togglePassword.innerHTML =
            '<i class="fa-solid fa-eye"></i>';

    }

});

// ================= PASSWORD STRENGTH =================

passwordInput.addEventListener("input", checkPassword);

function checkPassword() {

    const password = passwordInput.value;

    let score = 0;

    if (password.length >= 8)
        score++;

    if (/[A-Z]/.test(password))
        score++;

    if (/[a-z]/.test(password))
        score++;

    if (/[0-9]/.test(password))
        score++;

    if (/[^A-Za-z0-9]/.test(password))
        score++;

    updateStrength(score);

}

// ================= UPDATE UI =================

function updateStrength(score) {

    if (score <= 2) {

        strengthFill.style.width = "30%";

        strengthFill.style.background = "#ff4b4b";

        strengthText.textContent = "Weak";

        strengthText.style.color = "#ff4b4b";

    }

    else if (score <= 4) {

        strengthFill.style.width = "65%";

        strengthFill.style.background = "#ffc107";

        strengthText.textContent = "Medium";

        strengthText.style.color = "#ffc107";

    }

    else {

        strengthFill.style.width = "100%";

        strengthFill.style.background = "#22c55e";

        strengthText.textContent = "Strong";

        strengthText.style.color = "#22c55e";

    }

}
// ========================================
// PASSWORD LAB
// PART 2
// Live Checklist + Crack Time + Tips
// ========================================

const lengthItem = document.getElementById("length");
const upperItem = document.getElementById("uppercase");
const lowerItem = document.getElementById("lowercase");
const numberItem = document.getElementById("number");
const symbolItem = document.getElementById("symbol");

const crackTime = document.getElementById("crackTime");

const passwordCard = document.querySelector(".password-card");

// ================= UPDATE CHECKLIST =================

passwordInput.addEventListener("input", updateChecklist);

function updateChecklist(){

    const password = passwordInput.value;

    updateItem(lengthItem, password.length >= 8, "Minimum 8 Characters");

    updateItem(upperItem, /[A-Z]/.test(password), "One Uppercase Letter");

    updateItem(lowerItem, /[a-z]/.test(password), "One Lowercase Letter");

    updateItem(numberItem, /[0-9]/.test(password), "One Number");

    updateItem(symbolItem, /[^A-Za-z0-9]/.test(password), "One Special Character");

}

function updateItem(element, condition, text){

    if(condition){

        element.innerHTML = "✅ " + text;

        element.classList.add("success");

        element.classList.remove("error");

    }

    else{

        element.innerHTML = "❌ " + text;

        element.classList.add("error");

        element.classList.remove("success");

    }

}

// ================= IMPROVE updateStrength =================

// ⚠️ Ab Part 1 wale updateStrength() function ko
// is naye version se replace kar do.

function updateStrength(score){

    if(score <= 2){

        strengthFill.style.width="30%";
        strengthFill.style.background="#ff4b4b";

        strengthText.textContent="Weak";
        strengthText.style.color="#ff4b4b";

        crackTime.textContent="Less than 1 Minute";

        passwordCard.style.borderColor="#ff4b4b";
        passwordMessage.textContent =
"This password is easy to guess. Add uppercase letters, numbers and symbols.";

    }

    else if(score <=4){

        strengthFill.style.width="65%";
        strengthFill.style.background="#ffc107";

        strengthText.textContent="Medium";
        strengthText.style.color="#ffc107";

        crackTime.textContent="Around 3 Days";

        passwordCard.style.borderColor="#ffc107";
        passwordMessage.textContent =
"Good start! Add more complexity to make your password stronger.";

    }

    else{

        strengthFill.style.width="100%";
        strengthFill.style.background="#22c55e";

        strengthText.textContent="Strong";
        strengthText.style.color="#22c55e";

        crackTime.textContent="300+ Years";

        passwordCard.style.borderColor="#22c55e";
        passwordMessage.textContent =
"Excellent! This password follows strong security practices.";

    }

}
// ========================================
// PASSWORD GENERATOR + COPY
// PART 3C
// ========================================

const generateBtn = document.getElementById("generatePassword");
const copyBtn = document.getElementById("copyPassword");
const copyMessage = document.getElementById("copyMessage");

// Character Sets
const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lower = "abcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const symbols = "!@#$%^&*()_+-={}[]<>?/";

// =============================
// Generate Strong Password
// =============================

generateBtn.addEventListener("click", generatePassword);

function generatePassword(){

    const allChars = upper + lower + numbers + symbols;

    let password = "";

    // Guaranteed characters
    password += upper[Math.floor(Math.random()*upper.length)];
    password += lower[Math.floor(Math.random()*lower.length)];
    password += numbers[Math.floor(Math.random()*numbers.length)];
    password += symbols[Math.floor(Math.random()*symbols.length)];

    // Remaining characters
    for(let i=4;i<16;i++){

        password += allChars[Math.floor(Math.random()*allChars.length)];

    }

    // Shuffle password
    password = password
        .split("")
        .sort(()=>Math.random()-0.5)
        .join("");

    passwordInput.value = password;

    // Update UI Automatically
    checkPassword();
    updateChecklist();

    copyMessage.textContent =
    "✅ Strong Password Generated!";

    setTimeout(()=>{

        copyMessage.textContent="";

    },2500);

}

// =============================
// COPY PASSWORD
// =============================

copyBtn.addEventListener("click", copyPassword);

function copyPassword(){

    if(passwordInput.value===""){

        copyMessage.textContent="⚠ Generate a password first.";

        return;

    }

    navigator.clipboard.writeText(passwordInput.value);

    copyMessage.textContent="📋 Password Copied Successfully!";

    copyBtn.innerHTML="✅ Copied";

    setTimeout(()=>{

        copyBtn.innerHTML="📋 Copy Password";

        copyMessage.textContent="";

    },2000);

}
