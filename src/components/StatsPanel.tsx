import { useStatsStore } from '@/stores/stats-store'

interface StatsPanelProps {
  showDetailed?: boolean
}

export function StatsPanel({ showDetailed = false }: StatsPanelProps) {
  const wpm = useStatsStore((s) => s.getWpm())
  const accuracy = useStatsStore((s) => s.getAccuracy())
  const avgTime = useStatsStore((s) => s.getAverageTime())
  const characters = useStatsStore((s) => s.characters)
  const sessions = useStatsStore((s) => s.sessions)

  const sortedChars = Object.entries(characters)
    .map(([char, stats]) => ({
      char,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      avgTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
      total: stats.total,
      confusedWith: Object.entries(stats.confusedWith)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([c]) => c)
        .join(', '),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{wpm}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">WPM</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{accuracy}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{avgTime}ms</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Time</div>
        </div>
      </div>

      {showDetailed && sortedChars.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">Character Statistics</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-3">Char</th>
                <th className="text-right py-2 px-3">Accuracy</th>
                <th className="text-right py-2 px-3">Avg Time</th>
                <th className="text-right py-2 px-3">Total</th>
                <th className="text-left py-2 px-3">Confused With</th>
              </tr>
            </thead>
            <tbody>
              {sortedChars
                .slice(0, 20)
                .map(({ char, accuracy: acc, avgTime: avg, total, confusedWith }) => (
                  <tr key={char} className="border-b dark:border-gray-800">
                    <td className="py-2 px-3 font-mono text-lg">{char}</td>
                    <td
                      className={`text-right py-2 px-3 ${acc < 80 ? 'text-red-500' : acc < 95 ? 'text-yellow-500' : 'text-green-500'}`}
                    >
                      {acc}%
                    </td>
                    <td className="text-right py-2 px-3">{avg}ms</td>
                    <td className="text-right py-2 px-3">{total}</td>
                    <td className="py-2 px-3 font-mono text-gray-500">{confusedWith || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailed && sessions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {sessions
              .slice(-5)
              .reverse()
              .map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-sm text-gray-500">
                    {new Date(session.startTime).toLocaleDateString()}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600 dark:text-blue-400">{session.wpm} WPM</span>
                    <span className="text-green-600 dark:text-green-400">{session.accuracy}%</span>
                    <span className="text-gray-500">{session.totalCount} keys</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
