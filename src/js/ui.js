// src/js/ui.js
import { keyboardLayouts, standardSpecialChars, shiftSpecialCharsEng, keyMap as configKeyMap } from './config.js';
import * as stats from './stats.js';

// --- DOM Elements ---
export const elements = {
    characterDisplay: document.getElementById('letter-display'),
    resultDisplay: document.getElementById('result'),
    quickStatsDisplay: document.getElementById('quick-stats'),
    statsDisplay: document.getElementById('stats-display'),
    toggleStatsButton: document.getElementById('toggle-stats'),
    statsContainer: document.getElementById('stats-container'),
    toggleLanguageButton: document.getElementById('toggle-language'),
    modeButtonsContainer: document.querySelector('#mode-buttons'),
    keyboardContainer: document.getElementById('keyboard-container'),
    modeButtons: {} // Populated by createModeButtons
};

// --- UI Functions ---

/** Updates the visual state (text, 'active' class) of all mode buttons. */
export function updateModeButtonsActiveState(characterModes, ngramModes) {
     for (const mode in characterModes) {
         const button = elements.modeButtons[mode];
         if (button) {
             const label = button.dataset.label || `${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
             button.textContent = `${label}: ${characterModes[mode] ? 'On' : 'Off'}`;
             button.classList.toggle('active', characterModes[mode]);
         }
     }
     for (const mode in ngramModes) {
         const button = elements.modeButtons[mode];
         if (button) {
             const label = button.dataset.label || `${mode.charAt(1)}-grams`;
             button.textContent = `${label}: ${ngramModes[mode] ? 'On' : 'Off'}`;
             button.classList.toggle('active', ngramModes[mode]);
         }
     }
}

/** Creates mode selection buttons dynamically. */
export function createModeButtons(characterModes, ngramModes, modeToggleCallback) {
    elements.modeButtonsContainer.innerHTML = ''; // Clear previous buttons
    elements.modeButtons = {}; // Reset references

    const buttonConfigs = [
        { key: 'lowercase', label: 'Lowercase' }, { key: 'uppercase', label: 'Uppercase' },
        { key: 'numbers',   label: 'Numbers' },   { key: 'special',   label: 'Special' },
        { key: 'n2gram',    label: '2-grams' },   { key: 'n3gram',    label: '3-grams' },
        { key: 'n4gram',    label: '4-grams' },   { key: 'n5gram',    label: '5-grams' },
    ];

    buttonConfigs.forEach(config => {
        const button = document.createElement('button');
        button.id = `toggle-${config.key}`;
        button.dataset.modeKey = config.key; // Store mode key for the handler
        button.dataset.label = config.label; // Store label for text updates
        elements.modeButtonsContainer.appendChild(button);
        elements.modeButtons[config.key] = button; // Store button reference

        button.addEventListener('click', () => {
            modeToggleCallback(config.key); // Call handler with the mode key
        });
    });
    // Set initial button states
    updateModeButtonsActiveState(characterModes, ngramModes);
}

/** Generates the visual keyboard HTML based on the selected language layout. */
export function generateKeyboard(language) {
    const layout = keyboardLayouts[language] || keyboardLayouts.english;
    elements.keyboardContainer.innerHTML = ''; // Clear previous keyboard

    layout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('keyboard-row');
        row.forEach(keySymbol => { // Use 'keySymbol' to avoid conflict with 'key' event property
            const keyDiv = document.createElement('div');
            keyDiv.classList.add('key');
            // Assign data-key: lowercase for single chars, symbol itself for multi-char keys
            const dataKeyValue = keySymbol.length === 1 ? keySymbol.toLowerCase() : keySymbol;
            keyDiv.setAttribute('data-key', dataKeyValue);

            // Add specific classes and display text for special keys
            if (keySymbol.length > 1) {
                let specificClass = '';
                switch (keySymbol) {
                    case 'ShiftLeft': specificClass = 'key-shift-left'; break;
                    case 'ShiftRight': specificClass = 'key-shift-right'; break;
                    case 'ControlLeft': case 'ControlRight': specificClass = 'key-ctrl'; break;
                    case 'AltLeft': case 'AltRight': specificClass = 'key-alt'; break;
                    case 'MetaLeft': case 'MetaRight': specificClass = 'key-win'; break;
                    case 'CapsLock': specificClass = 'key-caps'; break;
                    case 'Backspace': specificClass = 'key-backspace'; break;
                    case 'Tab': specificClass = 'key-tab'; break;
                    case 'Enter': specificClass = 'key-enter'; break;
                    case 'Space': specificClass = 'key-space'; break;
                    default: specificClass = `key-${keySymbol.toLowerCase()}`; // Fallback
                }
                if (specificClass) keyDiv.classList.add(specificClass);

                // Set display text, removing Left/Right indicators and shortening names
                let displayText = keySymbol.replace('Left', '').replace('Right', '');
                if (keySymbol.startsWith('Meta')) displayText = 'Win';
                if (keySymbol.startsWith('Control')) displayText = 'Ctrl';
                if (keySymbol.startsWith('Alt')) displayText = 'Alt';
                if (keySymbol.startsWith('Shift')) displayText = 'Shift';
                if (keySymbol === 'CapsLock') displayText = 'Caps';
                keyDiv.textContent = displayText;
            } else {
                keyDiv.textContent = keySymbol; // Display the character itself
            }
            rowDiv.appendChild(keyDiv);
        });
        elements.keyboardContainer.appendChild(rowDiv);
    });
}

/** Highlights the specified character's key(s) on the visual keyboard. */
export function highlightKey(char, keyMap = configKeyMap) {
    // Clear previous highlights
    const previouslyHighlighted = elements.keyboardContainer.querySelectorAll('.key-highlight');
    previouslyHighlighted.forEach(el => el.classList.remove('key-highlight'));

    if (!char) return; // No character to highlight

    let keyToHighlight = char;
    let requiresShift = false;

    // Determine if Shift is required and find the base key
    if (char !== char.toLowerCase() && char === char.toUpperCase() && /[a-zA-Zа-яА-Я]/.test(char)) {
         requiresShift = true;
         keyToHighlight = char.toLowerCase();
    } else if (shiftSpecialCharsEng.includes(char)) { // Approximate check for Shift + Special Chars (Eng)
         requiresShift = true;
         const index = shiftSpecialCharsEng.indexOf(char);
         if (index !== -1 && index < standardSpecialChars.length) {
             keyToHighlight = standardSpecialChars[index]; // Find the non-shifted equivalent key
         }
        // Note: This might not be perfect for all layouts/languages
    }

    // Find the target key element using data-key (prefer mapped value)
    const mappedKeyValue = keyMap[keyToHighlight] || keyToHighlight;
    const targetElement = elements.keyboardContainer.querySelector(`.key[data-key="${mappedKeyValue}"]`);

    if (targetElement) {
        targetElement.classList.add('key-highlight');
    } else {
        // Fallback: try finding by lowercase if it was a letter (already done by logic above, but as safety)
        const fallbackElement = elements.keyboardContainer.querySelector(`.key[data-key="${keyToHighlight.toLowerCase()}"]`);
        if (fallbackElement) fallbackElement.classList.add('key-highlight');
        // else console.warn(`Key element not found for highlight: ${char}`);
    }

    // Highlight Shift keys if required
    if (requiresShift) {
        const shiftKeys = elements.keyboardContainer.querySelectorAll('.key-shift-left, .key-shift-right');
        shiftKeys.forEach(key => key.classList.add('key-highlight'));
    }
}

/** Applies a brief 'pressed' animation to a key element based on its data-key. */
export function pressKeyAnimation(dataKeyValue) {
    const keyElement = elements.keyboardContainer.querySelector(`.key[data-key="${dataKeyValue}"]`);
    if (keyElement) {
        keyElement.classList.add('key-pressed');
        // Remove class after a short delay
        setTimeout(() => keyElement.classList.remove('key-pressed'), 100);
    }
}

/** Applies a brief 'shake' animation to the key element for the expected character on error. */
export function errorKeyAnimation(expectedChar, keyMap = configKeyMap) {
     const keyToFind = expectedChar === ' ' ? 'Space' : expectedChar;
     const mappedKey = keyMap[keyToFind] || keyToFind.toLowerCase();
     const targetKeyElement = elements.keyboardContainer.querySelector(`.key[data-key="${mappedKey}"]`);
     if (targetKeyElement) {
        targetKeyElement.classList.add('key-error-shake');
        setTimeout(() => targetKeyElement.classList.remove('key-error-shake'), 300);
     }
}

/** Updates the main display area with the target character/n-gram and highlights the current key. */
export function updateDisplayAndHighlight(target, position, isSequence, keyMap, resetStartTime = true) {
    if (!target) {
        elements.characterDisplay.textContent = 'Select mode!';
        elements.characterDisplay.style.backgroundColor = '#ffcccc';
        highlightKey(null, keyMap);
    } else {
        elements.characterDisplay.textContent = target; // Display the full target
        elements.characterDisplay.style.backgroundColor = ''; // Reset background
        elements.characterDisplay.style.color = 'black'; // Reset text color

        // Highlight the key for the character at the current position
        const charToHighlight = target[position];
        if (charToHighlight) {
            highlightKey(charToHighlight, keyMap);
        } else {
             highlightKey(null, keyMap); // Should not happen, but clear highlight if it does
        }

        // Reset the timer only if starting a new target (or explicitly requested)
        if (resetStartTime) {
            stats.setCharacterStartTime();
        }
    }
}

/** Updates the result display message (correct/incorrect) and colors. */
export function updateResultDisplay(correct, timeTaken, expectedChar = null) {
    let message = '';
    let color = '#555'; // Default color

    if (correct) {
        message = `Correct! (${timeTaken} ms)`;
        color = 'green';
    } else {
        const expectedDisplay = expectedChar === ' ' ? 'Space' : expectedChar;
        message = `Incorrect! Expected: ${expectedDisplay}`;
        color = 'red';
        // Optionally make the main display red on error too
         elements.characterDisplay.style.color = 'red';
    }

    elements.resultDisplay.textContent = message;
    elements.resultDisplay.style.color = color;

     // Reset result color and target color (if error) after a delay
     setTimeout(() => {
        elements.resultDisplay.style.color = '#555'; // Reset result color
        if (!correct) {
           elements.characterDisplay.style.color = 'black'; // Reset target display color
        }
     }, 600);
}

/** Updates the quick stats display (WPM, Accuracy, Avg Time). */
export function updateQuickStatsDisplay() {
    const currentWPM = stats.calculateWPM();
    const accuracy = stats.getOverallAccuracy().toFixed(1);
    const averageTime = stats.getAverageTimePerChar().toFixed(0);
    elements.quickStatsDisplay.innerHTML = `
        WPM: ${currentWPM} | Accuracy: ${accuracy}% | Avg Time: ${averageTime} ms
    `;
}

/** Updates the detailed statistics table. */
export function updateDetailedStatsDisplay() {
    const overallAccuracy = stats.getOverallAccuracy().toFixed(2);
    const overallAverageTime = stats.getAverageTimePerChar().toFixed(2);
    let characterRows = '';

    const sortedChars = Object.keys(stats.characterStats)
                              .filter(char => stats.characterStats[char].total > 0)
                              .sort();

    sortedChars.forEach(char => {
        const charStat = stats.characterStats[char];
        if (charStat.total === 0) return;

        const avgTime = (charStat.totalTime / charStat.total).toFixed(2);
        const accuracy = (charStat.correct / charStat.total * 100).toFixed(2);

        let mostConfusedChar = '-';
        if (Object.keys(charStat.confusedWith).length > 0) {
            const confusedKey = Object.keys(charStat.confusedWith)
                                     .reduce((a, b) => charStat.confusedWith[a] > charStat.confusedWith[b] ? a : b);
            const maxConfusion = charStat.confusedWith[confusedKey];
            mostConfusedChar = `${confusedKey === ' ' ? 'Space' : confusedKey} (${maxConfusion})`;
        }

        characterRows += `
            <tr>
                <td>${char === ' ' ? 'Space' : char}</td>
                <td>${charStat.total}</td>
                <td>${charStat.correct}</td>
                <td>${charStat.incorrect}</td>
                <td>${accuracy}%</td>
                <td>${avgTime} ms</td>
                <td>${mostConfusedChar}</td>
            </tr>
        `;
    });

    if (stats.totalCount > 0) {
        elements.statsDisplay.innerHTML = `
            <div class="stats-section">
                <h2>Overall Statistics</h2>
                <table class="stats-table">
                    <thead><tr><th>WPM</th><th>Total Typed</th><th>Correct</th><th>Accuracy</th><th>Average Time per Char</th></tr></thead>
                    <tbody><tr><td>${stats.wpm}</td><td>${stats.totalCount}</td><td>${stats.correctCount}</td><td>${overallAccuracy}%</td><td>${overallAverageTime} ms</td></tr></tbody>
                </table>
            </div>
            <div class="stats-section">
                <h2>Individual Character Statistics</h2>
                <table class="stats-table">
                    <thead><tr><th>Character</th><th>Attempts</th><th>Correct</th><th>Incorrect</th><th>Accuracy</th><th>Avg Time (ms)</th><th>Most Confused With (count)</th></tr></thead>
                    <tbody>${characterRows}</tbody>
                </table>
            </div>
        `;
    } else {
         elements.statsDisplay.innerHTML = '<p>No statistics yet. Start typing!</p>';
    }
}

/** Toggles the visibility of the detailed statistics container. */
export function toggleStatsVisibility() {
    const isHidden = elements.statsContainer.classList.toggle('hidden');
    elements.toggleStatsButton.textContent = isHidden ? 'Show Detailed Stats' : 'Hide Detailed Stats';
    if (!isHidden) { // Update stats when shown
        updateDetailedStatsDisplay();
    }
}

/** Updates the text of the language toggle button. */
export function updateLanguageButtonText(language) {
     elements.toggleLanguageButton.textContent = `Language: ${language.charAt(0).toUpperCase() + language.slice(1)}`;
}