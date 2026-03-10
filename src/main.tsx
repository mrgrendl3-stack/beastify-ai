
import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Fix: Use the imported Component class directly and include a standard constructor. 
// This ensures that 'this.props' and 'this.state' are correctly recognized as inherited 
// members by the TypeScript compiler, resolving the "Property 'props' does not exist" error.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', 
          width: '100vw', 
          backgroundColor: '#000', 
          color: '#fff', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{fontSize: '2rem', color: '#ff4444', marginBottom: '1rem'}}>⚠️ APP CRASHED</h1>
          <div style={{background: '#111', padding: '20px', borderRadius: '10px', maxWidth: '800px', overflow: 'auto', textAlign: 'left', border: '1px solid #333'}}>
            <p style={{fontFamily: 'monospace', color: '#f87171', margin: 0}}>
              {this.state.error?.message || "An unknown error occurred during rendering."}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px',
              padding: '12px 30px',
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '99px',
              fontWeight: '900',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error("Failed to find the root element");
} else {
    try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
          <React.StrictMode>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </React.StrictMode>
        );
    } catch (e) {
        console.error("Failed to mount application:", e);
        if (rootElement) {
            rootElement.innerHTML = `<div style="color:red; padding: 20px;">Failed to mount application. Check console.</div>`;
        }
    }
}
