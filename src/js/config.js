// src/js/config.js

// --- Timing Constants ---
export const TIMING_CONSTANTS = {
    MIN_WPM_ELAPSED_TIME: 0.005, // minutes - minimum elapsed time before calculating WPM
    NEW_TARGET_DELAY: 80, // ms - delay before showing next character/n-gram
    KEY_ANIMATION_DURATION: 100, // ms - duration of key press animation
    ERROR_SHAKE_DURATION: 300, // ms - duration of error shake animation
    RESULT_COLOR_RESET_DELAY: 600, // ms - delay before resetting result display color
    DEBOUNCE_SAVE_DELAY: 1000, // ms - delay for debounced localStorage save
};

// --- Statistical Constants ---
export const STATS_CONSTANTS = {
    OUTLIER_LOWER_PERCENTILE: 25, // Discard times below 25th percentile
    OUTLIER_UPPER_PERCENTILE: 75, // Discard times above 75th percentile
    MIN_SAMPLES_FOR_OUTLIER_DETECTION: 10, // Minimum samples before applying outlier detection
    MAX_REASONABLE_TIME: 10000, // ms - maximum reasonable time for any keypress
    MIN_REASONABLE_TIME: 50, // ms - minimum reasonable time for any keypress
};

// --- Display Constants ---
export const DISPLAY_CONSTANTS = {
    WPM_WORD_LENGTH: 5, // characters - standard word length for WPM calculation
    MIN_LETTER_DISPLAY_HEIGHT: 80, // px - minimum height for letter display
    MIN_LETTER_DISPLAY_HEIGHT_MOBILE: 60, // px - minimum height on mobile
    MIN_LETTER_DISPLAY_HEIGHT_SMALL: 50, // px - minimum height on very small devices
};

// --- Keyboard Constants ---
export const KEYBOARD_CONSTANTS = {
    MIN_KEY_WIDTH: 40, // px - minimum width for regular keys
    MIN_KEY_HEIGHT: 40, // px - minimum height for regular keys
    MIN_KEY_WIDTH_MOBILE: 26, // px - minimum width on mobile
    MIN_KEY_HEIGHT_MOBILE: 26, // px - minimum height on mobile
    SPACE_KEY_WIDTH_RATIO: 6.25, // ratio to regular key width
};

// --- Character Sets ---
export const englishLetters = 'abcdefghijklmnopqrstuvwxyz';
export const russianLetters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
export const numbers = '0123456789';
export const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`'; // Full set
export const standardSpecialChars = '`1234567890-=[]\\;\',./'; // Chars typically typed without Shift
export const shiftSpecialCharsEng = '~!@#$%^&*()_+{}|:"<>?'; // Chars typically typed with Shift (US layout)

// --- Frequent English N-grams (Source: Norvig/Google Books Analysis) ---
//

export const frequentDigraphsEng = [ // Top 50
    'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of',
    'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 've', 'co',
    'me', 'de', 'hi', 'ri', 'ro', 'ic', 'ne', 'ea', 'ra', 'ce', 'li', 'ch', 'll', 'be', 'ma',
    'si', 'om', 'ur'
];
export const frequentTrigraphsEng = [ // Top 49 unique
    'the', 'and', 'ing', 'ion', 'tio', 'ent', 'ati', 'for', 'her', 'ter', 'tha', 'ere', 'ate',
    'his', 'con', 'res', 'ver', 'all', 'ons', 'nce', 'men', 'ith', 'ted', 'ers', 'pro', 'thi',
    'wit', 'are', 'ess', 'not', 'ive', 'was', 'ect', 'rea', 'com', 'eve', 'per', 'int', 'est',
    'sta', 'cti', 'ica', 'ist', 'ear', 'ain', 'one', 'our', 'iti', 'rat'
];
export const frequentTetragraphsEng = [ // Top 40
    'tion', 'atio', 'that', 'ther', 'with', 'ment', 'ions', 'this', 'here', 'ould', 'ting',
    'hich', 'ence', 'have', 'ical', 'they', 'inte', 'ough', 'ance', 'were', 'tive', 'over',
    'ding', 'pres', 'nter', 'able', 'heir', 'thei', 'ally', 'ring', 'ture', 'cont', 'ents',
    'rati', 'thin', 'part', 'form', 'ning', 'ecti', 'cons'
];
export const frequentPentagraphsEng = [ // Top 49
    'ation', 'tions', 'which', 'other', 'there', 'cation', 'lation', 'ional', 'ratio', 'these',
    'state', 'natio', 'thing', 'under', 'ssion', 'count', 'ments', 'rough', 'ative', 'prese',
    'feren', 'tiona', 'genera', 'dition', 'though', 'inter', 'would', 'their', 'about', 'where',
    'follow', 'posit', 'produ', 'becaus', 'etween', 'throug', 'chang', 'publi', 'direc', 'bility',
    'effec', 'first', 'after', 'evelop', 'uction', 'commu', 'relat', 'speci', 'agains'
];

// --- Russian N-grams (Examples, frequencies might not be exact) ---
export const frequentDigraphsRus = [ // Top 30 (example)
    'ст', 'но', 'то', 'на', 'ен', 'ов', 'ни', 'ра', 'во', 'ко', 'по', 'ро', 'ли', 'го', 'ег',
    'ло', 'да', 'ме', 'ри', 'пр', 'не', 'ка', 'ла', 'ал', 'та', 'ет', 'ти', 'ки', 'со', 'ль'
];
// NEW: Add Russian Trigrams, Tetragrams, Pentagrams
export const frequentTrigraphsRus = [ // ~Top 30 (example)
    'сто', 'ого', 'ени', 'сти', 'ско', 'ова', 'ние', 'ест', 'ает', 'ост', 'ров', 'еск', 'оль',
    'ств', 'ать', 'раз', 'ело', 'тел', 'ест', 'тов', 'оро', 'пре', 'ему', 'ста', 'ска', 'ово',
    'ист', 'пол', 'про'
];
export const frequentTetragraphsRus = [ // ~Top 30 (example)
    'ство', 'ости', 'ского', 'ение', 'тель', 'ость', 'ован', 'ствен', 'ност', 'рован',
    'ельно', 'атель', 'ность', 'ания', 'ового', 'ества', 'овать', 'ество', 'ственн',
    'ально', 'еская', 'еский', 'олько', 'оторы', 'оторый', 'ожет', 'ожет ', 'ослед', 'ательн'
];
export const frequentPentagraphsRus = [ // ~Top 30 (example)
    'ственн', 'ательн', 'ование', 'тельно', 'ственно', 'ость ', 'ельность', 'ованный',
    'который', 'ательст', 'ественн', 'ости ', 'оследни', 'тельст', 'особенн', 'ального',
    'определ', 'равлени', 'ринима', 'оответ', 'еятельн', 'авление', 'ользова', 'развити',
    'овершен', 'азвитие', 'оваться', 'оличест', 'риняти'
];
// --- Combined Character Set (for input validation) ---
export const allPossibleCharacters = englishLetters + englishLetters.toUpperCase() +
                                     russianLetters + russianLetters.toUpperCase() +
                                     numbers + specialChars + ' ';

// --- Keyboard Layouts ---
export const keyboardLayouts = {
    english: [
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['ShiftLeft', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'ShiftRight'],
        ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ControlRight']
    ],
    russian: [
        ['ё', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ', '\\'],
        ['CapsLock', 'ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э', 'Enter'],
        ['ShiftLeft', 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.', 'ShiftRight'],
        ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ControlRight']
    ]
};

// --- Key Mapping (event.code/event.key to data-key) ---
// Prioritizes event.code for non-alpha keys for layout independence
export const keyMap = {
    'Space': 'Space', 'Enter': 'Enter', 'Tab': 'Tab', 'Backspace': 'Backspace',
    'ShiftLeft': 'ShiftLeft', 'ShiftRight': 'ShiftRight',
    'ControlLeft': 'ControlLeft', 'ControlRight': 'ControlRight',
    'AltLeft': 'AltLeft', 'AltRight': 'AltRight',
    'MetaLeft': 'MetaLeft', 'MetaRight': 'MetaRight', // Win/Cmd
    'CapsLock': 'CapsLock',
    'Backquote': '`', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
    'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
    'Minus': '-', 'Equal': '=', 'BracketLeft': '[', 'BracketRight': ']', 'Backslash': '\\',
    'Semicolon': ';', 'Quote': "'", 'Comma': ',', 'Period': '.', 'Slash': '/',
    // Letter keys (map code to lowercase letter for data-key consistency)
    'KeyQ': 'q', 'KeyW': 'w', 'KeyE': 'e', 'KeyR': 'r', 'KeyT': 't', 'KeyY': 'y', 'KeyU': 'u',
    'KeyI': 'i', 'KeyO': 'o', 'KeyP': 'p', 'KeyA': 'a', 'KeyS': 's', 'KeyD': 'd', 'KeyF': 'f',
    'KeyG': 'g', 'KeyH': 'h', 'KeyJ': 'j', 'KeyK': 'k', 'KeyL': 'l', 'KeyZ': 'z', 'KeyX': 'x',
    'KeyC': 'c', 'KeyV': 'v', 'KeyB': 'b', 'KeyN': 'n', 'KeyM': 'm',
     // Fallback using event.key (less reliable for different layouts/languages)
     ' ': 'Space', 'Control': 'ControlLeft', 'Alt': 'AltLeft', 'Shift': 'ShiftLeft', 'Meta': 'MetaLeft',
     '\\': '\\', '[': '[', ']': ']', ';': ';', "'": "'", ',': ',', '.': '.', '/': '/', '`': '`',
     '-': '-', '=': '=',
};