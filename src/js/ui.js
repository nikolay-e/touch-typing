// src/js/ui.js
import { keyboardLayouts, standardSpecialChars, shiftSpecialCharsEng, keyMap as configKeyMap, TIMING_CONSTANTS } from './config.js';
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
    // Input validation
    if (typeof char !== 'string' && char !== null && char !== undefined) {
        console.warn('Invalid character type provided to highlightKey:', typeof char);
        return;
    }
    
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
        setTimeout(() => keyElement.classList.remove('key-pressed'), TIMING_CONSTANTS.KEY_ANIMATION_DURATION);
    }
}

/** Applies a brief 'shake' animation to the key element for the expected character on error. */
export function errorKeyAnimation(expectedChar, keyMap = configKeyMap) {
     const keyToFind = expectedChar === ' ' ? 'Space' : expectedChar;
     const mappedKey = keyMap[keyToFind] || keyToFind.toLowerCase();
     const targetKeyElement = elements.keyboardContainer.querySelector(`.key[data-key="${mappedKey}"]`);
     if (targetKeyElement) {
        targetKeyElement.classList.add('key-error-shake');
        setTimeout(() => targetKeyElement.classList.remove('key-error-shake'), TIMING_CONSTANTS.ERROR_SHAKE_DURATION);
     }
}

/** Updates the main display area with the target character/n-gram and highlights the current key. */
export function updateDisplayAndHighlight(target, position, isSequence, keyMap, resetStartTime = true) {
    // Input validation
    if (target !== null && typeof target !== 'string') {
        console.error('Invalid target type in updateDisplayAndHighlight:', typeof target);
        return;
    }
    
    if (typeof position !== 'number' || position < 0) {
        console.error('Invalid position in updateDisplayAndHighlight:', position);
        return;
    }
    
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
    // Input validation
    if (typeof correct !== 'boolean') {
        console.error('Invalid correct parameter in updateResultDisplay:', correct);
        return;
    }
    
    if (typeof timeTaken !== 'number' || timeTaken < 0 || !isFinite(timeTaken)) {
        console.error('Invalid timeTaken in updateResultDisplay:', timeTaken);
        timeTaken = 0;
    }
    
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
        elements.resultDisplay.style.color = ''; // Reset result color
        if (!correct) {
           elements.characterDisplay.style.color = ''; // Reset target display color
        }
     }, TIMING_CONSTANTS.RESULT_COLOR_RESET_DELAY);
}

/** Updates the quick stats display (WPM, Accuracy, Avg Time). */
export function updateQuickStatsDisplay() {
    const currentWPM = stats.calculateWPM();
    const accuracy = stats.getOverallAccuracy().toFixed(1);
    const averageTime = stats.getAverageTimePerChar().toFixed(0);
    elements.quickStatsDisplay.textContent = `WPM: ${currentWPM} | Accuracy: ${accuracy}% | Avg Time: ${averageTime} ms`;
}

/**
 * Updates the character coverage display for debugging smart selection
 * @param {object} characterCoverage - Coverage tracking object
 * @param {object} sessionTargetCount - Session count tracking object
 * @param {array} currentCharacterSet - Current practice set
 */
export function updateCoverageDisplay(characterCoverage, sessionTargetCount, currentCharacterSet) {
    try {
        // Input validation
        if (!characterCoverage || !sessionTargetCount || !currentCharacterSet) {
            return;
        }
        
        // Only show if stats are visible
        if (!elements.statsContainer || elements.statsContainer.classList.contains('hidden')) {
            return;
        }
    
    // Find or create coverage section
    let coverageSection = document.querySelector('.coverage-section');
    if (!coverageSection) {
        coverageSection = document.createElement('div');
        coverageSection.className = 'stats-section coverage-section';
        
        const heading = document.createElement('h2');
        heading.textContent = 'Character Coverage & Selection';
        coverageSection.appendChild(heading);
        
        const display = document.createElement('div');
        display.id = 'coverage-display';
        coverageSection.appendChild(display);
        
        // Insert at the beginning of stats display
        elements.statsDisplay.insertBefore(coverageSection, elements.statsDisplay.firstChild);
    }
    
    const coverageDisplay = document.getElementById('coverage-display');
    if (!coverageDisplay) return;
    
    const totalChars = Array.isArray(currentCharacterSet) ? currentCharacterSet.length : 0;
    const coveredChars = Object.keys(characterCoverage).length;
    const coveragePercent = totalChars > 0 ? (coveredChars / totalChars * 100).toFixed(1) : 0;
    
    // Create coverage summary
    let html = `
        <div style="margin-bottom: 10px;">
            <strong>Coverage:</strong> ${coveredChars}/${totalChars} characters (${coveragePercent}%)
        </div>
    `;
    
    // Show character frequency in compact format
    if (Object.keys(sessionTargetCount).length > 0) {
        const sortedChars = Object.entries(sessionTargetCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Show top 10 most frequent
        
        html += '<div style="font-size: 0.85em; margin-top: 8px;"><strong>Most Practiced:</strong><br>';
        html += sortedChars.map(([char, count]) => 
            `<span style="margin-right: 8px;">${escapeHTML(char === ' ' ? 'Space' : char)}:${count}</span>`
        ).join('');
        html += '</div>';
    }
    
    // Show uncovered characters if any
    const uncovered = currentCharacterSet.filter(char => !characterCoverage[char]);
    if (uncovered.length > 0 && uncovered.length < 20) {
        html += '<div style="font-size: 0.85em; margin-top: 8px; color: orange;"><strong>Not Yet Practiced:</strong> ';
        html += uncovered.map(char => escapeHTML(char === ' ' ? 'Space' : char)).join(', ');
        html += '</div>';
    }
    
    coverageDisplay.innerHTML = html;
    } catch (error) {
        console.warn('Error updating coverage display:', error);
    }
}



/**
 * Safely escapes HTML characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/** Updates the detailed statistics table. */
export function updateDetailedStatsDisplay() {
    
    // Update coverage display if available (will be called from app.js)
    // This is handled separately to avoid circular dependencies
    const overallAccuracy = stats.getOverallAccuracy().toFixed(2);
    const overallAverageTime = stats.getAverageTimePerChar().toFixed(2);
    
    // Clear existing content
    elements.statsDisplay.innerHTML = '';
    
    if (stats.totalCount > 0) {
        // Create overall statistics section
        const overallSection = document.createElement('div');
        overallSection.className = 'stats-section';
        
        const overallHeading = document.createElement('h2');
        overallHeading.textContent = 'Overall Statistics';
        overallSection.appendChild(overallHeading);
        
        // Get outlier statistics
        const outlierStats = stats.getOutlierStats();
        
        const overallTable = document.createElement('table');
        overallTable.className = 'stats-table';
        overallTable.innerHTML = `
            <thead><tr><th>WPM</th><th>Total Typed</th><th>Correct</th><th>Accuracy</th><th>Average Time per Char</th><th>Outliers Filtered</th></tr></thead>
            <tbody><tr>
                <td>${escapeHTML(String(stats.wpm))}</td>
                <td>${escapeHTML(String(stats.totalCount))}</td>
                <td>${escapeHTML(String(stats.correctCount))}</td>
                <td>${escapeHTML(overallAccuracy)}%</td>
                <td>${escapeHTML(overallAverageTime)} ms</td>
                <td>${escapeHTML(String(outlierStats.totalOutliers))} (${escapeHTML(outlierStats.overallOutlierRate)}%)</td>
            </tr></tbody>
        `;
        overallSection.appendChild(overallTable);
        elements.statsDisplay.appendChild(overallSection);
        
        // Create character statistics section
        const charSection = document.createElement('div');
        charSection.className = 'stats-section';
        
        const charHeading = document.createElement('h2');
        charHeading.textContent = 'Individual Character Statistics';
        charSection.appendChild(charHeading);
        
        const charTable = document.createElement('table');
        charTable.className = 'stats-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>Character</th><th>Attempts</th><th>Correct</th><th>Incorrect</th><th>Accuracy</th><th>Avg Time (ms)</th><th>Outliers</th><th>Most Confused With (count)</th></tr>';
        charTable.appendChild(thead);
        
        // Create table body with character rows
        const tbody = document.createElement('tbody');
        
        const sortedChars = Object.keys(stats.characterStats)
                                  .filter(char => stats.characterStats[char].total > 0)
                                  .sort();
        
        sortedChars.forEach(char => {
            const charStat = stats.characterStats[char];
            if (charStat.total === 0) return;
            
            const avgTime = (charStat.totalTime / charStat.total).toFixed(2);
            const accuracy = (charStat.correct / charStat.total * 100).toFixed(2);
            
            let mostConfusedChar = '-';
            let mostConfusedCount = '';
            if (Object.keys(charStat.confusedWith).length > 0) {
                const confusedKey = Object.keys(charStat.confusedWith)
                                         .reduce((a, b) => charStat.confusedWith[a] > charStat.confusedWith[b] ? a : b);
                const maxConfusion = charStat.confusedWith[confusedKey];
                mostConfusedChar = confusedKey === ' ' ? 'Space' : confusedKey;
                mostConfusedCount = ` (${maxConfusion})`;
            }
            
            // Get outlier count
            const outlierCount = charStat.outlierCount || 0;
            const outlierDisplay = outlierCount > 0 ? String(outlierCount) : '-';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(char === ' ' ? 'Space' : char)}</td>
                <td>${escapeHTML(String(charStat.total))}</td>
                <td>${escapeHTML(String(charStat.correct))}</td>
                <td>${escapeHTML(String(charStat.incorrect))}</td>
                <td>${escapeHTML(accuracy)}%</td>
                <td>${escapeHTML(avgTime)} ms</td>
                <td>${escapeHTML(outlierDisplay)}</td>
                <td>${escapeHTML(mostConfusedChar)}${escapeHTML(mostConfusedCount)}</td>
            `;
            tbody.appendChild(row);
        });
        
        charTable.appendChild(tbody);
        charSection.appendChild(charTable);
        elements.statsDisplay.appendChild(charSection);
    } else {
        const noStatsMsg = document.createElement('p');
        noStatsMsg.textContent = 'No statistics yet. Start typing!';
        elements.statsDisplay.appendChild(noStatsMsg);
    }
}

/** Toggles the visibility of the detailed statistics container. */
export function toggleStatsVisibility() {
    const isHidden = elements.statsContainer.classList.toggle('hidden');
    elements.toggleStatsButton.textContent = isHidden ? 'Show Detailed Stats' : 'Hide Detailed Stats';
    elements.toggleStatsButton.setAttribute('aria-expanded', !isHidden);
    if (!isHidden) { // Update stats when shown
        updateDetailedStatsDisplay();
        // Move focus to stats for screen reader users
        elements.statsContainer.setAttribute('tabindex', '-1');
        elements.statsContainer.focus();
    }
}

/** Updates the text of the language toggle button. */
export function updateLanguageButtonText(language) {
     elements.toggleLanguageButton.textContent = `Language: ${language.charAt(0).toUpperCase() + language.slice(1)}`;
}




