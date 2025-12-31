import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, Check, File, Link as LinkIcon, AlertCircle } from 'lucide-react';

const UploadModal = ({ onClose, onUpload, uploading: externalUploading }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'
    const [linkUrl, setLinkUrl] = useState('');
    const [internalUploading, setInternalUploading] = useState(false);
    const uploading = externalUploading || internalUploading;

    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    // Initial animation effect
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const simulateUpload = (data, type) => {
        setInternalUploading(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        onUpload({ type, data });
                        // Don't close immediately to show 100% success state briefly if needed
                        // But typically we might wait for parent to handle it.
                        // For now we'll assume parent handles closing or state update.
                    }, 500);
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 300);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndUpload(e.target.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndUpload(e.dataTransfer.files[0]);
        }
    };

    const validateAndUpload = (file) => {
        // Firestore has 1MB document limit. Base64 encoding increases size by ~33%.
        // Safe limit: 700KB to ensure encoded data fits within 1MB limit
        const MAX_SIZE = 700 * 1024; // 700KB
        if (file.size > MAX_SIZE) {
            setError(`File size exceeds ${(MAX_SIZE / 1024).toFixed(0)}KB limit. Please use a smaller file.`);
            return;
        }
        setError(null);
        simulateUpload(file, 'file');
    };

    const handleLinkSubmit = () => {
        if (!linkUrl) return;
        setInternalUploading(true);
        // Simulate quick verify
        setTimeout(() => {
            onUpload({ type: 'link', data: linkUrl });
        }, 1000);
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200); // Wait for exit animation
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => { if (e.target === e.currentTarget && !uploading) handleClose(); }}
        >
            <div
                ref={modalRef}
                className={`bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-display">
                        Upload Proof
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={uploading && !error}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                {!uploading && (
                    <div className="flex px-6 pt-6 gap-4">
                        <button
                            onClick={() => setUploadMode('file')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${uploadMode === 'file'
                                ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                        >
                            Upload File
                        </button>
                        <button
                            onClick={() => setUploadMode('link')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${uploadMode === 'link'
                                ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                        >
                            Paste Link
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6">
                    {uploading ? (
                        <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 mx-auto mb-6 relative">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        className="text-slate-100"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        className="text-blue-600 transition-all duration-300 ease-out"
                                        strokeDasharray={175.9}
                                        strokeDashoffset={175.9 - (progress / 100) * 175.9}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-700">
                                    {Math.round(progress)}%
                                </div>
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-2">Uploading Proof...</h4>
                            <p className="text-slate-500 text-sm">Please wait while we secure your file.</p>
                        </div>
                    ) : (
                        <>
                            {uploadMode === 'file' ? (
                                <div
                                    className={`relative group border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden
                                        ${dragActive
                                            ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                                            : 'border-slate-300 bg-slate-50/30 hover:border-slate-400 hover:bg-slate-50 hover:shadow-inner'}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-blue-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">
                                        <Upload size={28} strokeWidth={2} />
                                    </div>
                                    <h4 className="text-base font-semibold text-slate-800 mb-2">
                                        Drop your proof here
                                    </h4>
                                    <p className="text-sm text-slate-500 mb-6 max-w-[200px] mx-auto">
                                        <span className="text-blue-600 font-medium hover:underline">Click to browse</span> or drag and drop your file
                                    </p>

                                    {error && (
                                        <div className="mx-auto max-w-xs flex items-center justify-center gap-2 text-red-500 text-xs bg-red-50 py-2 px-3 rounded-lg mb-4 animate-bounce">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-medium uppercase tracking-wide">
                                        <span className="bg-slate-100 px-2 py-1 rounded">PDF</span>
                                        <span className="bg-slate-100 px-2 py-1 rounded">JPG</span>
                                        <span className="bg-slate-100 px-2 py-1 rounded">PNG</span>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                                            <LinkIcon size={16} className="text-blue-500" />
                                            Paste a public link (Drive, Dropbox, etc.)
                                        </p>
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={handleLinkSubmit}
                                        disabled={!linkUrl}
                                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                                    >
                                        Submit Proof Link
                                        <Check size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer hint */}
                {!uploading && uploadMode === 'file' && (
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">Max file size: 700KB • Secure transmission</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadModal;
