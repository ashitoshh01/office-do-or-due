import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export default function MediaModal({ url, type, onClose }) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handler functions (using useCallback for stable references)
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 25, 300));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 25, 50));
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoom(100);
        setRotation(0);
    }, []);

    const handleRotate = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    // Keyboard shortcuts and ESC key handler
    useEffect(() => {
        const handleKeyPress = (e) => {
            // ESC to close
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Only apply shortcuts if not a link
            if (type === 'link') return;

            // Zoom shortcuts
            if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleZoomIn();
            }
            if ((e.key === '-' || e.key === '_') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleZoomOut();
            }
            if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleResetZoom();
            }

            // Rotation (R key)
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleRotate();
            }

            // Fullscreen (F key)
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [onClose, type, handleZoomIn, handleZoomOut, handleResetZoom, handleRotate, toggleFullscreen]);

    // Mouse wheel zoom
    useEffect(() => {
        if (type === 'link') return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    handleZoomIn();
                } else {
                    handleZoomOut();
                }
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [type, zoom, handleZoomIn, handleZoomOut]);

    if (!url) return null;

    return (
        <div
            onClick={handleBackdropClick}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200 ${isFullscreen ? 'p-0' : ''}`}
        >
            <div className={`relative bg-white rounded-lg shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl max-h-[90vh] w-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-200 shrink-0 bg-white z-10">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span>Attachment Preview</span>
                        {type !== 'link' && (
                            <span className="text-xs font-normal text-slate-500">
                                {zoom}%
                            </span>
                        )}
                    </h3>

                    {/* Controls */}
                    <div className="flex items-center gap-1">
                        {type !== 'link' && (
                            <>
                                {/* Zoom Controls */}
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 50}
                                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Zoom Out (Ctrl + -)"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button
                                    onClick={handleResetZoom}
                                    className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Reset Zoom"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 300}
                                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Zoom In (Ctrl + +)"
                                >
                                    <ZoomIn size={18} />
                                </button>

                                {/* Rotate */}
                                <div className="w-px h-6 bg-slate-300 mx-1"></div>
                                <button
                                    onClick={handleRotate}
                                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Rotate 90°"
                                >
                                    <RotateCw size={18} />
                                </button>
                            </>
                        )}

                        {/* Fullscreen */}
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Toggle Fullscreen (F)"
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>

                        {/* External Link & Download */}
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Open in new tab"
                        >
                            <ExternalLink size={18} />
                        </a>
                        <a
                            href={url}
                            download
                            className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download"
                        >
                            <Download size={18} />
                        </a>

                        {/* Close */}
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Close (ESC)"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center min-h-[300px]">
                    {type === 'link' ? (
                        <div className="text-center">
                            <div className="mb-4 p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
                                <ExternalLink size={48} className="text-blue-500 mx-auto mb-4" />
                                <p className="text-slate-600 mb-2 font-medium">This is an external link</p>
                                <p className="text-xs text-slate-400 mb-4 break-all max-w-md">{url}</p>
                            </div>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30 active:scale-95"
                            >
                                <ExternalLink size={20} /> Open Link
                            </a>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={url}
                                alt="Proof Attachment"
                                style={{
                                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.3s ease',
                                    maxWidth: isFullscreen ? '100vw' : '80vw',
                                    maxHeight: isFullscreen ? '90vh' : '70vh',
                                }}
                                className="object-contain rounded shadow-2xl border border-slate-300"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {type !== 'link' && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-500">
                            💡 <span className="font-semibold">Shortcuts:</span> Ctrl+Scroll to zoom • R to rotate • F for fullscreen • ESC to close • Click outside to close
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
