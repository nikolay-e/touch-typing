// src/js/config.js

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