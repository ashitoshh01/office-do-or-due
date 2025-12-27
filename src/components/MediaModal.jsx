import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

export default function MediaModal({ url, type, onClose }) {
    if (!url) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] flex flex-col w-full">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
                    <h3 className="font-bold text-slate-800">Attachment Preview</h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Open in new tab"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <a
                            href={url}
                            download
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Download"
                        >
                            <Download size={20} />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
                    {type === 'link' ? (
                        <div className="text-center">
                            <p className="mb-4 text-slate-500">This is an external link.</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
                            >
                                <ExternalLink size={20} /> Open Link
                            </a>
                        </div>
                    ) : (
                        <img
                            src={url}
                            alt="Proof Attachment"
                            className="max-w-full max-h-[70vh] object-contain rounded shadow-sm border border-slate-200"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
