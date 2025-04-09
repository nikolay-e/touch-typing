// src/js/stats.js
import { allPossibleCharacters } from './config.js';

// --- Statistics State Variables ---
export let characterStats = {}; // Per-character stats: { total, correct, incorrect, totalTime, confusedWith: {} }
export let correctCount = 0;   // Total correct keypresses in the current session
export let totalCount = 0;     // Total tracked keypresses in the current session
export let startTime = 0;      // Timestamp when the current target character was displayed
export let totalTime = 0;      // Sum of time taken for all tracked keypresses
export let sessionStartTime = 0;// Timestamp when the first valid keypress occurred in the session (for WPM)
export let wpm = 0;            // Calculated Words Per Minute

// --- localStorage Key ---
const STATS_STORAGE_KEY = 'touchTypingCharacterStats';

// --- Statistics Functions ---

/**
 * Ensures the base structure for character stats exists, both for newly added characters
 * from config and for loaded stats (to ensure all keys like totalTime, confusedWith exist).
 * Does not overwrite existing numeric data.
 */
function initializeBaseStatsStructure(charSet = allPossibleCharacters) {
    charSet.split('').forEach(char => {
        const defaultStat = { total: 0, correct: 0, incorrect: 0, totalTime: 0, confusedWith: {} };
        if (!characterStats[char]) {
            // Character doesn't exist in stats, initialize fully
            characterStats[char] = defaultStat;
        } else {
            // Character exists (likely loaded), ensure all properties are present
            for (const key in defaultStat) {
                if (!characterStats[char].hasOwnProperty(key)) {
                    // Add missing property (e.g., confusedWith if stats were saved before it was added)
                    characterStats[char][key] = defaultStat[key];
                }
            }
            // Ensure 'confusedWith' is an object, even if loaded as null/undefined from older storage
            if (typeof characterStats[char].confusedWith !== 'object' || characterStats[char].confusedWith === null) {
                characterStats[char].confusedWith = {};
            }
        }
    });
}

/** Saves the current characterStats object to localStorage. */
export function saveCharacterStatsToLocalStorage() {
    try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(characterStats));
        // console.log("Saved stats to localStorage."); // Uncomment for debugging
    } catch (error) {
        console.error("Failed to save stats to localStorage:", error);
        // Handle potential errors (e.g., storage full) - maybe notify the user?
    }
}

/** Loads characterStats from localStorage. */
export function loadCharacterStatsFromLocalStorage() {
    try {
        const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
        if (storedStats) {
            const parsedStats = JSON.parse(storedStats);
            // Assign loaded stats directly. initializeBaseStatsStructure will ensure completeness later.
            characterStats = parsedStats;
            console.log("Loaded character stats from localStorage.");
        } else {
           // No stats found, initialize empty object. initializeBaseStatsStructure will populate it.
           characterStats = {};
           console.log("No stats found in localStorage. Initializing fresh stats.");
        }
    } catch (error) {
        console.error("Failed to load or parse stats from localStorage:", error);
        // Reset to empty object on error to prevent app crash
        characterStats = {};
    }
    // IMPORTANT: Always ensure the stats object matches the current character set defined in config
    // This adds entries for any new characters and ensures properties like 'confusedWith' exist.
    initializeBaseStatsStructure();
}

/** DEPRECATED or Refactored: Original initialization logic is now part of load/structure check. */
export function initializeCharacterStats(charSet = allPossibleCharacters) {
    // This function is now primarily handled by loadCharacterStatsFromLocalStorage
    // and initializeBaseStatsStructure. Calling it directly might reset loaded stats.
    console.warn("initializeCharacterStats is deprecated; use loadCharacterStatsFromLocalStorage.");
    initializeBaseStatsStructure(charSet); // Ensure structure based on provided charset if needed elsewhere
}


/** Resets session-specific stats (counts, times, WPM). Does not reset characterStats history. */
export function resetSessionStats() {
    correctCount = 0;
    totalCount = 0;
    startTime = 0;
    totalTime = 0;
    sessionStartTime = 0;
    wpm = 0;
    // DO NOT reset characterStats here
    // DO NOT save to localStorage here, only recordKeyPress should trigger saves
}

/** Records a keypress, updating counts and times, and saves stats. */
export function recordKeyPress(expectedChar, pressedChar, timeTaken) {
    // Ensure stats object exists for the expected character (should be handled by load/init)
    if (!characterStats[expectedChar]) {
         console.warn(`Stats object missing for expected character: ${expectedChar}. Initializing.`);
         initializeBaseStatsStructure(expectedChar); // Initialize just this one if somehow missed
    }
    // We don't necessarily need stats for pressedChar unless tracking "how often X is pressed incorrectly"

    totalCount++;
    totalTime += timeTaken;
    // Use || 0 to ensure robustness if loaded data is incomplete/corrupt
    characterStats[expectedChar].total = (characterStats[expectedChar].total || 0) + 1;
    characterStats[expectedChar].totalTime = (characterStats[expectedChar].totalTime || 0) + timeTaken;

    let correct = false;
    if (pressedChar === expectedChar) {
        correctCount++;
        characterStats[expectedChar].correct = (characterStats[expectedChar].correct || 0) + 1;
        correct = true; // Correct press
    } else {
        characterStats[expectedChar].incorrect = (characterStats[expectedChar].incorrect || 0) + 1;
        // Record confusion data
        const confusion = characterStats[expectedChar].confusedWith || {};
        confusion[pressedChar] = (confusion[pressedChar] || 0) + 1;
        characterStats[expectedChar].confusedWith = confusion; // Assign back
        correct = false; // Incorrect press
    }

    // --- Save stats after every keypress ---
    // Note: For high-frequency typing, consider debouncing or throttling this call
    // or saving on 'beforeunload' event for better performance.
    saveCharacterStatsToLocalStorage();

    return correct;
}

/** Calculates Words Per Minute based on correct characters typed since session start. */
export function calculateWPM() {
    if (sessionStartTime > 0 && correctCount > 0) {
        const elapsedMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
        if (elapsedMinutes >= 0.005) { // Avoid division by zero or tiny intervals
            wpm = Math.round((correctCount / 5) / elapsedMinutes);
        } else {
            wpm = 0; // Not enough time elapsed yet
        }
    } else {
        wpm = 0; // Session not started or no correct keys pressed
    }
    return wpm;
}

/** Starts the session timer on the first valid keypress. */
export function startSessionTimer() {
    if (sessionStartTime === 0) {
        sessionStartTime = Date.now();
        // Ensure startTime for the very first character is also set correctly
        if (startTime === 0) startTime = sessionStartTime;
    }
}

/** Sets the start time for measuring time taken for the current character. */
export function setCharacterStartTime() {
    startTime = Date.now();
}

/** Gets the time elapsed since the current character was displayed. */
export function getTimeTaken() {
    return startTime > 0 ? Date.now() - startTime : 0;
}

/** Calculates the overall accuracy for the current session. */
export function getOverallAccuracy() {
    return totalCount > 0 ? (correctCount / totalCount * 100) : 0;
}

/** Calculates the average time per character for the current session. */
export function getAverageTimePerChar() {
    return totalCount > 0 ? (totalTime / totalCount) : 0;
}