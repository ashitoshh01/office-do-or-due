import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CompleteProfile() {
    const [companyName, setCompanyName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { completeProfile, currentUser } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await completeProfile(companyName, accessCode);
            navigate('/'); // App will redirect based on role
        } catch (err) {
            console.error(err);
            setError('Failed to setup profile: ' + err.message);
        }
        setLoading(false);
    }

    if (!currentUser) return null; // Should be protected by route anyway

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">Complete Setup</h2>
                <p className="text-center text-slate-500 mb-6">Welcome, {currentUser.displayName}! Please finalize your profile.</p>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Company Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Acme Corp"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">Ask your manager for the exact company name.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Access Code</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="Enter Company Code"
                        />
                        <p className="text-xs text-slate-500 mt-1">Required to verify your role and company.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Start Using App'}
                    </button>
                </form>
            </div>
        </div>
    );
}
