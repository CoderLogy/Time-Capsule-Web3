// Simple toast notifications

import { toast } from 'sonner';
import { classifyError } from './errors';

// Prevent recursive error handling
let _notifyingError = false;

// Show error toast with automatic classification
export function notifyError(error: Error | string): void {
  // Guard against recursive calls
  if (_notifyingError) {
    console.error('Recursive error notification prevented:', error);
    return;
  }

  try {
    _notifyingError = true;
    const classified = classifyError(error);

    try {
      switch (classified.type) {
        case 'drand_not_ready':
        case 'drand_timeout':
        case 'drand_network':
        case 'network_error':
          toast.warning(classified.userMessage);
          break;
        default:
          toast.error(classified.userMessage);
      }
    } catch (toastError) {
      // If toast library fails, fall back to console
      console.error('Toast notification failed:', toastError);
      console.error('Original error:', classified.userMessage);
    }
  } finally {
    _notifyingError = false;
  }
}


export function notifyCreationError(error: Error | string): void {
  try {
    const classified = classifyError(error);

    try {
      if (classified.type === 'wallet_rejected') {
        toast.warning('User canceled authorization for this.');
      } else if (classified.type === 'wallet_disconnected') {
        toast.error('Wallet disconnected.');
      } else if (classified.type === 'network_error') {
        toast.warning('Network issue.');
      } else {
        toast.error(classified.userMessage);
      }
    } catch (toastError) {
      console.error('Toast notification failed:', toastError);
    }
  } catch (classifyError_) {
    console.error('Failed to classify error:', classifyError_);
  }
}
