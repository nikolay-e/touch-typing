import { useMemo } from 'react'

interface TextDisplayProps {
  text: string
  position: number
  result: { correct: boolean; time: number } | null
}

export function TextDisplay({ text, position, result }: TextDisplayProps) {
  const progress = text.length > 0 ? Math.round((position / text.length) * 100) : 0

  const wordsWithOffsets = useMemo(() => {
    const words = text.split(' ')
    return words.reduce<{ word: string; start: number }[]>((acc, word, idx) => {
      const start = idx === 0 ? 0 : acc[idx - 1]!.start + acc[idx - 1]!.word.length + 1
      acc.push({ word, start })
      return acc
    }, [])
  }, [text])

  return (
    <div className="text-center space-y-4">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div
        className="text-2xl font-mono leading-relaxed min-h-[120px] p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex flex-wrap justify-center gap-x-3 gap-y-2"
        role="status"
        aria-live="polite"
      >
        {wordsWithOffsets.map(({ word, start: wordStart }, wordIdx) => (
          <span
            key={wordIdx}
            className={`
              px-2 py-1 rounded transition-colors duration-100
              ${
                position >= wordStart && position < wordStart + word.length
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : ''
              }
            `}
          >
            {word.split('').map((char, charIdx) => {
              const absoluteIdx = wordStart + charIdx
              const isTyped = absoluteIdx < position
              const isCurrent = absoluteIdx === position

              return (
                <span
                  key={charIdx}
                  className={`
                    ${isTyped ? 'text-green-600 dark:text-green-400' : ''}
                    ${isCurrent ? 'bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-gray-100 px-0.5 rounded' : ''}
                    ${!isTyped && !isCurrent ? 'text-gray-500 dark:text-gray-400' : ''}
                  `}
                >
                  {char}
                </span>
              )
            })}
          </span>
        ))}
      </div>

      <div
        className={`
          h-8 text-lg font-medium transition-opacity duration-200
          ${result ? 'opacity-100' : 'opacity-0'}
        `}
        role="status"
        aria-live="polite"
      >
        {result?.correct ? (
          <span className="text-green-600 dark:text-green-400">Correct! ({result.time}ms)</span>
        ) : result ? (
          <span className="text-red-600 dark:text-red-400">Incorrect</span>
        ) : null}
      </div>
    </div>
  )
}
