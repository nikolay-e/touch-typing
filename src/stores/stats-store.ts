import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterStats, SessionStats, Language, PracticeMode } from '@/types'

interface CharacterWeight {
  char: string
  weight: number
  accuracy: number
  avgTime: number
}

interface StatsState {
  sessionStartTime: number
  correctCount: number
  totalCount: number
  totalTime: number
  characters: Record<string, CharacterStats>
  sessions: SessionStats[]

  startSession: () => void
  recordKeypress: (char: string, correct: boolean, responseTime: number, typedChar?: string) => void
  endSession: (language: Language, mode: PracticeMode) => void
  resetSession: () => void
  getWpm: () => number
  getAccuracy: () => number
  getAverageTime: () => number
  getCharacterWeight: (char: string) => number
  getCharacterWeights: (chars: string[]) => CharacterWeight[]
  getConfusionPairs: (char: string) => string[]
  exportData: () => string
  importData: (json: string, merge: boolean) => boolean
  clearAllData: () => void
}

const STORAGE_KEY = 'touch-typing-stats'

function createEmptyCharStats(): CharacterStats {
  return { total: 0, correct: 0, incorrect: 0, totalTime: 0, confusedWith: {}, timingSamples: [] }
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      sessionStartTime: 0,
      correctCount: 0,
      totalCount: 0,
      totalTime: 0,
      characters: {},
      sessions: [],

      startSession: () =>
        set({ sessionStartTime: Date.now(), correctCount: 0, totalCount: 0, totalTime: 0 }),

      recordKeypress: (char, correct, responseTime, typedChar) => {
        set((state) => {
          const charStats = state.characters[char] ?? createEmptyCharStats()
          const newTimingSamples = [...charStats.timingSamples, responseTime].slice(-150)

          const updatedChar: CharacterStats = {
            ...charStats,
            total: charStats.total + 1,
            correct: charStats.correct + (correct ? 1 : 0),
            incorrect: charStats.incorrect + (correct ? 0 : 1),
            totalTime: charStats.totalTime + responseTime,
            timingSamples: newTimingSamples,
            confusedWith:
              !correct && typedChar
                ? {
                    ...charStats.confusedWith,
                    [typedChar]: (charStats.confusedWith[typedChar] ?? 0) + 1,
                  }
                : charStats.confusedWith,
          }

          return {
            correctCount: state.correctCount + (correct ? 1 : 0),
            totalCount: state.totalCount + 1,
            totalTime: state.totalTime + responseTime,
            characters: { ...state.characters, [char]: updatedChar },
          }
        })
      },

      endSession: (language, mode) => {
        const state = get()
        if (state.totalCount === 0) return

        const session: SessionStats = {
          id: crypto.randomUUID(),
          startTime: state.sessionStartTime,
          endTime: Date.now(),
          correctCount: state.correctCount,
          totalCount: state.totalCount,
          totalTime: state.totalTime,
          wpm: state.getWpm(),
          accuracy: state.getAccuracy(),
          practiceMode: mode,
          language,
        }

        set((s) => ({ sessions: [...s.sessions, session].slice(-100) }))
      },

      resetSession: () =>
        set({ sessionStartTime: 0, correctCount: 0, totalCount: 0, totalTime: 0 }),

      getWpm: () => {
        const { correctCount, sessionStartTime } = get()
        if (sessionStartTime === 0) return 0
        const elapsedMinutes = Math.max((Date.now() - sessionStartTime) / 60000, 0.005)
        return Math.round(correctCount / 5 / elapsedMinutes)
      },

      getAccuracy: () => {
        const { correctCount, totalCount } = get()
        if (totalCount === 0) return 100
        return Math.round((correctCount / totalCount) * 100)
      },

      getAverageTime: () => {
        const { totalTime, totalCount } = get()
        if (totalCount === 0) return 0
        return Math.round(totalTime / totalCount)
      },

      getCharacterWeight: (char: string) => {
        const stats = get().characters[char]
        if (!stats || stats.total < 3) return 1.0

        const accuracy = stats.correct / stats.total
        const errorRate = 1 - accuracy

        // Weight formula: higher weight = more practice needed
        // Base weight 1.0, increases with error rate (max 3x for 0% accuracy)
        return 1.0 + errorRate * 2.0
      },

      getCharacterWeights: (chars: string[]) => {
        const { characters } = get()
        const allTimes: number[] = []

        for (const char of chars) {
          const stats = characters[char]
          if (stats && stats.total > 0) {
            allTimes.push(stats.totalTime / stats.total)
          }
        }

        const avgTime =
          allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 200

        return chars.map((char) => {
          const stats = characters[char]
          if (!stats || stats.total < 3) {
            return { char, weight: 1.0, accuracy: 1.0, avgTime: 0 }
          }

          const accuracy = stats.correct / stats.total
          const charAvgTime = stats.totalTime / stats.total
          const errorRate = 1 - accuracy
          const slownessFactor = Math.max(0, (charAvgTime - avgTime) / avgTime)

          // Combined weight: 60% accuracy, 40% speed
          const weight = 1.0 + errorRate * 2.0 + slownessFactor * 0.5

          return { char, weight, accuracy, avgTime: charAvgTime }
        })
      },

      getConfusionPairs: (char: string) => {
        const stats = get().characters[char]
        if (!stats || Object.keys(stats.confusedWith).length === 0) return []

        return Object.entries(stats.confusedWith)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([confusedChar]) => confusedChar)
      },

      exportData: () => {
        const { characters, sessions } = get()
        return JSON.stringify(
          { version: '2.0.0', characters, sessions, exportedAt: new Date().toISOString() },
          null,
          2
        )
      },

      importData: (json, merge) => {
        try {
          const data = JSON.parse(json) as {
            characters?: Record<string, CharacterStats>
            sessions?: SessionStats[]
          }
          if (!data.characters && !data.sessions) return false

          if (merge) {
            set((state) => {
              const mergedChars = { ...state.characters }
              for (const [char, stats] of Object.entries(data.characters ?? {})) {
                const existing = mergedChars[char]
                if (existing) {
                  mergedChars[char] = {
                    total: existing.total + stats.total,
                    correct: existing.correct + stats.correct,
                    incorrect: existing.incorrect + stats.incorrect,
                    totalTime: existing.totalTime + stats.totalTime,
                    timingSamples: [...existing.timingSamples, ...stats.timingSamples].slice(-150),
                    confusedWith: { ...existing.confusedWith, ...stats.confusedWith },
                  }
                } else {
                  mergedChars[char] = stats
                }
              }
              return {
                characters: mergedChars,
                sessions: [...state.sessions, ...(data.sessions ?? [])].slice(-100),
              }
            })
          } else {
            set({ characters: data.characters ?? {}, sessions: data.sessions ?? [] })
          }
          return true
        } catch {
          return false
        }
      },

      clearAllData: () =>
        set({ characters: {}, sessions: [], correctCount: 0, totalCount: 0, totalTime: 0 }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ characters: state.characters, sessions: state.sessions }),
    }
  )
)
