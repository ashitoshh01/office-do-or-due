import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import ManagerChat from './manager/ManagerChat';
import ErrorBoundary from './ErrorBoundary';

export default function ChatModal({ isOpen, onClose, employeeId, employeeName, isEmployeeView = false }) {
    // ESC key handler
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Modal Header */}
                <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-md z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-full">
                            <MessageSquare size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">
                                {isEmployeeView ? "Chat with Manager" : `Chat with ${employeeName}`}
                            </h3>
                            <p className="text-[10px] text-indigo-100 opacity-80">
                                {isEmployeeView ? "Ask questions or request help" : "Direct messaging"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Content */}
                <div className="h-[500px] bg-slate-50 relative">
                    <ErrorBoundary>
                        <ManagerChat
                            key={employeeId} // Force remount on change
                            employeeId={employeeId}
                            employeeName={employeeName}
                        />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
}
