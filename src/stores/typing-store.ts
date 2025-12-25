import { create } from 'zustand'
import { getCharacterSet } from '@/config/character-sets'
import type { Language, PracticeMode } from '@/types'

interface TypingState {
  currentTarget: string
  sequencePosition: number
  lastKeyTime: number
  recentTargets: string[]

  initTarget: (language: Language, modes: PracticeMode[]) => void
  nextTarget: (language: Language, modes: PracticeMode[]) => void
  advanceSequence: () => boolean
  resetSequence: () => void
  setLastKeyTime: (time: number) => void
}

function selectSmartTarget(chars: string[], recentTargets: string[]): string {
  const candidates = chars.filter((c) => !recentTargets.includes(c))
  const pool = candidates.length > 0 ? candidates : chars
  return pool[Math.floor(Math.random() * pool.length)] ?? chars[0] ?? 'a'
}

export const useTypingStore = create<TypingState>()((set, get) => ({
  currentTarget: '',
  sequencePosition: 0,
  lastKeyTime: 0,
  recentTargets: [],

  initTarget: (language, modes) => {
    const chars = getCharacterSet(language, modes)
    const target = selectSmartTarget(chars, [])
    set({ currentTarget: target, sequencePosition: 0, recentTargets: [target] })
  },

  nextTarget: (language, modes) => {
    const chars = getCharacterSet(language, modes)
    const { recentTargets } = get()
    const target = selectSmartTarget(chars, recentTargets)
    const newRecent = [...recentTargets, target].slice(-4)
    set({ currentTarget: target, sequencePosition: 0, recentTargets: newRecent })
  },

  advanceSequence: () => {
    const { currentTarget, sequencePosition } = get()
    if (sequencePosition + 1 >= currentTarget.length) {
      return true
    }
    set({ sequencePosition: sequencePosition + 1 })
    return false
  },

  resetSequence: () => set({ sequencePosition: 0 }),

  setLastKeyTime: (time) => set({ lastKeyTime: time }),
}))
