export interface AppError {
  title: string
  message: string
  recoverable: boolean
}

export function createStorageError(operation: 'load' | 'save'): AppError {
  return {
    title: 'Storage error',
    message:
      operation === 'load'
        ? 'Unable to load your saved data. Your progress may have been reset.'
        : 'Unable to save your data. Please check your browser storage settings.',
    recoverable: true,
  }
}

export function createImportError(reason: string): AppError {
  return {
    title: 'Import failed',
    message: `Unable to import data: ${reason}`,
    recoverable: true,
  }
}

export function createExportError(): AppError {
  return {
    title: 'Export failed',
    message: 'Unable to export your data. Please try again.',
    recoverable: true,
  }
}

export function mapError(error: unknown): AppError {
  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') {
      return {
        title: 'Storage full',
        message: 'Your browser storage is full. Please clear some data and try again.',
        recoverable: true,
      }
    }

    if (error.message.includes('JSON')) {
      return {
        title: 'Data format error',
        message: 'The data format is invalid. Please check your import file.',
        recoverable: true,
      }
    }
  }

  return {
    title: 'Unexpected error',
    message: 'An unexpected error occurred. Please refresh the page.',
    recoverable: false,
  }
}
