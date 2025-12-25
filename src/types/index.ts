export type Language = 'english' | 'russian'

export type PracticeMode =
  | 'lowercase'
  | 'uppercase'
  | 'numbers'
  | 'special'
  | 'bigrams'
  | 'trigrams'
  | 'tetragrams'
  | 'pentagrams'

export interface CharacterStats {
  total: number
  correct: number
  incorrect: number
  totalTime: number
  confusedWith: Record<string, number>
  timingSamples: number[]
}

export interface SessionStats {
  id: string
  startTime: number
  endTime: number
  correctCount: number
  totalCount: number
  totalTime: number
  wpm: number
  accuracy: number
  practiceMode: PracticeMode
  language: Language
}

export interface TypingData {
  version: string
  statistics: {
    characters: Record<string, CharacterStats>
    sessions: SessionStats[]
  }
  settings: {
    language: Language
    activeModes: PracticeMode[]
    theme: 'light' | 'dark' | 'system'
  }
}

export interface KeyLayout {
  code: string
  key: string
  shiftKey?: string
  width?: number
}

export type KeyboardRow = KeyLayout[]
