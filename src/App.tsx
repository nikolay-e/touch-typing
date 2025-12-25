import { useEffect, useState, useCallback } from 'react'
import { Keyboard } from '@/components/Keyboard'
import { TargetDisplay } from '@/components/TargetDisplay'
import { TextDisplay } from '@/components/TextDisplay'
import { StatsPanel } from '@/components/StatsPanel'
import { ModeSelector } from '@/components/ModeSelector'
import { SettingsBar } from '@/components/SettingsBar'
import { useKeyboardInput } from '@/hooks/useKeyboardInput'
import { useSettingsStore } from '@/stores/settings-store'
import { useTypingStore } from '@/stores/typing-store'
import { useStatsStore } from '@/stores/stats-store'

const NEW_TARGET_DELAY = 80

export default function App() {
  const language = useSettingsStore((s) => s.language)
  const activeModes = useSettingsStore((s) => s.activeModes)
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const currentTarget = useTypingStore((s) => s.currentTarget)
  const sequencePosition = useTypingStore((s) => s.sequencePosition)
  const lastKeyTime = useTypingStore((s) => s.lastKeyTime)
  const initTarget = useTypingStore((s) => s.initTarget)
  const nextTarget = useTypingStore((s) => s.nextTarget)
  const advanceSequence = useTypingStore((s) => s.advanceSequence)
  const setLastKeyTime = useTypingStore((s) => s.setLastKeyTime)

  const sessionStartTime = useStatsStore((s) => s.sessionStartTime)
  const startSession = useStatsStore((s) => s.startSession)
  const recordKeypress = useStatsStore((s) => s.recordKeypress)

  const [showStats, setShowStats] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; time: number } | null>(null)
  const [isError, setIsError] = useState(false)

  const isTextMode = activeModes.includes('text')

  useEffect(() => {
    setTheme(theme)
  }, [])

  useEffect(() => {
    initTarget(language, activeModes)
  }, [language, activeModes, initTarget])

  const handleKeyPress = useCallback(
    (key: string, _code: string) => {
      const now = performance.now()
      const responseTime = lastKeyTime > 0 ? Math.round(now - lastKeyTime) : 0

      if (sessionStartTime === 0) {
        startSession()
      }

      const expectedChar = currentTarget[sequencePosition]
      const isCorrect = key === expectedChar

      if (expectedChar) {
        recordKeypress(expectedChar, isCorrect, responseTime, isCorrect ? undefined : key)
      }

      setResult({ correct: isCorrect, time: responseTime })
      setIsError(!isCorrect)

      if (isCorrect) {
        const completed = advanceSequence()
        if (completed) {
          setTimeout(() => {
            nextTarget(language, activeModes)
            setResult(null)
          }, NEW_TARGET_DELAY)
        }
      }

      setLastKeyTime(now)

      setTimeout(() => setIsError(false), 300)
    },
    [
      currentTarget,
      sequencePosition,
      lastKeyTime,
      sessionStartTime,
      language,
      activeModes,
      startSession,
      recordKeypress,
      advanceSequence,
      nextTarget,
      setLastKeyTime,
    ]
  )

  const { pressedCode } = useKeyboardInput(handleKeyPress)

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Touch Typing Practice
        </h1>
      </header>

      <main id="main" className="flex-1 container mx-auto px-4 pb-8 space-y-8 max-w-4xl">
        {isTextMode ? (
          <TextDisplay
            text={currentTarget}
            position={sequencePosition}
            result={result}
          />
        ) : (
          <TargetDisplay
            target={currentTarget}
            position={sequencePosition}
            result={result}
          />
        )}

        <StatsPanel />

        <ModeSelector />

        <SettingsBar
          showStats={showStats}
          onToggleStats={() => setShowStats((s) => !s)}
        />

        <Keyboard
          language={language}
          targetChar={currentTarget[sequencePosition] ?? ''}
          pressedCode={pressedCode}
          isError={isError}
        />

        {showStats && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <StatsPanel showDetailed />
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        v2.1.0
      </footer>
    </div>
  )
}
