import { useSettingsStore } from '@/stores/settings-store'
import type { PracticeMode } from '@/types'

const MODES: { id: PracticeMode; label: string; group: 'chars' | 'ngrams' | 'text' }[] = [
  { id: 'lowercase', label: 'a-z', group: 'chars' },
  { id: 'uppercase', label: 'A-Z', group: 'chars' },
  { id: 'numbers', label: '0-9', group: 'chars' },
  { id: 'special', label: '!@#', group: 'chars' },
  { id: 'bigrams', label: '2-gram', group: 'ngrams' },
  { id: 'trigrams', label: '3-gram', group: 'ngrams' },
  { id: 'tetragrams', label: '4-gram', group: 'ngrams' },
  { id: 'pentagrams', label: '5-gram', group: 'ngrams' },
  { id: 'hexagrams', label: '6-gram', group: 'ngrams' },
  { id: 'text', label: 'Text', group: 'text' },
]

export function ModeSelector() {
  const activeModes = useSettingsStore((s) => s.activeModes)
  const toggleMode = useSettingsStore((s) => s.toggleMode)

  const charModes = MODES.filter((m) => m.group === 'chars')
  const ngramModes = MODES.filter((m) => m.group === 'ngrams')
  const textModes = MODES.filter((m) => m.group === 'text')

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2 justify-center"
        role="group"
        aria-label="Character modes"
      >
        {charModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => toggleMode(mode.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeModes.includes(mode.id)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
            aria-pressed={activeModes.includes(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="N-gram modes">
        {ngramModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => toggleMode(mode.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeModes.includes(mode.id)
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
            aria-pressed={activeModes.includes(mode.id)}
          >
            {mode.label}
          </button>
        ))}
        {textModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => toggleMode(mode.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeModes.includes(mode.id)
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
            aria-pressed={activeModes.includes(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  )
}
