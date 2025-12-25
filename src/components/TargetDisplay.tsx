interface TargetDisplayProps {
  target: string
  position: number
  result: { correct: boolean; time: number } | null
}

export function TargetDisplay({ target, position, result }: TargetDisplayProps) {
  return (
    <div className="text-center space-y-4">
      <div
        className="text-6xl font-mono font-bold tracking-wider min-h-[80px] flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label={`Type: ${target}`}
      >
        {target.split('').map((char, i) => (
          <span
            key={i}
            className={`
              px-1 rounded transition-colors duration-150
              ${i < position ? 'text-green-500 dark:text-green-400' : ''}
              ${i === position ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}
              ${i > position ? 'text-gray-400 dark:text-gray-500' : ''}
            `}
          >
            {char}
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
