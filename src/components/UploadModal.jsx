import React, { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';

const UploadModal = ({ onClose, onUpload }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'
    const [linkUrl, setLinkUrl] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUpload({ type: 'file', data: e.target.files[0] });
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
            onUpload({ type: 'file', data: e.dataTransfer.files[0] });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        Upload Proof
                    </h3>
                    <div className="flex bg-slate-100 rounded p-0.5 mx-4">
                        <button
                            onClick={() => setUploadMode('file')}
                            className={`text-xs px-3 py-1 rounded transition-colors font-medium ${uploadMode === 'file' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Upload File
                        </button>
                        <button
                            onClick={() => setUploadMode('link')}
                            className={`text-xs px-3 py-1 rounded transition-colors font-medium ${uploadMode === 'link' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Paste Link
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    {uploadMode === 'file' ? (
                        <div
                            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
                                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-12 h-12 mx-auto mb-4 text-slate-400">
                                <Upload size={48} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-base font-semibold text-slate-900 mb-2">
                                Drop your proof here
                            </h4>
                            <p className="text-sm text-slate-500 mb-4">
                                or <span className="text-blue-600 font-semibold">click to browse</span>
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,application/pdf"
                            />
                            <p className="text-xs text-slate-400 mt-4">Max 700KB</p>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-slate-600 mb-4">Paste a publicly accessible link (Google Drive, Dropbox, etc.)</p>
                            <input
                                type="url"
                                placeholder="https://..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                            <button
                                onClick={() => {
                                    if (linkUrl) onUpload({ type: 'link', data: linkUrl });
                                }}
                                disabled={!linkUrl}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Submit Link
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default UploadModal;
