// Error classification and messaging

export type ErrorType = 'drand_not_ready' | 'drand_timeout' | 'drand_network' | 'wallet_wrong' | 'wallet_rejected' | 'wallet_disconnected' | 'network_error' | 'data_invalid' | 'version_unsupported' | 'unknown';

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
}

// Prevents stack overflow
let _classifyDepth = 0;

export function classifyError(error: Error | string): ClassifiedError {
  try {
    // Guard against recursive calls
    if (_classifyDepth > 2) {
      return { type: 'unknown', message: 'Error classification failed', userMessage: 'Something went wrong. Try again.' };
    }

    _classifyDepth++;

    // Safely extract error message, handling objects without message property
    let msg: string;
    try {
      if (error instanceof Error) {
        msg = String(error.message);
      } else {
        msg = String(error);
      }
    } catch {
      msg = 'Unknown error';
    }

  // Drand errors
  if (msg.includes('round not yet available') || msg.includes('round not available')) {
    return {
      type: 'drand_not_ready',
      message: msg,
      userMessage: 'Capsule will unlock soon. Drand hasn\'t reached the time yet.',
    };
  }

  if (msg.includes('timed out')) {
    return { type: 'drand_timeout', message: msg, userMessage: 'Service is slow. Try again.' };
  }

  // Wallet errors
  if (msg.includes('original wallet') || msg.includes('wrong wallet')) {
    return { type: 'wallet_wrong', message: msg, userMessage: 'Use the same wallet that created this.' };
  }

  if (msg.includes('rejected') || msg.includes('user denied')) {
    return { type: 'wallet_rejected', message: msg, userMessage: 'User canceled authorization for this.' };
  }

  if (msg.includes('not connected') || msg.includes('wallet connection')) {
    return { type: 'wallet_disconnected', message: msg, userMessage: 'Wallet disconnected. Reconnect.' };
  }

  // Data errors
  if (msg.includes('time-locked until')) {
    return { type: 'drand_not_ready', message: msg, userMessage: msg };
  }

  if (msg.includes('malformed') || msg.includes('invalid') || msg.includes('corrupted')) {
    return { type: 'data_invalid', message: msg, userMessage: 'Capsule data is corrupted.' };
  }

  if (msg.includes('Unsupported capsule version')) {
    return { type: 'version_unsupported', message: msg, userMessage: 'Update the app to open this capsule.' };
  }

  // Network errors - distinguish between drand network errors and generic network errors
  if (msg.includes('drand') && (msg.includes('network') || msg.includes('CORS') || msg.includes('fetch'))) {
    return { type: 'drand_network', message: msg, userMessage: 'Network issue. Check connection.' };
  }

  if (msg.includes('Failed to fetch') || msg.includes('Unable to reach') || msg.includes('ERR_')) {
    return { type: 'network_error', message: msg, userMessage: 'Network error. Check connection.' };
  }

  if (msg.includes('network') || msg.includes('CORS')) {
    return { type: 'drand_network', message: msg, userMessage: 'Network issue. Check connection.' };
  }

  return {
    type: 'unknown',
    message: msg,
    userMessage: (msg && msg !== '[object Object]') ? msg : 'Something went wrong. Try again.',
  };
  } finally {
    _classifyDepth--;
  }
}
