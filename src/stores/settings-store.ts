import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type { Language, PracticeMode } from '@/types'

interface SettingsState {
  language: Language
  activeModes: PracticeMode[]
  theme: 'light' | 'dark' | 'system'
  adaptiveLearning: boolean
}

interface SettingsActions {
  setLanguage: (language: Language) => void
  toggleMode: (mode: PracticeMode) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setAdaptiveLearning: (enabled: boolean) => void
}

type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
      language: 'english',
      activeModes: ['lowercase'],
      theme: 'system',
      adaptiveLearning: true,

      setLanguage: (language) => set({ language }),

      toggleMode: (mode) =>
        set((state) => {
          const modes = state.activeModes.includes(mode)
            ? state.activeModes.filter((m) => m !== mode)
            : [...state.activeModes, mode]
          return { activeModes: modes.length > 0 ? modes : ['lowercase'] }
        }),

      setTheme: (theme) => {
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
        set({ theme })
      },

      setAdaptiveLearning: (enabled) => set({ adaptiveLearning: enabled }),
      }),
      {
        name: 'touch-typing-settings',
        partialize: (state) => ({
          language: state.language,
          activeModes: state.activeModes,
          theme: state.theme,
          adaptiveLearning: state.adaptiveLearning,
        }),
      }
    )
  )
)

export const useLanguage = () => useSettingsStore((s) => s.language)
export const useActiveModes = () => useSettingsStore((s) => s.activeModes)
export const useTheme = () => useSettingsStore((s) => s.theme)
export const useAdaptiveLearning = () => useSettingsStore((s) => s.adaptiveLearning)
export const useIsModeActive = (mode: PracticeMode) =>
  useSettingsStore((s) => s.activeModes.includes(mode))
