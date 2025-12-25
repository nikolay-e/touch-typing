import { useRef } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { useStatsStore } from '@/stores/stats-store'

interface SettingsBarProps {
  onToggleStats: () => void
  showStats: boolean
}

export function SettingsBar({ onToggleStats, showStats }: SettingsBarProps) {
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const adaptiveLearning = useSettingsStore((s) => s.adaptiveLearning)
  const setAdaptiveLearning = useSettingsStore((s) => s.setAdaptiveLearning)
  const exportData = useStatsStore((s) => s.exportData)
  const importData = useStatsStore((s) => s.importData)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `typing-stats-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result as string
      const success = importData(json, true)
      if (!success) {
        alert('Failed to import data. Invalid format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]!
    setTheme(nextTheme)
  }

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'

  return (
    <div className="flex flex-wrap gap-3 justify-center items-center">
      <button
        onClick={() => setLanguage(language === 'english' ? 'russian' : 'english')}
        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
        aria-label={`Switch to ${language === 'english' ? 'Russian' : 'English'}`}
      >
        {language === 'english' ? '🇬🇧 EN' : '🇷🇺 RU'}
      </button>

      <button
        onClick={onToggleStats}
        className={`
          px-4 py-2 rounded-lg transition-colors font-medium
          ${
            showStats
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }
        `}
        aria-pressed={showStats}
      >
        📊 Stats
      </button>

      <button
        onClick={cycleTheme}
        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label={`Current theme: ${theme}. Click to change.`}
      >
        {themeIcon}
      </button>

      <button
        onClick={() => setAdaptiveLearning(!adaptiveLearning)}
        className={`
          px-4 py-2 rounded-lg transition-colors font-medium
          ${
            adaptiveLearning
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }
        `}
        aria-pressed={adaptiveLearning}
        title="Adaptive learning focuses on characters you struggle with"
      >
        🎯 Adaptive
      </button>

      <button
        onClick={handleExport}
        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Export statistics"
      >
        📤 Export
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Import statistics"
      >
        📥 Import
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  )
}
