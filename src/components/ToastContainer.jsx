import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext'; // Import theme context

function ToastContainer() {
  const { isDarkMode } = useTheme();

  return (
    <Toaster
      position="top-right" // Position toasts at the top-right corner
      reverseOrder={false} // Show newer toasts below older ones
      gutter={8} // Spacing between toasts
      containerClassName="" // Optional: Add custom classes to the container
      containerStyle={{}} // Optional: Add custom inline styles to the container
      toastOptions={{
        // Define default options
        className: '',
        duration: 5000, // Default duration: 5 seconds
        style: {
          background: isDarkMode ? '#374151' : '#ffffff', // Use theme colors
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },

        // Default options for specific types
        success: {
          duration: 3000,
          theme: {
            primary: 'green',
            secondary: 'black',
          },
          iconTheme: {
            primary: isDarkMode ? '#10B981' : '#059669', // Tailwind green-500 / green-600
            secondary: 'white',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: isDarkMode ? '#EF4444' : '#DC2626', // Tailwind red-500 / red-600
            secondary: 'white',
          },
        },
      }}
    />
  );
}

export default ToastContainer; 