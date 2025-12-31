import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Building2, ArrowRight, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SelectCompany() {
    const [companyInput, setCompanyInput] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);
    const navigate = useNavigate();
    const { currentUser, userProfile, loading } = useAuth();

    // Auto-Redirect if Logged In
    useEffect(() => {
        if (!loading && currentUser && userProfile) {
            // Redirect to their specific dashboard
            navigate(`/${userProfile.companyId}/${userProfile.role}`);
        }
    }, [currentUser, userProfile, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!companyInput.trim()) return;

        const slug = companyInput.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        setChecking(true);
        setError('');

        try {
            // Check if company exists
            const docRef = doc(db, "companies", slug);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                navigate(`/${slug}/login`);
            } else {
                setError(`Workspace '${slug}' not found. Please check the name.`);
            }
        } catch (err) {
            console.error("Firestore Error:", err);
            setError(`Connection Error: ${err.message}`);
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-blue-600 shadow-blue-200 shadow-lg">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Find Your Workspace</h1>
                    <p className="text-slate-500 mt-2 text-sm">Enter your company name or ID to log in.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            required
                            placeholder="e.g. acme-corp"
                            value={companyInput}
                            onChange={(e) => setCompanyInput(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={checking}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-wait transition-all"
                    >
                        {checking ? 'Locating...' : (
                            <>
                                Continue to Login <ArrowRight size={16} className="ml-2" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                    <p className="text-xs text-slate-400">
                        Don't have a workspace? <a href="#" className="text-blue-600 hover:underline">Contact Sales</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
