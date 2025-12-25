import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, PracticeMode } from '@/types'

interface SettingsState {
  language: Language
  activeModes: PracticeMode[]
  theme: 'light' | 'dark' | 'system'
  adaptiveLearning: boolean
  setLanguage: (language: Language) => void
  toggleMode: (mode: PracticeMode) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setAdaptiveLearning: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
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
