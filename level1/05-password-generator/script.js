
const passwordOutput = document.getElementById("password");
const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const strengthText = document.getElementById("strengthText");
const strengthBars = document.querySelectorAll(".strength-bars span");
const message = document.getElementById("message");

const options = {
    uppercase: document.getElementById("uppercase"),
    lowercase: document.getElementById("lowercase"),
    numbers: document.getElementById("numbers"),
    symbols: document.getElementById("symbols")
};

const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{}?"
};

lengthInput.addEventListener("input", () => {
    lengthValue.textContent = lengthInput.value;
});

function secureRandomIndex(max) {
    const random = new Uint32Array(1);
    const limit = Math.floor(4294967296 / max) * max;

    do {
        crypto.getRandomValues(random);
    } while (random[0] >= limit);

    return random[0] % max;
}

function randomCharacter(characters) {
    return characters[secureRandomIndex(characters.length)];
}

function shuffleCharacters(characters) {
    const result = [...characters];

    for (let i = result.length - 1; i > 0; i--) {
        const j = secureRandomIndex(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join("");
}

function generatePassword() {
    message.classList.remove("error");

    const selectedSets = Object.keys(options)
        .filter(key => options[key].checked)
        .map(key => characterSets[key]);

    if (selectedSets.length === 0) {
        message.textContent = "Select at least one character type.";
        message.classList.add("error");
        return;
    }

    const length = Number(lengthInput.value);
    const allCharacters = selectedSets.join("");

    // Ensure each selected character type appears at least once.
    const passwordCharacters = selectedSets.map(set =>
        randomCharacter(set)
    );

    while (passwordCharacters.length < length) {
        passwordCharacters.push(randomCharacter(allCharacters));
    }

    passwordOutput.value = shuffleCharacters(passwordCharacters);
    updateStrength(selectedSets.length, length);

    message.textContent = "Your password is ready.";
}

function updateStrength(types, length) {
    let score = 0;

    if (length >= 8) score++;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (types >= 3) score++;
    if (types === 4 && length >= 12) score = 4;

    const labels = ["Weak", "Fair", "Good", "Strong"];
    strengthText.textContent = labels[Math.max(0, score - 1)];

    strengthBars.forEach((bar, index) => {
        bar.classList.toggle("active", index < score);
    });
}

async function copyPassword() {
    if (!passwordOutput.value) {
        message.textContent = "Generate a password first.";
        return;
    }

    try {
        await navigator.clipboard.writeText(passwordOutput.value);
        message.textContent = "Password copied to clipboard!";
        message.classList.remove("error");
    } catch {
        passwordOutput.select();
        const copied = document.execCommand("copy");
        message.textContent = copied
            ? "Password copied to clipboard!"
            : "Copy failed. Select and copy manually.";
    }
}

generateBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);

lucide.createIcons();
generatePassword();