'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        // Last-resort recovery UI for client-only conversation failures.
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-destructive mb-3">
              Something went wrong
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              An error occurred while loading the conversation. Please try refreshing the page.
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-md mb-5 break-words max-h-24 overflow-y-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button variant="outline" onClick={() => { window.location.href = '/incidents'; }}>
                Return to Incidents
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Happy path: render the wrapped conversation subtree unchanged.
    return this.props.children;
  }
}
