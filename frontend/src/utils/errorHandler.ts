import { Alert } from 'react-native';

/**
 * Centralized API and runtime error handler to keep components DRY and clean.
 */
export const handleError = (error: any, defaultMessage: string = 'Something went wrong. Please try again.') => {
  // 1. Log the error for diagnostic purposes
  console.error('[API/Runtime Error]:', error);

  // 2. Extract detailed message if available
  let message = defaultMessage;
  if (error && typeof error === 'object') {
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  // 3. Display human-readable alert
  Alert.alert('Error', message, [{ text: 'OK' }]);
};
