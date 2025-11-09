// src/js/stats.js
import { allPossibleCharacters, TIMING_CONSTANTS, STATS_CONSTANTS } from './config.js';

// --- Data Model Version ---
const DATA_MODEL_VERSION = "2.0.0";
const LEGACY_STORAGE_KEY = 'touchTypingCharacterStats';
const NEW_STORAGE_KEY = 'touchTypingData';


// --- Comprehensive Data Structure ---
export let typingData = {
    version: DATA_MODEL_VERSION,
    metadata: {
        createdAt: null,
        lastModified: null,
        totalSessions: 0,
        totalKeypresses: 0,
        deviceInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
        }
    },
    settings: {
        language: 'english',
        practiceMode: 'lowercase',
        outlierDetection: true,
        dataCollection: true
    },
    statistics: {
        characters: {}, // Per-character aggregated stats
        sessions: [],   // Individual session records
        milestones: []  // Milestone records
    },
    rawData: {
        keystrokes: [], // Detailed keystroke log (limited to recent entries)
        sessions: []    // Detailed session data
    }
};

// --- Session State Variables (temporary, not persisted) ---
export let currentSession = {
    id: null,
    startTime: null,
    endTime: null,
    correctCount: 0,
    totalCount: 0,
    totalTime: 0,
    wpm: 0,
    accuracy: 0,
    keystrokes: [],
    practiceMode: 'lowercase',
    language: 'english'
};

// --- Legacy compatibility variables ---
export let characterStats = {}; // Mapped from typingData.statistics.characters
export let correctCount = 0;   
export let totalCount = 0;     
export let startTime = 0;      
export let totalTime = 0;      
export let sessionStartTime = 0;
export let wpm = 0;

// --- Debounce utility for performance ---
let saveTimeout = null;

/**
 * Debounced version of saveCharacterStatsToLocalStorage.
 * Delays saving until user stops typing for TIMING_CONSTANTS.DEBOUNCE_SAVE_DELAY milliseconds.
 */
function debouncedSave() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
        try {
            saveCharacterStatsToLocalStorage();
        } catch (error) {
            console.error('Error in debounced save:', error);
        } finally {
            saveTimeout = null;
        }
    }, TIMING_CONSTANTS.DEBOUNCE_SAVE_DELAY);
}

// Ensure stats are saved before page unload
window.addEventListener('beforeunload', () => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveCharacterStatsToLocalStorage(); // Force immediate save
    }
});

// --- Data Management Functions ---

/**
 * Generates a unique session ID
 * @returns {string} - Unique session identifier
 */
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Initializes a new typing data structure
 * @returns {object} - Fresh typing data structure
 */
function createFreshTypingData() {
    const now = new Date().toISOString();
    return {
        version: DATA_MODEL_VERSION,
        metadata: {
            createdAt: now,
            lastModified: now,
            totalSessions: 0,
            totalKeypresses: 0,
            deviceInfo: {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
            }
        },
        settings: {
            language: 'english',
            practiceMode: 'lowercase',
            outlierDetection: true,
            dataCollection: true
        },
        statistics: {
            characters: {},
            sessions: [],
            milestones: []
        },
        rawData: {
            keystrokes: [],
            sessions: []
        }
    };
}

/**
 * Starts a new typing session
 * @param {string} practiceMode - Current practice mode
 * @param {string} language - Current language
 */
export function startNewSession(practiceMode = 'lowercase', language = 'english') {
    currentSession = {
        id: generateSessionId(),
        startTime: new Date().toISOString(),
        endTime: null,
        correctCount: 0,
        totalCount: 0,
        totalTime: 0,
        wpm: 0,
        accuracy: 0,
        keystrokes: [],
        practiceMode,
        language
    };
    
    // Update legacy variables
    correctCount = 0;
    totalCount = 0;
    totalTime = 0;
    sessionStartTime = Date.now();
    wpm = 0;
    
    console.log(`Started new session: ${currentSession.id}`);
}

/**
 * Ends the current session and saves it to history
 */
export function endCurrentSession() {
    if (!currentSession.id) return;
    
    currentSession.endTime = new Date().toISOString();
    currentSession.wpm = calculateWPM();
    currentSession.accuracy = getOverallAccuracy();
    
    // Save session to history (limit to last 100 sessions)
    typingData.statistics.sessions.push({
        id: currentSession.id,
        startTime: currentSession.startTime,
        endTime: currentSession.endTime,
        duration: new Date(currentSession.endTime) - new Date(currentSession.startTime),
        correctCount: currentSession.correctCount,
        totalCount: currentSession.totalCount,
        totalTime: currentSession.totalTime,
        wpm: currentSession.wpm,
        accuracy: currentSession.accuracy,
        practiceMode: currentSession.practiceMode,
        language: currentSession.language,
        keystrokeCount: currentSession.keystrokes.length
    });
    
    // Limit session history
    if (typingData.statistics.sessions.length > 100) {
        typingData.statistics.sessions = typingData.statistics.sessions.slice(-100);
    }
    
    // Update metadata
    typingData.metadata.totalSessions++;
    typingData.metadata.lastModified = new Date().toISOString();
    
    // Save detailed session data (limit to last 10 sessions)
    typingData.rawData.sessions.push({
        id: currentSession.id,
        data: { ...currentSession }
    });
    
    if (typingData.rawData.sessions.length > 10) {
        typingData.rawData.sessions = typingData.rawData.sessions.slice(-10);
    }
    
    console.log(`Ended session: ${currentSession.id} - WPM: ${currentSession.wpm}, Accuracy: ${currentSession.accuracy.toFixed(1)}%`);
    
    // Save to storage
    debouncedSave();
}

// --- Statistics Functions ---

/**
 * Ensures the base structure for character stats exists, both for newly added characters
 * from config and for loaded stats (to ensure all keys like totalTime, confusedWith exist).
 * Does not overwrite existing numeric data.
 */
function initializeBaseStatsStructure(charSet = allPossibleCharacters) {
    charSet.split('').forEach(char => {
        const defaultStat = { 
            total: 0, 
            correct: 0, 
            incorrect: 0, 
            totalTime: 0, 
            confusedWith: {},
            allTimingSamples: [], // Array to store ALL timing samples (including outliers)
            outlierCount: 0,      // Count of current outliers
            validSampleCount: 0   // Count of valid (non-outlier) samples
        };
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
            // Ensure allTimingSamples is an array
            if (!Array.isArray(characterStats[char].allTimingSamples)) {
                characterStats[char].allTimingSamples = [];
            }
            // Ensure outlierCount exists
            if (typeof characterStats[char].outlierCount !== 'number') {
                characterStats[char].outlierCount = 0;
            }
            // Ensure validSampleCount exists
            if (typeof characterStats[char].validSampleCount !== 'number') {
                characterStats[char].validSampleCount = 0;
            }
        }
    });
}

/**
 * Calculates percentile value from an array of numbers
 * @param {number[]} arr - Sorted array of numbers
 * @param {number} percentile - Percentile (0-100)
 * @returns {number} - Percentile value
 */
function calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
        return sorted[lower];
    }
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculates median time from valid (non-outlier) samples
 * @param {string} char - Character to calculate median for
 * @returns {number} - Median time in milliseconds
 */
function calculateMedianTime(char) {
    const charStat = characterStats[char];
    if (!charStat || !charStat.allTimingSamples || charStat.allTimingSamples.length === 0) {
        return 0;
    }
    
    // Get valid samples (excluding current outliers)
    const allSamples = charStat.allTimingSamples;
    const validSamples = [];
    
    if (allSamples.length >= STATS_CONSTANTS.MIN_SAMPLES_FOR_OUTLIER_DETECTION) {
        const lowerBound = calculatePercentile(allSamples, STATS_CONSTANTS.OUTLIER_LOWER_PERCENTILE);
        const upperBound = calculatePercentile(allSamples, STATS_CONSTANTS.OUTLIER_UPPER_PERCENTILE);
        
        allSamples.forEach(sample => {
            if (sample >= STATS_CONSTANTS.MIN_REASONABLE_TIME && 
                sample <= STATS_CONSTANTS.MAX_REASONABLE_TIME &&
                sample >= lowerBound && 
                sample <= upperBound) {
                validSamples.push(sample);
            }
        });
    } else {
        // Not enough samples for percentile filtering, just use absolute bounds
        allSamples.forEach(sample => {
            if (sample >= STATS_CONSTANTS.MIN_REASONABLE_TIME && 
                sample <= STATS_CONSTANTS.MAX_REASONABLE_TIME) {
                validSamples.push(sample);
            }
        });
    }
    
    if (validSamples.length === 0) return 0;
    
    // Calculate median from valid samples
    return calculatePercentile(validSamples, 50); // 50th percentile = median
}

/**
 * Determines if a timing sample is an outlier based on current dataset
 * @param {number} timeTaken - Time taken for the keypress
 * @param {string} char - Character being typed
 * @returns {boolean} - True if the sample is an outlier relative to current performance
 */
function isOutlier(timeTaken, char) {
    // First check against absolute reasonable bounds
    if (timeTaken < STATS_CONSTANTS.MIN_REASONABLE_TIME || 
        timeTaken > STATS_CONSTANTS.MAX_REASONABLE_TIME) {
        return true;
    }
    
    // Get ALL existing samples for this character (including previous outliers)
    const allSamples = characterStats[char]?.allTimingSamples || [];
    
    // Need minimum samples before applying percentile-based outlier detection
    if (allSamples.length < STATS_CONSTANTS.MIN_SAMPLES_FOR_OUTLIER_DETECTION) {
        return false;
    }
    
    // Calculate percentile bounds from ALL samples (this shifts as user improves)
    const lowerBound = calculatePercentile(allSamples, STATS_CONSTANTS.OUTLIER_LOWER_PERCENTILE);
    const upperBound = calculatePercentile(allSamples, STATS_CONSTANTS.OUTLIER_UPPER_PERCENTILE);
    
    // Check if current time is outside the acceptable range
    return timeTaken < lowerBound || timeTaken > upperBound;
}

/**
 * Recalculates timing statistics excluding current outliers
 * @param {string} char - Character to recalculate for
 */
function recalculateTimingStats(char) {
    if (typeof char !== 'string' || char.length === 0) {
        console.warn('Invalid character provided to recalculateTimingStats:', char);
        return;
    }
    
    const charStat = characterStats[char];
    if (!charStat || !charStat.allTimingSamples || charStat.allTimingSamples.length === 0) {
        return;
    }
    
    // Recalculate what are currently considered outliers
    const allSamples = charStat.allTimingSamples;
    const validSamples = [];
    let outlierCount = 0;
    
    // Only apply percentile filtering if we have enough samples
    if (allSamples.length >= STATS_CONSTANTS.MIN_SAMPLES_FOR_OUTLIER_DETECTION) {
        const lowerBound = calculatePercentile(allSamples, STATS_CONSTANTS.OUTLIER_LOWER_PERCENTILE);
        const upperBound = calculatePercentile(allSamples, STATS_CONSTANTS.OUTLIER_UPPER_PERCENTILE);
        
        allSamples.forEach(sample => {
            if (sample >= STATS_CONSTANTS.MIN_REASONABLE_TIME && 
                sample <= STATS_CONSTANTS.MAX_REASONABLE_TIME &&
                sample >= lowerBound && 
                sample <= upperBound) {
                validSamples.push(sample);
            } else {
                outlierCount++;
            }
        });
    } else {
        // Not enough samples for percentile filtering, just use absolute bounds
        allSamples.forEach(sample => {
            if (sample >= STATS_CONSTANTS.MIN_REASONABLE_TIME && 
                sample <= STATS_CONSTANTS.MAX_REASONABLE_TIME) {
                validSamples.push(sample);
            } else {
                outlierCount++;
            }
        });
    }
    
    // Update timing statistics based on valid samples only
    charStat.totalTime = validSamples.reduce((sum, time) => sum + time, 0);
    charStat.outlierCount = outlierCount;
    charStat.validSampleCount = validSamples.length;
}

/** Saves the comprehensive typing data to localStorage. */
export function saveCharacterStatsToLocalStorage() {
    try {
        // Update metadata before saving
        typingData.metadata.lastModified = new Date().toISOString();
        typingData.metadata.totalKeypresses = Object.values(typingData.statistics.characters)
            .reduce((sum, char) => sum + (char.total || 0), 0);
        
        // Limit keystroke log size to prevent storage bloat (keep last 1000)
        if (typingData.rawData.keystrokes.length > 1000) {
            typingData.rawData.keystrokes = typingData.rawData.keystrokes.slice(-1000);
        }
        
        const dataString = JSON.stringify(typingData);
        localStorage.setItem(NEW_STORAGE_KEY, dataString);
        
        // Also maintain legacy format for backward compatibility
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(characterStats));
        
    } catch (error) {
        console.error("Failed to save typing data to localStorage:", error);
        
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.warn("LocalStorage quota exceeded. Attempting to optimize data...");
            try {
                // Remove old keystroke data to make room
                typingData.rawData.keystrokes = typingData.rawData.keystrokes.slice(-500);
                typingData.rawData.sessions = typingData.rawData.sessions.slice(-5);
                
                localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(typingData));
                console.log("Saved optimized data after clearing old entries.");
            } catch (retryError) {
                console.error("Failed to save even after optimization:", retryError);
                if (window.ui && window.ui.elements.resultDisplay) {
                    window.ui.elements.resultDisplay.textContent = "Storage full! Data not saved.";
                    window.ui.elements.resultDisplay.style.color = 'orange';
                }
            }
        }
    }
}

/**
 * Exports all typing data as a downloadable JSON file
 * @returns {string} - JSON string of all typing data
 */
export function exportTypingData() {
    const exportData = {
        ...typingData,
        exportedAt: new Date().toISOString(),
        exportVersion: DATA_MODEL_VERSION
    };
    
    return JSON.stringify(exportData, null, 2);
}

/**
 * Downloads typing data as a JSON file
 */
export function downloadTypingData() {
    try {
        const dataString = exportTypingData();
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `typing-stats-${timestamp}.json`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`Exported typing data to ${filename}`);
        return true;
    } catch (error) {
        console.error("Failed to download typing data:", error);
        return false;
    }
}

/**
 * Imports typing data from a JSON string
 * @param {string} jsonString - JSON string containing typing data
 * @param {boolean} merge - Whether to merge with existing data or replace
 * @returns {boolean} - Success status
 */
export function importTypingData(jsonString, merge = false) {
    try {
        const importedData = JSON.parse(jsonString);
        
        // Validate imported data structure
        if (!validateImportedData(importedData)) {
            throw new Error("Invalid data format");
        }
        
        if (merge) {
            // Merge imported data with existing data
            mergeTypingData(importedData);
        } else {
            // Replace existing data
            typingData = { ...importedData };
            
            // Ensure current version
            typingData.version = DATA_MODEL_VERSION;
            typingData.metadata.lastModified = new Date().toISOString();
        }
        
        // Update legacy compatibility
        characterStats = typingData.statistics.characters;
        syncLegacyVariables();
        
        // Save to localStorage
        saveCharacterStatsToLocalStorage();
        
        console.log("Successfully imported typing data");
        return true;
    } catch (error) {
        console.error("Failed to import typing data:", error);
        return false;
    }
}

/**
 * Validates imported data structure
 * @param {object} data - Data to validate
 * @returns {boolean} - Whether data is valid
 */
function validateImportedData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check required top-level properties
    const requiredProps = ['version', 'metadata', 'statistics'];
    for (const prop of requiredProps) {
        if (!data.hasOwnProperty(prop)) return false;
    }
    
    // Check metadata structure
    if (!data.metadata.createdAt || !data.statistics.characters) return false;
    
    return true;
}

/**
 * Merges imported data with existing data
 * @param {object} importedData - Data to merge
 */
function mergeTypingData(importedData) {
    // Merge character statistics
    for (const char in importedData.statistics.characters) {
        const importedStat = importedData.statistics.characters[char];
        const existingStat = typingData.statistics.characters[char];
        
        if (existingStat) {
            // Merge stats
            existingStat.total += importedStat.total || 0;
            existingStat.correct += importedStat.correct || 0;
            existingStat.incorrect += importedStat.incorrect || 0;
            existingStat.totalTime += importedStat.totalTime || 0;
            
            // Merge timing samples
            if (importedStat.allTimingSamples) {
                existingStat.allTimingSamples = [
                    ...(existingStat.allTimingSamples || []),
                    ...importedStat.allTimingSamples
                ].slice(-200); // Keep only recent samples
            }
            
            // Merge confusion data
            if (importedStat.confusedWith) {
                existingStat.confusedWith = existingStat.confusedWith || {};
                for (const confused in importedStat.confusedWith) {
                    existingStat.confusedWith[confused] = 
                        (existingStat.confusedWith[confused] || 0) + importedStat.confusedWith[confused];
                }
            }
        } else {
            // New character
            typingData.statistics.characters[char] = { ...importedStat };
        }
    }
    
    // Merge sessions
    if (importedData.statistics.sessions) {
        typingData.statistics.sessions = [
            ...typingData.statistics.sessions,
            ...importedData.statistics.sessions
        ].slice(-100); // Keep only recent sessions
    }
    
    // Update metadata
    typingData.metadata.totalSessions += importedData.metadata.totalSessions || 0;
    if (importedData.metadata.createdAt < typingData.metadata.createdAt) {
        typingData.metadata.createdAt = importedData.metadata.createdAt;
    }
}

/**
 * Validates that a stats object has the correct structure
 * @param {any} stats - The stats object to validate
 * @returns {boolean} - Whether the stats are valid
 */
function validateStatsStructure(stats) {
    if (typeof stats !== 'object' || stats === null) return false;
    
    for (const char in stats) {
        const stat = stats[char];
        if (typeof stat !== 'object' || stat === null) return false;
        
        // Check required numeric properties
        const requiredNumbers = ['total', 'correct', 'incorrect', 'totalTime'];
        for (const prop of requiredNumbers) {
            if (typeof stat[prop] !== 'number' || stat[prop] < 0 || !isFinite(stat[prop])) {
                return false;
            }
        }
        
        // Validate logical constraints
        if (stat.total !== stat.correct + stat.incorrect) return false;
        if (stat.correct > stat.total || stat.incorrect > stat.total) return false;
        
        // Check confusedWith structure
        if (typeof stat.confusedWith !== 'object') return false;
        
        // Check optional new fields (allTimingSamples, outlierCount, validSampleCount)
        if (stat.allTimingSamples !== undefined && !Array.isArray(stat.allTimingSamples)) return false;
        if (stat.outlierCount !== undefined && (typeof stat.outlierCount !== 'number' || stat.outlierCount < 0)) return false;
        if (stat.validSampleCount !== undefined && (typeof stat.validSampleCount !== 'number' || stat.validSampleCount < 0)) return false;
    }
    
    return true;
}

/**
 * Syncs legacy variables with new data structure
 */
function syncLegacyVariables() {
    characterStats = typingData.statistics.characters;
    
    // Calculate current session totals from character stats
    correctCount = currentSession.correctCount;
    totalCount = currentSession.totalCount;
    totalTime = currentSession.totalTime;
    wpm = calculateWPM();
}

/**
 * Migrates legacy data to new format
 * @param {object} legacyStats - Old character stats format
 */
function migrateLegacyData(legacyStats) {
    console.log("Migrating legacy data to new format...");
    
    // Initialize fresh data structure
    typingData = createFreshTypingData();
    
    // Migrate character statistics
    for (const char in legacyStats) {
        const legacyStat = legacyStats[char];
        typingData.statistics.characters[char] = {
            total: legacyStat.total || 0,
            correct: legacyStat.correct || 0,
            incorrect: legacyStat.incorrect || 0,
            totalTime: legacyStat.totalTime || 0,
            confusedWith: legacyStat.confusedWith || {},
            allTimingSamples: legacyStat.timingSamples || legacyStat.allTimingSamples || [],
            outlierCount: legacyStat.outlierCount || 0,
            validSampleCount: legacyStat.validSampleCount || 0
        };
    }
    
    // Update metadata
    typingData.metadata.totalKeypresses = Object.values(typingData.statistics.characters)
        .reduce((sum, char) => sum + char.total, 0);
    
    
    console.log("Legacy data migration completed.");
}

/** Loads comprehensive typing data from localStorage. */
export function loadCharacterStatsFromLocalStorage() {
    try {
        // Try to load new format first
        const newData = localStorage.getItem(NEW_STORAGE_KEY);
        
        if (newData) {
            const parsedData = JSON.parse(newData);
            
            if (validateImportedData(parsedData)) {
                typingData = parsedData;
                characterStats = typingData.statistics.characters;
                console.log("Loaded comprehensive typing data from localStorage.");
            } else {
                console.warn("New format data failed validation. Trying legacy format...");
                loadLegacyData();
            }
        } else {
            // Try legacy format
            loadLegacyData();
        }
    } catch (error) {
        console.error("Failed to load typing data from localStorage:", error);
        
        try {
            // Try legacy as fallback
            loadLegacyData();
        } catch (legacyError) {
            console.error("Failed to load legacy data as well:", legacyError);
            initializeFreshData();
        }
    }
    
    // Ensure proper structure
    initializeBaseStatsStructure();
    
    // Start a new session
    startNewSession();
    syncLegacyVariables();
}

/**
 * Loads legacy data format
 */
function loadLegacyData() {
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    
    if (legacyData) {
        const parsedLegacy = JSON.parse(legacyData);
        
        if (validateStatsStructure(parsedLegacy)) {
            migrateLegacyData(parsedLegacy);
            
            // Save in new format
            saveCharacterStatsToLocalStorage();
            console.log("Migrated and saved legacy data in new format.");
        } else {
            console.warn("Legacy data failed validation. Initializing fresh data.");
            initializeFreshData();
        }
    } else {
        console.log("No existing data found. Initializing fresh data.");
        initializeFreshData();
    }
}

/**
 * Initializes fresh data when no existing data is found
 */
function initializeFreshData() {
    typingData = createFreshTypingData();
    characterStats = {};
    console.log("Initialized fresh typing data.");
}

/**
 * Exports the typing data for external access
 * @returns {object} - Current typing data
 */
export function getTypingData() {
    return typingData;
}

/**
 * Direct access to typing data for compatibility
 */
// typingData is already exported above as 'export let typingData'










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
    // Input validation
    if (typeof expectedChar !== 'string' || typeof pressedChar !== 'string') {
        console.error('Invalid input to recordKeyPress: expectedChar and pressedChar must be strings');
        return false;
    }
    
    if (typeof timeTaken !== 'number' || timeTaken < 0 || !isFinite(timeTaken)) {
        console.error('Invalid timeTaken in recordKeyPress:', timeTaken);
        return false;
    }
    
    // Ensure stats object exists for the expected character
    if (!characterStats[expectedChar]) {
         console.warn(`Stats object missing for expected character: ${expectedChar}. Initializing.`);
         initializeBaseStatsStructure(expectedChar);
    }

    // Record detailed keystroke data
    const keystroke = {
        timestamp: new Date().toISOString(),
        sessionId: currentSession.id,
        expected: expectedChar,
        pressed: pressedChar,
        timeTaken: timeTaken,
        correct: pressedChar === expectedChar,
        language: currentSession.language,
        practiceMode: currentSession.practiceMode
    };
    
    // Add to current session
    currentSession.keystrokes.push(keystroke);
    
    // Add to global keystroke log (with limits)
    if (typingData.settings.dataCollection) {
        typingData.rawData.keystrokes.push(keystroke);
        
        // Limit keystroke log size more aggressively to prevent memory issues
        if (typingData.rawData.keystrokes.length > 500) {
            typingData.rawData.keystrokes = typingData.rawData.keystrokes.slice(-500);
        }
    }

    // ALWAYS add timing sample to the complete dataset
    characterStats[expectedChar].allTimingSamples = characterStats[expectedChar].allTimingSamples || [];
    characterStats[expectedChar].allTimingSamples.push(timeTaken);
    
    // Limit storage to prevent memory bloat (keep latest 150 samples for better performance)
    if (characterStats[expectedChar].allTimingSamples.length > 150) {
        characterStats[expectedChar].allTimingSamples = characterStats[expectedChar].allTimingSamples.slice(-150);
    }

    // Update correctness counts (always count these regardless of timing outliers)
    totalCount++;
    currentSession.totalCount++;
    characterStats[expectedChar].total = (characterStats[expectedChar].total || 0) + 1;
    
    let correct = false;
    if (pressedChar === expectedChar) {
        correctCount++;
        currentSession.correctCount++;
        characterStats[expectedChar].correct = (characterStats[expectedChar].correct || 0) + 1;
        correct = true;
    } else {
        characterStats[expectedChar].incorrect = (characterStats[expectedChar].incorrect || 0) + 1;
        // Record confusion data
        const confusion = characterStats[expectedChar].confusedWith || {};
        confusion[pressedChar] = (confusion[pressedChar] || 0) + 1;
        characterStats[expectedChar].confusedWith = confusion;
        correct = false;
    }

    // Recalculate timing statistics (excluding current outliers)
    recalculateTimingStats(expectedChar);
    
    // Update session timing
    currentSession.totalTime += timeTaken;
    
    // Update global totalTime based on valid samples only
    const allValidTime = Object.values(characterStats)
        .reduce((sum, charStat) => sum + (charStat.totalTime || 0), 0);
    totalTime = allValidTime;


    // Save stats
    debouncedSave();

    return correct;
}

/** Calculates Words Per Minute based on correct characters typed since session start. */
export function calculateWPM() {
    if (sessionStartTime > 0 && correctCount > 0) {
        const elapsedMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
        if (elapsedMinutes >= TIMING_CONSTANTS.MIN_WPM_ELAPSED_TIME) { // Avoid division by zero or tiny intervals
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

/** Gets median time for a specific character. */
export function getCharacterMedianTime(char) {
    return calculateMedianTime(char);
}

/** Gets outlier statistics for analysis and debugging. */
export function getOutlierStats() {
    let totalOutliers = 0;
    let totalSamples = 0;
    const characterOutliers = {};
    
    for (const char in characterStats) {
        const stat = characterStats[char];
        const outliers = stat.outlierCount || 0;
        const allSamples = stat.allTimingSamples?.length || 0;
        
        totalOutliers += outliers;
        totalSamples += allSamples;
        
        if (outliers > 0 || allSamples > 0) {
            characterOutliers[char] = {
                outliers,
                totalSamples: allSamples,
                validSamples: (stat.validSampleCount || 0),
                outlierRate: allSamples > 0 ? (outliers / allSamples * 100).toFixed(1) : 0
            };
        }
    }
    
    return {
        totalOutliers,
        totalSamples,
        overallOutlierRate: totalSamples > 0 ? (totalOutliers / totalSamples * 100).toFixed(1) : 0,
        characterOutliers
    };
}

