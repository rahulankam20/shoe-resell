import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0a', color: '#fff', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '480px', border: '1px solid rgba(255,255,255,0.15)', padding: '2rem', borderRadius: '12px', background: 'rgba(20,20,20,0.8)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: '#ff4d23' }}>SOLEVAULT ENCOUNTERED AN ISSUE</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected error occurred while starting the application.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#ff4d23', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
