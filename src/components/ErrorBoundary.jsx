import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    // Optional: Send error to a logging service like Sentry, LogRocket, etc.
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h1 className="text-lg font-bold mb-2">Oops! Something went wrong.</h1>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          {/* Optionally display error details during development */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-2 text-sm">
              <summary>Error Details (Development Only)</summary>
              <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-auto">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary; 