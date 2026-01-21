import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

/**
 * 🔥 ERROR BOUNDARY - Production Grade
 * Catches React errors and displays a user-friendly error page
 * Prevents the entire app from crashing
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            </div>
            
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {this.state.error && (
              <details className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-red-600 text-xs overflow-auto max-h-40 font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition"
            >
              Go Home
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Error ID: {Date.now()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
