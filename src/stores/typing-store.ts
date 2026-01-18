import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getCharacterSet } from '@/config/character-sets'
import { useStatsStore } from '@/stores/stats-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { Language, PracticeMode } from '@/types'

interface TypingState {
  currentTarget: string
  sequencePosition: number
  lastKeyTime: number
  recentTargets: string[]
}

interface TypingActions {
  initTarget: (language: Language, modes: PracticeMode[]) => void
  nextTarget: (language: Language, modes: PracticeMode[]) => void
  advanceSequence: () => boolean
  resetSequence: () => void
  setLastKeyTime: (time: number) => void
}

type TypingStore = TypingState & TypingActions

function selectWeightedRandom(items: { char: string; weight: number }[]): string {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item.char
    }
  }

  return items[0]?.char ?? 'a'
}

function selectSmartTarget(chars: string[], recentTargets: string[], useAdaptive: boolean): string {
  const candidates = chars.filter((c) => !recentTargets.includes(c))
  const pool = candidates.length > 0 ? candidates : chars

  if (!useAdaptive) {
    return pool[Math.floor(Math.random() * pool.length)] ?? chars[0] ?? 'a'
  }

  const statsStore = useStatsStore.getState()
  const weights = statsStore.getCharacterWeights(pool)

  // Add confusion pairs with extra weight
  const confusionBoost: { char: string; weight: number }[] = []
  for (const item of weights) {
    const confusedChars = statsStore.getConfusionPairs(item.char)
    for (const confused of confusedChars) {
      if (pool.includes(confused)) {
        confusionBoost.push({ char: confused, weight: 0.5 })
      }
    }
  }

  const allWeights = [...weights, ...confusionBoost]
  return selectWeightedRandom(allWeights)
}

export const useTypingStore = create<TypingStore>()(
  subscribeWithSelector((set, get) => ({
  currentTarget: '',
  sequencePosition: 0,
  lastKeyTime: 0,
  recentTargets: [],

  initTarget: (language, modes) => {
    const chars = getCharacterSet(language, modes)
    const adaptive = useSettingsStore.getState().adaptiveLearning
    const target = selectSmartTarget(chars, [], adaptive)
    set({ currentTarget: target, sequencePosition: 0, recentTargets: [target] })
  },

  nextTarget: (language, modes) => {
    const chars = getCharacterSet(language, modes)
    const { recentTargets } = get()
    const adaptive = useSettingsStore.getState().adaptiveLearning
    const target = selectSmartTarget(chars, recentTargets, adaptive)
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
)

export const useCurrentTarget = () => useTypingStore((s) => s.currentTarget)
export const useSequencePosition = () => useTypingStore((s) => s.sequencePosition)
export const useLastKeyTime = () => useTypingStore((s) => s.lastKeyTime)
export const useRecentTargets = () => useTypingStore((s) => s.recentTargets)
export const useCurrentChar = () =>
  useTypingStore((s) => s.currentTarget[s.sequencePosition] ?? '')
export const useIsSequenceComplete = () =>
  useTypingStore((s) => s.sequencePosition >= s.currentTarget.length)
