import { useEffect, useState } from 'react'
import { getKeyboardLayout } from '@/config/keyboard-layouts'
import { findKeyCode, requiresShift } from '@/config/character-sets'
import type { Language } from '@/types'

interface KeyboardProps {
  language: Language
  targetChar: string
  pressedCode: string | null
  isError: boolean
}

export function Keyboard({ language, targetChar, pressedCode, isError }: KeyboardProps) {
  const layout = getKeyboardLayout(language)
  const [animatingKey, setAnimatingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const targetCode = targetChar ? findKeyCode(targetChar[0] ?? '', language) : null
  const needsShift = targetChar ? requiresShift(targetChar[0] ?? '') : false

  useEffect(() => {
    if (pressedCode) {
      setAnimatingKey(pressedCode)
      const timer = setTimeout(() => setAnimatingKey(null), 100)
      return () => clearTimeout(timer)
    }
  }, [pressedCode])

  useEffect(() => {
    if (isError && pressedCode) {
      setErrorKey(pressedCode)
      const timer = setTimeout(() => setErrorKey(null), 300)
      return () => clearTimeout(timer)
    }
  }, [isError, pressedCode])

  return (
    <div className="flex flex-col gap-1 p-4 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl mx-auto">
      {layout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 justify-center">
          {row.map((key) => {
            const isTarget = key.code === targetCode
            const isShiftTarget = needsShift && (key.code === 'ShiftLeft' || key.code === 'ShiftRight')
            const isPressed = key.code === animatingKey
            const isErrorShake = key.code === errorKey

            const widthClass = key.width
              ? `min-w-[${Math.round(key.width * 40)}px]`
              : 'min-w-[40px]'

            const widthStyle = key.width ? { minWidth: `${key.width * 40}px` } : {}

            return (
              <button
                key={key.code}
                type="button"
                tabIndex={-1}
                style={widthStyle}
                className={`
                  h-10 px-2 rounded-md text-sm font-medium transition-all duration-100
                  flex items-center justify-center select-none
                  ${widthClass}
                  ${isTarget || isShiftTarget
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }
                  ${isPressed ? 'animate-press bg-blue-500 text-white' : ''}
                  ${isErrorShake ? 'animate-shake bg-red-500 text-white' : ''}
                  hover:brightness-95 dark:hover:brightness-110
                `}
              >
                {key.shiftKey ? (
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] opacity-60">{key.shiftKey}</span>
                    <span>{key.key}</span>
                  </span>
                ) : (
                  key.key
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
