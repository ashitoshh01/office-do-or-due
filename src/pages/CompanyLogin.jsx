import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function CompanyLogin() {
    const { companyId } = useParams(); // "bmw"
    const [companyName, setCompanyName] = useState(companyId); // Fallback to ID until loaded
    const [loadingCompany, setLoadingCompany] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const { login, userProfile, currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // 1. Fetch Company Details on Mount
    useEffect(() => {
        async function fetchCompany() {
            try {
                const docRef = doc(db, "companies", companyId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCompanyName(docSnap.data().name);
                } else {
                    setError("Company not found.");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCompany(false);
            }
        }
        fetchCompany();
    }, [companyId]);

    // 2. Watch for Auth Changes to Redirect or Reject
    useEffect(() => {
        if (currentUser && userProfile) {
            // Check if user belongs to this company
            // standardizing IDs to compare (e.g. "bmw" vs "BMW" -> slug check usually better but let's assume loose match or userProfile.companyId is slug)
            // Ideally userProfile.companyId is the slug we stored.

            if (userProfile.companyId === companyId) {
                // Success! Redirect to dashboard
                // Determine role dashboard
                if (userProfile.role === 'manager') {
                    navigate(`/${companyId}/manager/dashboard`);
                } else {
                    navigate(`/${companyId}/dashboard`);
                }
            } else {
                // Wrong company
                setError(`Access Denied. You are a member of '${userProfile.companyName}', not '${companyName}'.`);
                // Optional: Logout immediately so they can try again? 
                // Let's logout so they aren't stuck in "Logged in but wrong place" limbo
                logout();
            }
        }
    }, [currentUser, userProfile, companyId, navigate, logout, companyName]);


    async function handleSubmit(e) {
        e.preventDefault();
        setLoggingIn(true);
        setError('');
        try {
            await login(email, password, companyId);
            // Effect above will handle redirect
        } catch (err) {
            console.error(err);
            setError('Failed to log in: ' + err.message);
            setLoggingIn(false);
        }
    }

    if (loadingCompany) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading Workspace...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border-t-4 border-blue-600">

                <div className="text-center mb-6">
                    <div className="mx-auto bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-2 text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Login to {companyName}</h2>
                    <p className="text-sm text-slate-400 mt-1">Workspace ID: {companyId}</p>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loggingIn}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loggingIn ? 'Authenticating...' : 'Sign In'}
                    </button>


                </form>

                <div className="mt-6 text-center text-sm border-t border-slate-100 pt-4 space-y-2">
                    <p>
                        <Link to={`/${companyId}/signup`} className="text-blue-600 font-semibold hover:text-blue-700">
                            Have a License Key? Activate Account
                        </Link>
                    </p>
                    <Link to="/select-company" className="text-slate-400 hover:text-slate-600 text-xs block">
                        ← Switch Workspace
                    </Link>
                </div>
            </div>
        </div>
    );
}
