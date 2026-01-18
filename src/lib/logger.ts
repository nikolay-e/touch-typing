type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

interface LogContext {
  [key: string]: unknown
}

interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error | unknown, context?: LogContext): void
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

const VALID_LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent']

function isValidLogLevel(level: unknown): level is LogLevel {
  return typeof level === 'string' && VALID_LOG_LEVELS.includes(level as LogLevel)
}

function detectEnvironment(): { isDev: boolean; logLevel: LogLevel } {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const env = import.meta.env as Record<string, unknown>
    const isDev = env.DEV === true || env.MODE === 'development'
    const envLevel: unknown = env.VITE_LOG_LEVEL
    if (isValidLogLevel(envLevel)) {
      return { isDev, logLevel: envLevel }
    }
    return { isDev, logLevel: isDev ? 'debug' : 'error' }
  }

  return { isDev: false, logLevel: 'error' }
}

const environment = detectEnvironment()

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = environment.logLevel
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel]
}

function formatMessage(namespace: string, message: string): string {
  return `[${namespace}] ${message}`
}

function formatErrorMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return String(error)
}

export function createLogger(namespace: string): Logger {
  return {
    debug(message: string, context?: LogContext): void {
      if (shouldLog('debug')) {
        const formatted = formatMessage(namespace, message)
        if (context) {
          console.debug(formatted, context)
        } else {
          console.debug(formatted)
        }
      }
    },

    info(message: string, context?: LogContext): void {
      if (shouldLog('info')) {
        const formatted = formatMessage(namespace, message)
        if (context) {
          console.info(formatted, context)
        } else {
          console.info(formatted)
        }
      }
    },

    warn(message: string, context?: LogContext): void {
      if (shouldLog('warn')) {
        const formatted = formatMessage(namespace, message)
        if (context) {
          console.warn(formatted, context)
        } else {
          console.warn(formatted)
        }
      }
    },

    error(message: string, error?: Error | unknown, context?: LogContext): void {
      if (shouldLog('error')) {
        const formatted = formatMessage(namespace, message)
        const errorMsg = error ? formatErrorMessage(error) : undefined

        if (errorMsg && context) {
          console.error(formatted, errorMsg, context)
        } else if (errorMsg) {
          console.error(formatted, errorMsg)
        } else if (context) {
          console.error(formatted, context)
        } else {
          console.error(formatted)
        }
      }
    },
  }
}

export const log = {
  typing: createLogger('Typing'),
  stats: createLogger('Stats'),
  settings: createLogger('Settings'),
  keyboard: createLogger('Keyboard'),
}

export type { Logger, LogContext, LogLevel }
