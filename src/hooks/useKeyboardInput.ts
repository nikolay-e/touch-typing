import { useEffect, useCallback, useState } from 'react'

interface KeyboardInputResult {
  pressedCode: string | null
  pressedKey: string | null
}

export function useKeyboardInput(onKeyPress: (key: string, code: string) => void): KeyboardInputResult {
  const [pressedCode, setPressedCode] = useState<string | null>(null)
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.target !== document.body) return
      if (event.ctrlKey || event.altKey || event.metaKey) return
      if (event.key.length !== 1 && event.key !== ' ' && event.key !== 'Shift') return

      event.preventDefault()

      if (event.key.length === 1 || event.key === ' ') {
        setPressedCode(event.code)
        setPressedKey(event.key)
        onKeyPress(event.key, event.code)

        setTimeout(() => {
          setPressedCode(null)
          setPressedKey(null)
        }, 100)
      }
    },
    [onKeyPress]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { pressedCode, pressedKey }
}
