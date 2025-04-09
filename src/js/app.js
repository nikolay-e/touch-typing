// src/js/app.js
import * as config from './config.js';
import * as stats from './stats.js';
import * as ui from './ui.js';

// --- Application State ---
let currentLanguage = 'english';
let currentCharacterSet = []; // Array of strings (chars or n-grams)
let currentTarget = '';       // The current char or n-gram to type
let sequencePosition = 0;     // Index within the currentTarget n-gram
let ngramLength = 0;          // 0 for single chars, 2-5 for n-grams
let isAppInitialized = false;

// Mode states
let characterModes = {
    lowercase: true, uppercase: false, numbers: false, special: false,
};
let ngramModes = {
    n2gram: false, n3gram: false, n4gram: false, n5gram: false,
};

// --- Core Functions ---

/** Updates the set of characters or n-grams used for practice based on current modes. */
function updateTrainingSet() {
    let newSet = [];
    ngramLength = 0; // Default to single characters

    const activeNgramMode = Object.keys(ngramModes).find(mode => ngramModes[mode]);

    if (activeNgramMode) {
        // N-gram mode is active
        ngramLength = parseInt(activeNgramMode.charAt(1), 10);
        switch (activeNgramMode) {
            case 'n2gram': newSet = (currentLanguage === 'english') ? config.frequentDigraphsEng : config.frequentDigraphsRus; break;
            case 'n3gram': newSet = (currentLanguage === 'english') ? config.frequentTrigraphsEng : config.frequentTrigraphsRus; break; // Use new Rus list
            case 'n4gram': newSet = (currentLanguage === 'english') ? config.frequentTetragraphsEng : config.frequentTetragraphsRus; break; // Use new Rus list
            case 'n5gram': newSet = (currentLanguage === 'english') ? config.frequentPentagraphsEng : config.frequentPentagraphsRus; break; // Use new Rus list
        }
        // Fallback if n-gram list is unavailable (empty or null) for the language/length
        if (!newSet || newSet.length === 0) {
            console.warn(`N-gram list for ${activeNgramMode}/${currentLanguage} unavailable or empty. Falling back to characters.`);
            ngramModes[activeNgramMode] = false; // Disable the unavailable mode
            if (!Object.values(characterModes).some(v => v) && !Object.values(ngramModes).some(v => v)) { // Ensure at least one char mode is on if all ngrams off
                characterModes.lowercase = true;
            }
            ui.updateModeButtonsActiveState(characterModes, ngramModes); // Reflect fallback in UI
            ngramLength = 0; // Reset ngramLength
             // Recalculate newSet based on character modes now
            activeNgramMode = null; // Clear active n-gram mode to proceed with char logic below
        }
    }

    // If no n-gram mode is active (or after fallback)
    if (!activeNgramMode) {
        ngramLength = 0;
        let tempSet = '';
        const letters = (currentLanguage === 'english') ? config.englishLetters : config.russianLetters;
        if (characterModes.lowercase) tempSet += letters;
        if (characterModes.uppercase) tempSet += letters.toUpperCase();
        if (characterModes.numbers) tempSet += config.numbers;
        if (characterModes.special) {
            const layoutChars = config.keyboardLayouts[currentLanguage]?.flat().join('') || '';
            config.standardSpecialChars.split('').forEach(char => {
                if (layoutChars.includes(char)) tempSet += char;
            });
            // Could add logic for shift+special chars here if needed
        }
        // Add space only if any character mode involving letters/numbers/special is selected
        if (tempSet !== '' && (characterModes.lowercase || characterModes.uppercase || characterModes.numbers || characterModes.special)) {
             if (!tempSet.includes(' ')) { // Avoid adding multiple spaces if already present
                 tempSet += ' ';
             }
        }
        newSet = tempSet.split(''); // Convert to array of single characters
    }

    // Final fallback: If set is still empty, default to lowercase English letters + space
    if (!newSet || newSet.length === 0) {
        console.warn("All modes resulted in an empty set. Defaulting to English lowercase characters + space.");
        characterModes = { lowercase: true, uppercase: false, numbers: false, special: false }; // Reset modes
        ngramModes = { n2gram: false, n3gram: false, n4gram: false, n5gram: false };
        ngramLength = 0;
        newSet = (config.englishLetters + ' ').split('');
        // Reflect this final fallback in UI buttons if app is already initialized
        if (isAppInitialized) {
             ui.updateModeButtonsActiveState(characterModes, ngramModes);
        }
    }

    currentCharacterSet = newSet;
    // Ensure stats structure matches all possible chars, not just the current training set
    // This is now handled primarily within stats.loadCharacterStatsFromLocalStorage
    // stats.initializeBaseStatsStructure(config.allPossibleCharacters); // Redundant if load handles it

    stats.resetSessionStats(); // Reset session counts/times for the new mode/set

    setNewTarget(); // Select the first target from the new set
    ui.updateQuickStatsDisplay(); // Update WPM/Accuracy display (will be 0)
    ui.updateDetailedStatsDisplay(); // Update detailed stats table (shows historical data)
}


/** Selects and displays a new target (character or n-gram). */
function setNewTarget() {
    if (currentCharacterSet && currentCharacterSet.length > 0) {
        currentTarget = currentCharacterSet[Math.floor(Math.random() * currentCharacterSet.length)];
        sequencePosition = 0; // Reset position for the new target
        ui.updateDisplayAndHighlight(currentTarget, sequencePosition, ngramLength > 0, config.keyMap);
        // Start timer moved to updateDisplayAndHighlight or handled implicitly by getTimeTaken starting point
        // stats.setCharacterStartTime(); // Call this here or let UI function handle it
    } else {
        // Handle empty training set (should be rare after fallbacks)
        currentTarget = '';
        sequencePosition = 0;
        ui.updateDisplayAndHighlight(null, 0, false, config.keyMap); // Show error/empty message
    }
}

/** Handles the keydown event for typing practice. */
function handleKeyDown(event) {
    // Ignore if focus is not on the body (e.g., on a button)
    if (event.target !== document.body) {
        // Allow space/enter to work on buttons
        if ((event.key === ' ' || event.key === 'Enter') && event.target.tagName === 'BUTTON') {
             return;
        }
        // If focus is elsewhere, generally ignore typing input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
         // Allow keyboard navigation for buttons etc. (Tab, Shift+Tab, Arrows)
        if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            return;
        }
    }

    // Ignore if modifier keys (Ctrl, Meta, Alt - excluding AltGr potentially) are pressed alone
    if (event.ctrlKey || event.metaKey || (event.altKey && !event.getModifierState("AltGraph"))) {
        // Allow Ctrl+C, Ctrl+V etc. by checking if it's just the modifier
        if (['Control', 'Meta', 'Alt'].includes(event.key)) return;
    }
    // Ignore specific standalone modifier presses
    if (['Shift', 'CapsLock', 'AltGraph', 'Control', 'Alt', 'Meta'].includes(event.key)) return;

    // Ignore function keys
    if (event.key.startsWith('F') && event.key.length > 1 && !isNaN(parseInt(event.key.substring(1)))) return;
    // Ignore other non-printable keys (check key length > 1 and not space/enter etc.)
    const nonPrintableKeys = ['Escape', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete', 'Pause', 'ScrollLock', 'NumLock', 'PrintScreen'];
    if (nonPrintableKeys.includes(event.key)) return;


    const keyPressed = event.key;
    const eventCode = event.code;

    // Animate the pressed key (using event.code for better physical key mapping)
    // Map event.code back to the base key symbol for animation lookup
    const baseKeyForAnimation = config.keyMap[eventCode]; // Use the mapping 'KeyA' -> 'a' etc.
    if (baseKeyForAnimation) {
        ui.pressKeyAnimation(baseKeyForAnimation);
    } else {
        // Fallback for unknown codes - try lowercase key? Unlikely needed with comprehensive map.
         console.warn("No keyMap entry for animation:", eventCode);
    }


    // If no target is set, do nothing
    if (!currentTarget) return;

    const expectedChar = currentTarget[sequencePosition];
    if (!expectedChar) return; // Safety check for end of sequence

    // Prevent default action for relevant keys (like space scrolling, '/' opening quick find)
    // Check if the key is part of the potential characters OR is a relevant control key like backspace (if implemented)
    if (config.allPossibleCharacters.includes(keyPressed) || ['Backspace', 'Enter'].includes(event.key)) {
        event.preventDefault();
    }


    // Start session timer on first valid printable input
    if (stats.sessionStartTime === 0 && config.allPossibleCharacters.includes(keyPressed)) {
        stats.startSessionTimer();
    }

    // --- Input Check Logic ---
    // Handle only printable characters for correctness check
    if (!config.allPossibleCharacters.includes(keyPressed)) {
        return; // Ignore non-printable keys for correctness logic
    }


    const timeTaken = stats.getTimeTaken();
    const correct = stats.recordKeyPress(expectedChar, keyPressed, timeTaken); // This now saves to localStorage too

    // Update UI feedback
    ui.updateResultDisplay(correct, timeTaken, expectedChar);
    ui.updateQuickStatsDisplay();
    // Avoid updating detailed stats on every keypress for performance, maybe update on error or less frequently
    // ui.updateDetailedStatsDisplay(); // Can be intensive

    if (correct) {
        sequencePosition++;
        if (sequencePosition < currentTarget.length) {
            // Move to the next character in the n-gram
            const nextChar = currentTarget[sequencePosition];
            ui.highlightKey(nextChar, config.keyMap);
            stats.setCharacterStartTime(); // Reset timer for the next char in the sequence
        } else {
            // N-gram/character completed, get the next target
            ui.updateDetailedStatsDisplay(); // Update details when target is complete
            setTimeout(setNewTarget, 80); // Delay slightly before showing next
        }
    } else {
        // Incorrect keypress
        ui.errorKeyAnimation(expectedChar, config.keyMap);
        ui.updateDetailedStatsDisplay(); // Update details on error too
        // Stay on the same character, allow user to correct
    }
}


/** Handles clicks on mode toggle buttons. */
function handleModeToggle(mode) {
    const isNgramMode = mode.startsWith('n');
    const isCharMode = !isNgramMode;

    if (isNgramMode) {
        const targetState = !ngramModes[mode]; // Toggle intended state
        // Disable all char modes & other n-gram modes
        Object.keys(characterModes).forEach(k => characterModes[k] = false);
        Object.keys(ngramModes).forEach(k => ngramModes[k] = (k === mode) ? targetState : false);
        // If disabling the last n-gram mode, revert to default char mode
        if (!targetState && !Object.values(ngramModes).some(v => v)) {
            characterModes.lowercase = true;
        }
    } else if (isCharMode) {
        // Disable all n-gram modes
        Object.keys(ngramModes).forEach(k => ngramModes[k] = false);
        // Toggle the selected char mode
        characterModes[mode] = !characterModes[mode];
        // Ensure at least one char mode is active if no n-gram modes are
        if (!Object.values(characterModes).some(v => v) && !Object.values(ngramModes).some(v => v)) {
            characterModes.lowercase = true; // Default to lowercase if all toggled off
        }
    }

    ui.updateModeButtonsActiveState(characterModes, ngramModes);
    updateTrainingSet(); // Update practice set based on new modes
}

/** Handles clicks on the language toggle button. */
function handleLanguageToggle() {
    currentLanguage = (currentLanguage === 'english') ? 'russian' : 'english';
    ui.updateLanguageButtonText(currentLanguage);
    ui.generateKeyboard(currentLanguage);
    updateTrainingSet(); // Update set (will handle n-gram availability and reset session)
}

/** Initializes the application. */
function initializeApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    console.log("Initializing Typing Practice App...");
    try {
        // --- Load stats from localStorage FIRST ---
        stats.loadCharacterStatsFromLocalStorage();

        // --- Now initialize UI and Modes ---
        ui.createModeButtons(characterModes, ngramModes, handleModeToggle);
        ui.generateKeyboard(currentLanguage);

        // --- Setup initial training set (uses loaded characterStats implicitly if needed) ---
        updateTrainingSet(); // Initial setup of training set and target

        // Attach event listeners
        document.addEventListener('keydown', handleKeyDown);
        ui.elements.toggleStatsButton.addEventListener('click', ui.toggleStatsVisibility);
        ui.elements.toggleLanguageButton.addEventListener('click', handleLanguageToggle);

        // Initial UI updates
        ui.updateQuickStatsDisplay();
        ui.updateDetailedStatsDisplay(); // Will now use potentially loaded historical data
        // Ensure the initial target is displayed correctly, replacing "Loading..."
        if (currentTarget) {
             ui.updateDisplayAndHighlight(currentTarget, sequencePosition, ngramLength > 0, config.keyMap);
        } else {
            // If updateTrainingSet resulted in empty set initially (shouldn't happen with fallbacks)
             ui.updateDisplayAndHighlight(null, 0, false, config.keyMap);
        }


        console.log("App Initialized Successfully.");

    } catch (error) {
        console.error("Error during app initialization:", error);
        if (ui.elements.characterDisplay) {
            ui.elements.characterDisplay.textContent = "Init Error!";
            ui.elements.characterDisplay.style.backgroundColor = 'red';
            ui.elements.characterDisplay.style.color = 'white';
        }
         // Prevent further execution potentially?
    }
}

// Start the app once the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp(); // DOM is already loaded
}