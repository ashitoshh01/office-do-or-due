import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import createSuperAdmin from '../utils/createSuperAdmin';

export default function SetupPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleSetup() {
        try {
            setLoading(true);
            setError('');
            setMessage('Creating Super Admin account...');

            await createSuperAdmin();

            setMessage('Super Admin account created successfully! Redirecting to login...');

            setTimeout(() => {
                navigate('/primecommerce/admin/login');
            }, 2000);
        } catch (err) {
            setError(err.message);
            setMessage('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Setup Super Admin</h1>
                <p className="text-slate-600 mb-6">
                    Click the button below to create the Super Admin account for Prime Commerce.
                </p>

                <div className="bg-slate-100 rounded-md p-4 mb-6">
                    <p className="text-sm font-medium text-slate-700">Account Details:</p>
                    <p className="text-sm text-slate-600 mt-2">
                        <strong>Email:</strong> superadmin@primecommerce.com
                    </p>
                    <p className="text-sm text-slate-600">
                        <strong>Password:</strong> vvvvvvvv
                    </p>
                </div>

                {message && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSetup}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Create Super Admin Account'}
                </button>

                <p className="text-xs text-slate-500 mt-4 text-center">
                    This is a one-time setup. If the account already exists, you can log in directly.
                </p>
            </div>
        </div>
    );
}
