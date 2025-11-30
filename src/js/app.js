// src/js/app.js
import * as config from "./config.js";
import { TIMING_CONSTANTS } from "./config.js";
import * as stats from "./stats.js";
import * as ui from "./ui.js";

// --- Global Error Handler ---
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  if (ui.elements.resultDisplay) {
    ui.elements.resultDisplay.textContent =
      "An error occurred. Please refresh the page.";
    ui.elements.resultDisplay.style.color = "red";
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// --- Application State ---
let currentLanguage = "english";
let currentCharacterSet = []; // Array of strings (chars or n-grams)
let currentTarget = ""; // The current char or n-gram to type
let sequencePosition = 0; // Index within the currentTarget n-gram
let ngramLength = 0; // 0 for single chars, 2-5 for n-grams
let isAppInitialized = false;

// --- Smart Character Selection State ---
let recentTargets = []; // Last 4 targets to avoid repetition
let characterCoverage = {}; // Track which characters have been asked
let sessionTargetCount = {}; // Count how many times each character was asked this session
let totalSessionTargets = 0; // Total targets selected this session

// Mode states
let characterModes = {
  lowercase: true,
  uppercase: false,
  numbers: false,
  special: false,
};
let ngramModes = {
  n2gram: false,
  n3gram: false,
  n4gram: false,
  n5gram: false,
};

// --- Core Functions ---

/** Updates the set of characters or n-grams used for practice based on current modes. */
function updateTrainingSet() {
  let newSet = [];
  ngramLength = 0; // Will be set to mixed mode if multiple n-grams are active

  // Reset smart selection state when training set changes
  recentTargets = [];
  characterCoverage = {};
  sessionTargetCount = {};
  totalSessionTargets = 0;

  // Collect all active n-gram modes
  const activeNgramModes = Object.keys(ngramModes).filter(
    (mode) => ngramModes[mode],
  );

  // Build the character set first (for n-grams and/or single chars)
  let charSet = "";
  const letters =
    currentLanguage === "english"
      ? config.englishLetters
      : config.russianLetters;
  if (characterModes.lowercase) charSet += letters;
  if (characterModes.uppercase) charSet += letters.toUpperCase();
  if (characterModes.numbers) charSet += config.numbers;
  if (characterModes.special) {
    const layoutChars =
      config.keyboardLayouts[currentLanguage]?.flat().join("") || "";
    config.standardSpecialChars.split("").forEach((char) => {
      if (layoutChars.includes(char)) charSet += char;
    });
  }

  // Add space if any character mode is active
  if (charSet !== "" && !charSet.includes(" ")) {
    charSet += " ";
  }

  // Add single characters to the set if any character mode is active
  if (Object.values(characterModes).some((v) => v)) {
    newSet = newSet.concat(charSet.split(""));
  }

  // Add n-grams from all active n-gram modes
  if (activeNgramModes.length > 0) {
    // Set ngramLength to -1 to indicate mixed mode (various lengths)
    ngramLength =
      activeNgramModes.length === 1
        ? parseInt(activeNgramModes[0].charAt(1), 10)
        : -1;

    activeNgramModes.forEach((mode) => {
      let ngramSet = [];
      switch (mode) {
        case "n2gram":
          ngramSet =
            currentLanguage === "english"
              ? config.frequentDigraphsEng
              : config.frequentDigraphsRus;
          break;
        case "n3gram":
          ngramSet =
            currentLanguage === "english"
              ? config.frequentTrigraphsEng
              : config.frequentTrigraphsRus;
          break;
        case "n4gram":
          ngramSet =
            currentLanguage === "english"
              ? config.frequentTetragraphsEng
              : config.frequentTetragraphsRus;
          break;
        case "n5gram":
          ngramSet =
            currentLanguage === "english"
              ? config.frequentPentagraphsEng
              : config.frequentPentagraphsRus;
          break;
      }

      // Only add n-grams if the set is available and non-empty
      if (ngramSet && ngramSet.length > 0) {
        newSet = newSet.concat(ngramSet);
      } else {
        console.warn(
          `N-gram list for ${mode}/${currentLanguage} unavailable or empty.`,
        );
        ngramModes[mode] = false; // Disable the unavailable mode
        ui.updateModeButtonsActiveState(characterModes, ngramModes);
      }
    });
  }

  // Final fallback: If set is still empty, default to lowercase English letters + space
  if (!newSet || newSet.length === 0) {
    console.warn(
      "All modes resulted in an empty set. Defaulting to English lowercase characters + space.",
    );
    characterModes = {
      lowercase: true,
      uppercase: false,
      numbers: false,
      special: false,
    }; // Reset modes
    ngramModes = { n2gram: false, n3gram: false, n4gram: false, n5gram: false };
    ngramLength = 0;
    newSet = (config.englishLetters + " ").split("");
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

/**
 * Calculates the physical distance between two keys on the keyboard
 * @param {string} key1 - First key
 * @param {string} key2 - Second key
 * @param {string} language - Current keyboard language
 * @returns {number} - Distance score (higher = more distant)
 */
function calculateKeyDistance(key1, key2, language) {
  const layout =
    config.keyboardLayouts[language] || config.keyboardLayouts.english;

  // Find positions of keys in the layout
  let pos1 = null,
    pos2 = null;

  for (let row = 0; row < layout.length; row++) {
    for (let col = 0; col < layout[row].length; col++) {
      const key = layout[row][col].toLowerCase();
      if (key === key1.toLowerCase()) pos1 = { row, col };
      if (key === key2.toLowerCase()) pos2 = { row, col };
    }
  }

  if (!pos1 || !pos2) return Math.random() * 5; // Random distance for unknown keys

  // Calculate Manhattan distance with slight diagonal bias
  const rowDist = Math.abs(pos1.row - pos2.row);
  const colDist = Math.abs(pos1.col - pos2.col);
  return (
    rowDist + colDist + Math.sqrt(rowDist * rowDist + colDist * colDist) * 0.3
  );
}

/**
 * Gets performance score for a character (lower = worse performance, needs more practice)
 * @param {string} char - Character to evaluate
 * @returns {number} - Performance score (0-1, lower = needs more practice)
 */
function getCharacterPerformanceScore(char) {
  const charStat = stats.characterStats[char];
  if (!charStat || charStat.total === 0) {
    return 0; // No data = needs practice
  }

  const accuracy = charStat.correct / charStat.total;
  const medianTime = stats.getCharacterMedianTime(char) || 1000;

  // Normalize time (assume 200ms = good, 1000ms = poor)
  const timeScore = Math.max(0, Math.min(1, (1000 - medianTime) / 800));

  // Combine accuracy and speed
  return accuracy * 0.7 + timeScore * 0.3;
}

/**
 * Selects a smart target using weighted randomization
 * @returns {string} - Selected target character or n-gram
 */
function selectSmartTarget() {
  if (!currentCharacterSet || currentCharacterSet.length === 0) {
    return null;
  }

  // If we have less than 4 characters total, just avoid immediate repetition
  if (currentCharacterSet.length <= 4) {
    const available = currentCharacterSet.filter(
      (char) => char !== currentTarget,
    );
    return available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : currentCharacterSet[0];
  }

  // Filter out recent targets (last 4)
  const availableTargets = currentCharacterSet.filter(
    (char) => !recentTargets.includes(char),
  );

  // If all characters were recent, use the oldest ones
  const candidates =
    availableTargets.length > 0
      ? availableTargets
      : currentCharacterSet.filter(
          (char) => char !== recentTargets[recentTargets.length - 1],
        );

  if (candidates.length === 0) {
    return currentCharacterSet[
      Math.floor(Math.random() * currentCharacterSet.length)
    ];
  }

  // Calculate weights for each candidate
  const weights = candidates.map((char) => {
    let weight = 1.0;

    try {
      // 1. Distance bonus - prefer keys far from recent targets
      if (recentTargets.length > 0) {
        const avgDistance =
          recentTargets.reduce(
            (sum, recent) =>
              sum + calculateKeyDistance(char, recent, currentLanguage),
            0,
          ) / recentTargets.length;
        weight *= 1 + avgDistance * 0.2; // Reduced distance factor for stability
      }

      // 2. Performance bias - prefer characters with poor performance
      const perfScore = getCharacterPerformanceScore(char);
      weight *= 2 - perfScore; // Lower performance = higher weight

      // 3. Coverage bias - prefer less frequently asked characters this session
      const sessionCount = sessionTargetCount[char] || 0;
      const avgSessionCount =
        totalSessionTargets > 0
          ? totalSessionTargets / currentCharacterSet.length
          : 0;
      if (avgSessionCount > 0) {
        const relativeFrequency = sessionCount / avgSessionCount;
        weight *= 1 + Math.max(0, 1 - relativeFrequency); // Boost under-represented characters
      }

      // 4. Add randomization to prevent predictable patterns
      weight *= 0.7 + Math.random() * 0.6; // Random factor 0.7-1.3
    } catch (error) {
      console.warn("Error calculating weight for character:", char, error);
      weight = 1.0; // Safe fallback
    }

    return Math.max(0.1, weight); // Ensure minimum weight
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  let random = Math.random() * totalWeight;

  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return candidates[i];
    }
  }

  // Fallback
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Selects and displays a new target (character or n-gram). */
function setNewTarget() {
  if (currentCharacterSet && currentCharacterSet.length > 0) {
    currentTarget = selectSmartTarget();

    if (currentTarget) {
      // Update tracking
      recentTargets.push(currentTarget);
      if (recentTargets.length > 4) {
        recentTargets.shift(); // Keep only last 4
      }

      // Track coverage and session counts
      characterCoverage[currentTarget] = true;
      sessionTargetCount[currentTarget] =
        (sessionTargetCount[currentTarget] || 0) + 1;
      totalSessionTargets++;

      // Reset coverage periodically to ensure all characters get practice
      // Reset when we've covered all characters and made significant progress
      if (currentCharacterSet.length > 0) {
        const coveragePercent =
          Object.keys(characterCoverage).length / currentCharacterSet.length;
        if (
          coveragePercent >= 0.95 &&
          totalSessionTargets > currentCharacterSet.length * 2
        ) {
          console.log("Resetting character coverage for balanced practice");
          characterCoverage = {};
          // Don't reset sessionTargetCount to maintain statistics
          totalSessionTargets = 0;
        }
      }

      sequencePosition = 0; // Reset position for the new target
      // For mixed mode (ngramLength = -1), check actual target length
      const isNgram =
        ngramLength > 0 || (ngramLength === -1 && currentTarget.length > 1);
      ui.updateDisplayAndHighlight(
        currentTarget,
        sequencePosition,
        isNgram,
        config.keyMap,
      );
    } else {
      // Fallback to random selection
      currentTarget =
        currentCharacterSet[
          Math.floor(Math.random() * currentCharacterSet.length)
        ];
      sequencePosition = 0;
      const isNgram =
        ngramLength > 0 || (ngramLength === -1 && currentTarget.length > 1);
      ui.updateDisplayAndHighlight(
        currentTarget,
        sequencePosition,
        isNgram,
        config.keyMap,
      );
    }
  } else {
    // Handle empty training set (should be rare after fallbacks)
    currentTarget = "";
    sequencePosition = 0;
    ui.updateDisplayAndHighlight(null, 0, false, config.keyMap); // Show error/empty message
  }
}

/** Handles the keydown event for typing practice. */
function handleKeyDown(event) {
  try {
    // Input validation
    if (!event || !event.key) {
      console.error("Invalid event in handleKeyDown:", event);
      return;
    }

    // Ignore if focus is not on the body (e.g., on a button)
    if (event.target !== document.body) {
      // Allow space/enter to work on buttons
      if (
        (event.key === " " || event.key === "Enter") &&
        event.target.tagName === "BUTTON"
      ) {
        return;
      }
      // If focus is elsewhere, generally ignore typing input
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }
      // Allow keyboard navigation for buttons etc. (Tab, Shift+Tab, Arrows)
      if (
        ["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          event.key,
        )
      ) {
        return;
      }
    }

    // Ignore if modifier keys (Ctrl, Meta, Alt - excluding AltGr potentially) are pressed alone
    if (
      event.ctrlKey ||
      event.metaKey ||
      (event.altKey && !event.getModifierState("AltGraph"))
    ) {
      // Allow Ctrl+C, Ctrl+V etc. by checking if it's just the modifier
      if (["Control", "Meta", "Alt"].includes(event.key)) return;
    }
    // Ignore specific standalone modifier presses
    if (
      ["Shift", "CapsLock", "AltGraph", "Control", "Alt", "Meta"].includes(
        event.key,
      )
    )
      return;

    // Ignore function keys
    if (
      event.key.startsWith("F") &&
      event.key.length > 1 &&
      !isNaN(parseInt(event.key.substring(1)))
    )
      return;
    // Ignore other non-printable keys (check key length > 1 and not space/enter etc.)
    const nonPrintableKeys = [
      "Escape",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Insert",
      "Delete",
      "Pause",
      "ScrollLock",
      "NumLock",
      "PrintScreen",
    ];
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
    if (
      config.allPossibleCharacters.includes(keyPressed) ||
      ["Backspace", "Enter"].includes(event.key)
    ) {
      event.preventDefault();
    }

    // Start session timer on first valid printable input
    if (
      stats.sessionStartTime === 0 &&
      config.allPossibleCharacters.includes(keyPressed)
    ) {
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
    // Update coverage display if stats are visible
    ui.updateCoverageDisplay(
      characterCoverage,
      sessionTargetCount,
      currentCharacterSet,
    );
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
        ui.updateCoverageDisplay(
          characterCoverage,
          sessionTargetCount,
          currentCharacterSet,
        );
        setTimeout(setNewTarget, TIMING_CONSTANTS.NEW_TARGET_DELAY); // Delay slightly before showing next
      }
    } else {
      // Incorrect keypress
      ui.errorKeyAnimation(expectedChar, config.keyMap);
      ui.updateDetailedStatsDisplay(); // Update details on error too
      ui.updateCoverageDisplay(
        characterCoverage,
        sessionTargetCount,
        currentCharacterSet,
      );
      // Stay on the same character, allow user to correct
    }
  } catch (error) {
    console.error("Error in handleKeyDown:", error);
    ui.updateResultDisplay(false, 0, "Error");
  }
}

/** Handles clicks on mode toggle buttons. */
function handleModeToggle(mode) {
  try {
    // Input validation
    if (typeof mode !== "string" || mode.length === 0) {
      console.error("Invalid mode parameter in handleModeToggle:", mode);
      return;
    }

    const isNgramMode = mode.startsWith("n");
    const isCharMode = !isNgramMode;

    if (isNgramMode) {
      // Simply toggle the n-gram mode
      ngramModes[mode] = !ngramModes[mode];

      // If any n-gram mode is active, ensure we have characters to create n-grams from
      if (Object.values(ngramModes).some((v) => v)) {
        // If no character modes are active, enable lowercase by default
        if (!Object.values(characterModes).some((v) => v)) {
          characterModes.lowercase = true;
        }
      }
    } else if (isCharMode) {
      // Simply toggle the character mode
      characterModes[mode] = !characterModes[mode];
    }

    // Ensure at least one mode is active (either char mode or n-gram mode)
    const hasActiveCharMode = Object.values(characterModes).some((v) => v);
    const hasActiveNgramMode = Object.values(ngramModes).some((v) => v);

    if (!hasActiveCharMode && !hasActiveNgramMode) {
      // Default to lowercase if everything is toggled off
      characterModes.lowercase = true;
    }

    ui.updateModeButtonsActiveState(characterModes, ngramModes);
    updateTrainingSet(); // Update practice set based on new modes
  } catch (error) {
    console.error("Error in handleModeToggle:", error);
    // Restore to a safe state
    characterModes = {
      lowercase: true,
      uppercase: false,
      numbers: false,
      special: false,
    };
    ngramModes = { n2gram: false, n3gram: false, n4gram: false, n5gram: false };
    ui.updateModeButtonsActiveState(characterModes, ngramModes);
  }
}

/** Handles clicks on the language toggle button. */
function handleLanguageToggle() {
  try {
    currentLanguage = currentLanguage === "english" ? "russian" : "english";
    ui.updateLanguageButtonText(currentLanguage);
    ui.generateKeyboard(currentLanguage);
    updateTrainingSet(); // Update set (will handle n-gram availability and reset session)
  } catch (error) {
    console.error("Error in handleLanguageToggle:", error);
    // Restore to English if language switch fails
    currentLanguage = "english";
    ui.updateLanguageButtonText(currentLanguage);
    ui.generateKeyboard(currentLanguage);
  }
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

    // Initialize smart selection for current set
    if (currentCharacterSet && currentCharacterSet.length > 0) {
      currentCharacterSet.forEach((char) => {
        characterCoverage[char] = false;
        sessionTargetCount[char] = 0;
      });
    }

    // Attach event listeners
    document.addEventListener("keydown", handleKeyDown);
    ui.elements.toggleStatsButton.addEventListener(
      "click",
      ui.toggleStatsVisibility,
    );
    ui.elements.toggleLanguageButton.addEventListener(
      "click",
      handleLanguageToggle,
    );

    // Dark mode toggle
    const toggleThemeButton = document.getElementById("toggle-theme");
    if (toggleThemeButton) {
      toggleThemeButton.addEventListener("click", () => {
        try {
          const currentTheme =
            document.documentElement.getAttribute("data-theme");
          const newTheme = currentTheme === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", newTheme);
          localStorage.setItem("theme", newTheme);
          toggleThemeButton.textContent =
            newTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
        } catch (error) {
          console.error("Error toggling theme:", error);
        }
      });
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (toggleThemeButton) {
      toggleThemeButton.textContent =
        savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    }

    // Data management
    const exportButton = document.getElementById("export-data");
    const importButton = document.getElementById("import-data");
    const importFile = document.getElementById("import-file");

    exportButton.addEventListener("click", () => {
      try {
        // Disable button to prevent multiple rapid clicks
        exportButton.disabled = true;
        exportButton.textContent = "Exporting...";

        const success = stats.downloadTypingData();
        if (success) {
          ui.elements.resultDisplay.textContent = "Data exported successfully!";
          ui.elements.resultDisplay.style.color = "green";
          setTimeout(() => {
            if (ui.elements.resultDisplay) {
              ui.elements.resultDisplay.textContent = "";
              ui.elements.resultDisplay.style.color = "";
            }
          }, 3000);
        } else {
          throw new Error("Export failed");
        }
      } catch (error) {
        ui.elements.resultDisplay.textContent = "Failed to export data";
        ui.elements.resultDisplay.style.color = "red";
        console.error("Export error:", error);
      } finally {
        // Re-enable button
        setTimeout(() => {
          exportButton.disabled = false;
          exportButton.textContent = "📤 Export Data";
        }, 1000);
      }
    });

    importButton.addEventListener("click", () => {
      importFile.click();
    });

    importFile.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonContent = e.target.result;

            // Ask user about merge vs replace
            const shouldMerge = confirm(
              "Do you want to merge this data with your existing data?\n\n" +
                'Click "OK" to merge (combine with existing)\n' +
                'Click "Cancel" to replace (overwrite existing data)\n\n' +
                "Warning: Replacing will permanently delete your current progress!",
            );

            const success = stats.importTypingData(jsonContent, shouldMerge);

            if (success) {
              ui.elements.resultDisplay.textContent = shouldMerge
                ? "Data merged successfully!"
                : "Data imported successfully!";
              ui.elements.resultDisplay.style.color = "green";

              // Refresh displays
              ui.updateQuickStatsDisplay();
              ui.updateDetailedStatsDisplay();

              setTimeout(() => {
                ui.elements.resultDisplay.textContent = "";
                ui.elements.resultDisplay.style.color = "";
              }, 3000);
            } else {
              throw new Error("Import failed");
            }
          } catch (error) {
            ui.elements.resultDisplay.textContent =
              "Failed to import data - invalid file format";
            ui.elements.resultDisplay.style.color = "red";
            console.error("Import error:", error);
          }
        };
        reader.readAsText(file);
      }

      // Reset file input
      event.target.value = "";
    });

    // Initial UI updates
    ui.updateQuickStatsDisplay();
    ui.updateDetailedStatsDisplay(); // Will now use potentially loaded historical data

    // Ensure the initial target is displayed correctly, replacing "Loading..."
    if (currentTarget) {
      ui.updateDisplayAndHighlight(
        currentTarget,
        sequencePosition,
        ngramLength > 0,
        config.keyMap,
      );
    } else {
      // If updateTrainingSet resulted in empty set initially (shouldn't happen with fallbacks)
      ui.updateDisplayAndHighlight(null, 0, false, config.keyMap);
    }

    console.log("App Initialized Successfully.");
  } catch (error) {
    console.error("Error during app initialization:", error);
    if (ui.elements.characterDisplay) {
      ui.elements.characterDisplay.textContent = "Init Error!";
      ui.elements.characterDisplay.style.backgroundColor = "red";
      ui.elements.characterDisplay.style.color = "white";
    }
    // Prevent further execution potentially?
  }
}

// Start the app once the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp(); // DOM is already loaded
}
