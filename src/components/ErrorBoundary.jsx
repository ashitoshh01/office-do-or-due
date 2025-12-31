import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg text-center h-full">
                    <AlertTriangle size={32} className="text-red-500 mb-2" />
                    <h3 className="text-sm font-bold text-red-700">Something went wrong</h3>
                    <p className="text-xs text-red-600 mb-4 max-w-xs">{this.state.error?.message || "An unexpected error occurred."}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
