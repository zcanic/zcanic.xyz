import toast from 'react-hot-toast';

/**
 * Custom hook to provide a simple interface for showing toast notifications.
 */
export function useToast() {
  /**
   * Displays a toast notification.
   *
   * @param {string} message The message to display.
   * @param {'success' | 'error' | 'info' | 'warning' | 'loading'} type The type of toast (determines icon and styling).
   * @param {object} options Additional options for react-hot-toast.
   */
  const addToast = (message, type = 'info', options = {}) => {
    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'loading':
        toast.loading(message, options);
        break;
      case 'info':
      case 'warning': // Use default toast for info/warning, maybe add custom icons later
      default:
        toast(message, { icon: type === 'warning' ? '⚠️' : 'ℹ️', ...options });
        break;
    }
  };

  // You can add other helper functions here if needed, e.g., dismissToast
  // const dismissToast = (toastId) => toast.dismiss(toastId);

  return { addToast };
} 