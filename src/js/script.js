const englishLetters = 'abcdefghijklmnopqrstuvwxyz';
const russianLetters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const numbers = '0123456789';
const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';

let currentLanguage = 'english';
let characters = '';
let currentCharacter = '';
let allPossibleCharacters = englishLetters + englishLetters.toUpperCase() + 
                            russianLetters + russianLetters.toUpperCase() + 
                            numbers + specialChars;
let correctCount = 0;
let totalCount = 0;
let startTime = 0;
let totalTime = 0;
let characterStats = {};

let modes = {
    lowercase: true,
    uppercase: false,
    numbers: false,
    special: false
};

function initializeCharacterStats(charSet) {
    charSet.split('').forEach(char => {
        characterStats[char] = { 
            total: 0, 
            correct: 0, 
            incorrect: 0, 
            totalTime: 0, 
            confusedWith: {}
        };
    });
}

initializeCharacterStats(allPossibleCharacters);

const characterDisplay = document.getElementById('letter-display');
const resultDisplay = document.getElementById('result');
const quickStatsDisplay = document.getElementById('quick-stats');
const statsDisplay = document.getElementById('stats-display');
const toggleStatsButton = document.getElementById('toggle-stats');
const statsContainer = document.getElementById('stats-container');
const toggleLanguageButton = document.getElementById('toggle-language');

// Create toggle buttons for each mode
const modeButtons = {};
['lowercase', 'uppercase', 'numbers', 'special'].forEach(mode => {
    const button = document.createElement('button');
    button.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)}: ${modes[mode] ? 'On' : 'Off'}`;
    button.id = `toggle-${mode}`;
    document.querySelector('#mode-buttons').appendChild(button);
    modeButtons[mode] = button;

    button.addEventListener('click', () => {
        modes[mode] = !modes[mode];
        button.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)}: ${modes[mode] ? 'On' : 'Off'}`;
        updateCharacterSet();
    });
});

toggleLanguageButton.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'english' ? 'russian' : 'english';
    toggleLanguageButton.textContent = `Language: ${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}`;
    updateCharacterSet();
});

function updateCharacterSet() {
    characters = '';
    const letters = currentLanguage === 'english' ? englishLetters : russianLetters;
    if (modes.lowercase) characters += letters;
    if (modes.uppercase) characters += letters.toUpperCase();
    if (modes.numbers) characters += numbers;
    if (modes.special) characters += specialChars;
    
    if (characters === '') {
        characterDisplay.textContent = 'Select a mode';
        characterDisplay.style.backgroundColor = '#ffcccc';  // Light red background
        currentCharacter = '';
    } else {
        characterDisplay.style.backgroundColor = '';  // Reset background
        setNewCharacter();
    }
}

function getRandomCharacter() {
    return characters[Math.floor(Math.random() * characters.length)];
}

function setNewCharacter() {
    if (characters.length > 0) {
        currentCharacter = getRandomCharacter();
        characterDisplay.textContent = currentCharacter;
        characterDisplay.style.color = 'black';
        startTime = Date.now();
    } else {
        characterDisplay.textContent = 'Select a mode';
        currentCharacter = '';
    }
}

function updateQuickStats() {
    const accuracy = totalCount > 0 ? (correctCount / totalCount * 100).toFixed(2) : '0.00';
    const averageTime = totalCount > 0 ? (totalTime / totalCount).toFixed(2) : '0.00';
    quickStatsDisplay.innerHTML = `
        Accuracy: ${accuracy}% | Average Time: ${averageTime} ms
    `;
}

function updateDetailedStats() {
    const averageTime = totalCount > 0 ? totalTime / totalCount : 0;
    let characterRows = '';
    for (const char in characterStats) {
        const stats = characterStats[char];
        if (stats.total > 0) {
            const avgTime = (stats.totalTime / stats.total).toFixed(2);
            const accuracy = (stats.correct / stats.total * 100).toFixed(2);
            
            let mostConfusedChar = '';
            let maxConfusion = 0;
            for (const confusedChar in stats.confusedWith) {
                if (stats.confusedWith[confusedChar] > maxConfusion) {
                    mostConfusedChar = confusedChar;
                    maxConfusion = stats.confusedWith[confusedChar];
                }
            }
            
            characterRows += `
                <tr>
                    <td>${char === ' ' ? 'Space' : char}</td>
                    <td>${stats.total}</td>
                    <td>${stats.correct}</td>
                    <td>${stats.incorrect}</td>
                    <td>${accuracy}%</td>
                    <td>${avgTime} ms</td>
                    <td>${mostConfusedChar === ' ' ? 'Space' : mostConfusedChar} (${maxConfusion})</td>
                </tr>
            `;
        }
    }
    statsDisplay.innerHTML = `
        <div class="stats-section">
            <h2>Overall Statistics</h2>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Total Characters</th>
                        <th>Correct Characters</th>
                        <th>Accuracy</th>
                        <th>Average Time per Character</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${totalCount}</td>
                        <td>${correctCount}</td>
                        <td>${(correctCount / totalCount * 100).toFixed(2)}%</td>
                        <td>${averageTime.toFixed(2)} ms</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="stats-section">
            <h2>Individual Character Statistics</h2>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Character</th>
                        <th>Attempts</th>
                        <th>Correct</th>
                        <th>Incorrect</th>
                        <th>Accuracy</th>
                        <th>Avg Time</th>
                        <th>Most Confused With</th>
                    </tr>
                </thead>
                <tbody>
                    ${characterRows}
                </tbody>
            </table>
        </div>
    `;
}

toggleStatsButton.addEventListener('click', () => {
    statsContainer.classList.toggle('hidden');
    toggleStatsButton.textContent = statsContainer.classList.contains('hidden') ? 'Show Detailed Stats' : 'Hide Detailed Stats';
});

document.addEventListener('keydown', (event) => {
    const keyPressed = event.key;
    if (allPossibleCharacters.includes(keyPressed) && currentCharacter !== '') {
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        totalTime += timeTaken;
        totalCount++;

        characterStats[currentCharacter].total++;
        characterStats[currentCharacter].totalTime += timeTaken;

        if (keyPressed === currentCharacter) {
            correctCount++;
            characterStats[currentCharacter].correct++;
            characterDisplay.style.color = 'green';
        } else {
            characterStats[currentCharacter].incorrect++;
            if (!characterStats[currentCharacter].confusedWith[keyPressed]) {
                characterStats[currentCharacter].confusedWith[keyPressed] = 0;
            }
            characterStats[currentCharacter].confusedWith[keyPressed]++;
            characterDisplay.style.color = 'red';
        }

        resultDisplay.textContent = `Last Character Time: ${timeTaken} ms`;
        updateQuickStats();
        updateDetailedStats();
        setTimeout(setNewCharacter, 100);
    }
});

updateCharacterSet();
updateQuickStats();
updateDetailedStats();
