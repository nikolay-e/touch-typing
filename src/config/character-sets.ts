import type { Language, PracticeMode } from '@/types'

const ENGLISH_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('')
const ENGLISH_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const RUSSIAN_LOWERCASE = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split('')
const RUSSIAN_UPPERCASE = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
const NUMBERS = '0123456789'.split('')
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~'.split('')

const ENGLISH_BIGRAMS = [
  'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd',
  'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar',
  'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le',
  've', 'co', 'me', 'de', 'hi', 'ri', 'ro', 'ic', 'ne', 'ea',
  'ra', 'ce', 'li', 'ch', 'be', 'll', 'ec', 'ma', 'si', 'om',
  'ur', 'ca', 'el', 'ta', 'la', 'pe', 'di', 'fo', 'ns', 'tr',
  'wh', 'us', 'ge', 'go', 'un', 'wa', 'wi', 'pr', 'no', 'nc',
]

const ENGLISH_TRIGRAMS = [
  'the', 'and', 'ing', 'ion', 'tio', 'ent', 'ati', 'for', 'her', 'ter',
  'hat', 'tha', 'ere', 'ate', 'his', 'con', 'res', 'ver', 'all', 'ons',
  'nce', 'men', 'ith', 'ted', 'ers', 'pro', 'thi', 'wit', 'are', 'ess',
  'not', 'ive', 'was', 'ect', 'rea', 'com', 'eve', 'per', 'int', 'est',
  'sta', 'cti', 'ica', 'ist', 'ear', 'ain', 'one', 'our', 'iti', 'rat',
  'out', 'str', 'ord', 'but', 'can', 'man', 'day', 'you', 'new', 'she',
]

const ENGLISH_TETRAGRAMS = [
  'tion', 'atio', 'that', 'ther', 'with', 'ment', 'ions', 'this', 'here', 'from',
  'ould', 'ting', 'hich', 'whic', 'ence', 'ough', 'ance', 'ious', 'able', 'ness',
  'ight', 'have', 'ered', 'once', 'even', 'ever', 'ally', 'ings', 'evel', 'ates',
  'them', 'ring', 'ding', 'self', 'part', 'esti', 'some', 'very', 'king', 'real',
  'land', 'late', 'last', 'such', 'over', 'into', 'most', 'also', 'will', 'just',
  'form', 'know', 'only', 'many', 'than', 'made', 'like', 'time', 'work', 'then',
]

const ENGLISH_PENTAGRAMS = [
  'ation', 'tions', 'which', 'ition', 'other', 'their', 'there', 'ments', 'about', 'would',
  'these', 'thing', 'ption', 'could', 'ering', 'ional', 'after', 'under', 'ative', 'ories',
  'first', 'being', 'efore', 'those', 'world', 'still', 'never', 'ction', 'iness', 'state',
  'ology', 'ement', 'ening', 'where', 'every', 'ising', 'ously', 'ading', 'uring', 'write',
  'might', 'great', 'since', 'order', 'point', 'found', 'house', 'again', 'right', 'cause',
  'years', 'small', 'sound', 'place', 'water', 'light', 'three', 'while', 'below', 'plant',
]

const RUSSIAN_BIGRAMS = [
  'ст', 'но', 'то', 'на', 'ен', 'ко', 'не', 'ет', 'ов', 'ро',
  'ра', 'во', 'по', 'ли', 'ни', 'ер', 'го', 'ре', 'ор', 'ол',
  'ос', 'ом', 'ть', 'от', 'ан', 'ло', 'те', 'пр', 'ка', 'ал',
  'ве', 'де', 'ль', 'од', 'та', 'ва', 'ск', 'ся', 'пе', 'че',
  'ми', 'ви', 'ас', 'же', 'уж', 'да', 'аз', 'ле', 'ис', 'ел',
]

const RUSSIAN_TRIGRAMS = [
  'ста', 'сто', 'ени', 'ого', 'ово', 'тор', 'ать', 'что', 'про', 'при',
  'ост', 'ние', 'ере', 'ров', 'ель', 'ром', 'оро', 'ком', 'тел', 'нов',
  'ном', 'пол', 'ала', 'ной', 'ред', 'ани', 'ело', 'ено', 'ков', 'ием',
  'вод', 'ист', 'нос', 'тов', 'лис', 'ные', 'ках', 'ици', 'оль', 'ник',
  'ник', 'тий', 'ому', 'ить', 'ный', 'ных', 'все', 'как', 'его', 'стр',
]

const RUSSIAN_TETRAGRAMS = [
  'ение', 'ного', 'того', 'ости', 'ател', 'кото', 'этот', 'пере', 'стор', 'ност',
  'ован', 'прод', 'ерес', 'ство', 'ельн', 'тель', 'тора', 'полн', 'торо', 'ожно',
  'ожно', 'рест', 'ольк', 'росс', 'пред', 'озмо', 'ьног', 'ения', 'кажд', 'дела',
  'ский', 'нием', 'иями', 'ской', 'торы', 'прои', 'чное', 'иеся', 'ется', 'ются',
  'ными', 'ских', 'ства', 'ческ', 'раст', 'подх', 'разв', 'боле', 'мене', 'ствен',
]

const RUSSIAN_PENTAGRAMS = [
  'котор', 'стран', 'после', 'между', 'перед', 'друго', 'начал', 'работ', 'также', 'время',
  'новые', 'свого', 'более', 'может', 'таких', 'очень', 'своей', 'людей', 'стать', 'годов',
  'таким', 'жизни', 'место', 'сегод', 'чтобы', 'нужно', 'каждо', 'любой', 'теперь', 'шение',
  'ество', 'ствия', 'тельн', 'чески', 'ением', 'ствен', 'рован', 'вания', 'сколь', 'только',
  'этого', 'часто', 'через', 'жизнь', 'назад', 'почти', 'тогда', 'зачем', 'здесь', 'нибудь',
]

const ENGLISH_HEXAGRAMS = [
  'ations', 'ration', 'tional', 'ection', 'nation', 'cation', 'lation', 'ention', 'sation', 'mation',
  'tering', 'dering', 'turing', 'lowing', 'osting', 'esting', 'isting', 'asting', 'usting', 'should',
  'though', 'before', 'theres', 'wheres', 'having', 'taking', 'making', 'coming', 'people', 'little',
  'number', 'member', 'someth', 'everyt', 'nothin', 'anythi', 'differ', 'system', 'proble', 'proces',
  'states', 'united', 'public', 'school', 'during', 'others', 'better', 'change', 'second', 'simple',
  'within', 'almost', 'always', 'father', 'mother', 'enough', 'follow', 'around', 'called', 'living',
]

const RUSSIAN_HEXAGRAMS = [
  'которы', 'страна', 'послед', 'между', 'переда', 'другой', 'начало', 'работа', 'также', 'времен',
  'новые', 'своего', 'более', 'может', 'таких', 'очень', 'своей', 'людей', 'стать', 'годов',
  'должен', 'только', 'потому', 'именно', 'однако', 'первый', 'второй', 'третий', 'против', 'вместе',
  'многих', 'ничего', 'сейчас', 'всегда', 'раньше', 'почему', 'откуда', 'словно', 'будто', 'словам',
  'тельно', 'ческие', 'ваниях', 'ование', 'ностью', 'ческих', 'ствует', 'ставит', 'ственн', 'дение',
  'чество', 'нибудь', 'сказал', 'просто', 'значит', 'совсем', 'больше', 'никого', 'зрения', 'сделал',
]

export function getCharacterSet(language: Language, modes: PracticeMode[]): string[] {
  const chars: string[] = []
  const isEnglish = language === 'english'

  for (const mode of modes) {
    switch (mode) {
      case 'lowercase':
        chars.push(...(isEnglish ? ENGLISH_LOWERCASE : RUSSIAN_LOWERCASE))
        break
      case 'uppercase':
        chars.push(...(isEnglish ? ENGLISH_UPPERCASE : RUSSIAN_UPPERCASE))
        break
      case 'numbers':
        chars.push(...NUMBERS)
        break
      case 'special':
        chars.push(...SPECIAL_CHARS)
        break
      case 'bigrams':
        chars.push(...(isEnglish ? ENGLISH_BIGRAMS : RUSSIAN_BIGRAMS))
        break
      case 'trigrams':
        chars.push(...(isEnglish ? ENGLISH_TRIGRAMS : RUSSIAN_TRIGRAMS))
        break
      case 'tetragrams':
        chars.push(...(isEnglish ? ENGLISH_TETRAGRAMS : RUSSIAN_TETRAGRAMS))
        break
      case 'pentagrams':
        chars.push(...(isEnglish ? ENGLISH_PENTAGRAMS : RUSSIAN_PENTAGRAMS))
        break
      case 'hexagrams':
        chars.push(...(isEnglish ? ENGLISH_HEXAGRAMS : RUSSIAN_HEXAGRAMS))
        break
      case 'text':
        return [generatePseudoText(language)]
    }
  }

  return chars.length > 0 ? chars : isEnglish ? ENGLISH_LOWERCASE : RUSSIAN_LOWERCASE
}

function generatePseudoWord(language: Language): string {
  const trigrams = language === 'english' ? ENGLISH_TRIGRAMS : RUSSIAN_TRIGRAMS
  const bigrams = language === 'english' ? ENGLISH_BIGRAMS : RUSSIAN_BIGRAMS

  const wordLength = 4 + Math.floor(Math.random() * 5)
  let word = trigrams[Math.floor(Math.random() * trigrams.length)] ?? ''

  while (word.length < wordLength) {
    const lastTwo = word.slice(-2)
    const matchingBigrams = bigrams.filter((b) => b[0] === lastTwo[1])
    if (matchingBigrams.length > 0) {
      const next = matchingBigrams[Math.floor(Math.random() * matchingBigrams.length)]
      word += next?.[1] ?? ''
    } else {
      const randomBigram = bigrams[Math.floor(Math.random() * bigrams.length)]
      word += randomBigram?.[1] ?? ''
    }
  }

  return word.slice(0, wordLength)
}

export function generatePseudoText(language: Language, wordCount = 8): string {
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(generatePseudoWord(language))
  }
  return words.join(' ')
}

export function findKeyCode(char: string, language: Language): string | null {
  const layouts = language === 'english'
    ? [
        { code: 'KeyQ', keys: ['q', 'Q'] }, { code: 'KeyW', keys: ['w', 'W'] },
        { code: 'KeyE', keys: ['e', 'E'] }, { code: 'KeyR', keys: ['r', 'R'] },
        { code: 'KeyT', keys: ['t', 'T'] }, { code: 'KeyY', keys: ['y', 'Y'] },
        { code: 'KeyU', keys: ['u', 'U'] }, { code: 'KeyI', keys: ['i', 'I'] },
        { code: 'KeyO', keys: ['o', 'O'] }, { code: 'KeyP', keys: ['p', 'P'] },
        { code: 'KeyA', keys: ['a', 'A'] }, { code: 'KeyS', keys: ['s', 'S'] },
        { code: 'KeyD', keys: ['d', 'D'] }, { code: 'KeyF', keys: ['f', 'F'] },
        { code: 'KeyG', keys: ['g', 'G'] }, { code: 'KeyH', keys: ['h', 'H'] },
        { code: 'KeyJ', keys: ['j', 'J'] }, { code: 'KeyK', keys: ['k', 'K'] },
        { code: 'KeyL', keys: ['l', 'L'] }, { code: 'KeyZ', keys: ['z', 'Z'] },
        { code: 'KeyX', keys: ['x', 'X'] }, { code: 'KeyC', keys: ['c', 'C'] },
        { code: 'KeyV', keys: ['v', 'V'] }, { code: 'KeyB', keys: ['b', 'B'] },
        { code: 'KeyN', keys: ['n', 'N'] }, { code: 'KeyM', keys: ['m', 'M'] },
        { code: 'Digit1', keys: ['1', '!'] }, { code: 'Digit2', keys: ['2', '@'] },
        { code: 'Digit3', keys: ['3', '#'] }, { code: 'Digit4', keys: ['4', '$'] },
        { code: 'Digit5', keys: ['5', '%'] }, { code: 'Digit6', keys: ['6', '^'] },
        { code: 'Digit7', keys: ['7', '&'] }, { code: 'Digit8', keys: ['8', '*'] },
        { code: 'Digit9', keys: ['9', '('] }, { code: 'Digit0', keys: ['0', ')'] },
        { code: 'Space', keys: [' '] },
      ]
    : [
        { code: 'Backquote', keys: ['ё', 'Ё'] },
        { code: 'KeyQ', keys: ['й', 'Й'] }, { code: 'KeyW', keys: ['ц', 'Ц'] },
        { code: 'KeyE', keys: ['у', 'У'] }, { code: 'KeyR', keys: ['к', 'К'] },
        { code: 'KeyT', keys: ['е', 'Е'] }, { code: 'KeyY', keys: ['н', 'Н'] },
        { code: 'KeyU', keys: ['г', 'Г'] }, { code: 'KeyI', keys: ['ш', 'Ш'] },
        { code: 'KeyO', keys: ['щ', 'Щ'] }, { code: 'KeyP', keys: ['з', 'З'] },
        { code: 'BracketLeft', keys: ['х', 'Х'] }, { code: 'BracketRight', keys: ['ъ', 'Ъ'] },
        { code: 'KeyA', keys: ['ф', 'Ф'] }, { code: 'KeyS', keys: ['ы', 'Ы'] },
        { code: 'KeyD', keys: ['в', 'В'] }, { code: 'KeyF', keys: ['а', 'А'] },
        { code: 'KeyG', keys: ['п', 'П'] }, { code: 'KeyH', keys: ['р', 'Р'] },
        { code: 'KeyJ', keys: ['о', 'О'] }, { code: 'KeyK', keys: ['л', 'Л'] },
        { code: 'KeyL', keys: ['д', 'Д'] }, { code: 'Semicolon', keys: ['ж', 'Ж'] },
        { code: 'Quote', keys: ['э', 'Э'] },
        { code: 'KeyZ', keys: ['я', 'Я'] }, { code: 'KeyX', keys: ['ч', 'Ч'] },
        { code: 'KeyC', keys: ['с', 'С'] }, { code: 'KeyV', keys: ['м', 'М'] },
        { code: 'KeyB', keys: ['и', 'И'] }, { code: 'KeyN', keys: ['т', 'Т'] },
        { code: 'KeyM', keys: ['ь', 'Ь'] }, { code: 'Comma', keys: ['б', 'Б'] },
        { code: 'Period', keys: ['ю', 'Ю'] },
        { code: 'Digit1', keys: ['1', '!'] }, { code: 'Digit2', keys: ['2', '"'] },
        { code: 'Digit3', keys: ['3', '№'] }, { code: 'Digit4', keys: ['4', ';'] },
        { code: 'Digit5', keys: ['5', '%'] }, { code: 'Digit6', keys: ['6', ':'] },
        { code: 'Digit7', keys: ['7', '?'] }, { code: 'Digit8', keys: ['8', '*'] },
        { code: 'Digit9', keys: ['9', '('] }, { code: 'Digit0', keys: ['0', ')'] },
        { code: 'Space', keys: [' '] },
      ]

  for (const { code, keys } of layouts) {
    if (keys.includes(char)) return code
  }
  return null
}

export function requiresShift(char: string): boolean {
  return /[A-ZА-ЯЁ!@#$%^&*()_+{}|:"<>?~]/.test(char)
}
