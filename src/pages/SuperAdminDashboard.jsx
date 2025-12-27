import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { Building2, Key, Users, Activity, Trash2, Plus, Copy, Check, UserPlus, LogOut } from 'lucide-react';
import { CompanyService } from '../services/CompanyService';
import JoinRequestService from '../services/JoinRequestService';

export default function SuperAdminDashboard() {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();

    // Companies State
    const [companies, setCompanies] = useState([]);
    const [companiesLoading, setCompaniesLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    // Requests State
    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    // Auth Protection
    useEffect(() => {
        if (userProfile && !userProfile.isSuperAdmin) {
            navigate('/');
        }
    }, [userProfile, navigate]);

    useEffect(() => {
        // Only fetch if authenticated as super admin
        if (userProfile?.isSuperAdmin) {
            fetchCompanies();
            loadRequests();
        }
    }, [userProfile]);

    // --- Companies Logic ---
    const fetchCompanies = async () => {
        setCompaniesLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "companies"));
            const companiesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCompanies(companiesData);
        } catch (error) {
            console.error("Error fetching companies:", error);
            setStatusMsg('Error fetching companies.');
        } finally {
            setCompaniesLoading(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        if (!newCompanyName.trim()) return;

        setCreating(true);
        setStatusMsg('');

        try {
            const newCompany = await CompanyService.createCompany(newCompanyName);
            setCompanies([...companies, newCompany]);
            setNewCompanyName('');
            setStatusMsg(`Success! Created ${newCompany.name}`);
        } catch (error) {
            console.error("Error creating company:", error);
            setStatusMsg(`Error: ${error.message}`);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm(`Are you sure you want to delete ${companyId}? This cannot be undone.`)) return;

        try {
            await deleteDoc(doc(db, "companies", companyId));
            setCompanies(companies.filter(c => c.id !== companyId));
            setStatusMsg(`Deleted ${companyId}`);
        } catch (error) {
            console.error("Error deleting company:", error);
            setStatusMsg(`Error: ${error.message}`);
        }
    };

    // --- Join Requests Logic ---
    async function loadRequests() {
        try {
            setRequestsLoading(true);
            const pendingRequests = await JoinRequestService.getPendingRequestsForApprover('superadmin@primecommerce.com');
            const adminRequests = pendingRequests.filter(req => req.roleRequested === 'ADMIN');
            setRequests(adminRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setRequestsLoading(false);
        }
    }

    async function handleApprove(request) {
        try {
            setProcessing(request.id);
            let userId = request.uid;

            // Legacy support for requests without UID
            if (!userId) {
                try {
                    const tempPassword = generateRandomPassword();
                    const userCredential = await createUserWithEmailAndPassword(auth, request.email, tempPassword);
                    userId = userCredential.user.uid;
                    await sendPasswordResetEmail(auth, request.email);
                    alert(`Legacy request approved! Password reset sent to ${request.email}`);
                } catch (err) {
                    if (err.code === 'auth/email-already-in-use') {
                        throw new Error("User email already exists but request has no UID. Please reject and ask user to sign up again.");
                    }
                    throw err;
                }
            }

            // Create Company/User Profile
            // Assuming 'primecommerce' as the default parent company for superadmins/admins in this context?
            // The Original Code hardcoded 'primecommerce'. We'll stick to that strictly to avoid breaking logic.
            const userRef = doc(db, 'companies', 'primecommerce', 'users', userId);
            const userData = {
                uid: userId,
                name: request.name,
                email: request.email,
                role: 'admin',
                companyId: 'primecommerce',
                companyName: 'Prime Commerce',
                status: 'admin',
                isActive: true,
                createdAt: new Date().toISOString()
            };

            await setDoc(userRef, userData);
            await JoinRequestService.updateRequestStatus(request.id, 'APPROVED');

            if (request.uid) {
                // alert('Admin approved successfully!'); // Optional: keep UI clean, maybe use statusMsg instead
                setStatusMsg(`Approved ${request.email}`);
            }

            loadRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Error approving request: ' + error.message);
        } finally {
            setProcessing(null);
        }
    }

    async function handleReject(request) {
        try {
            setProcessing(request.id);
            await JoinRequestService.updateRequestStatus(request.id, 'REJECTED');
            loadRequests();
            setStatusMsg(`Rejected ${request.email}`);
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Error rejecting request: ' + error.message);
        } finally {
            setProcessing(null);
        }
    }

    function generateRandomPassword() {
        return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    }

    // --- UI Helpers ---
    const CopyButton = ({ text }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = () => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return (
            <button
                onClick={handleCopy}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Copy to clipboard"
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Activity size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Super Admin</h1>
                            <p className="text-xs text-slate-400 font-mono">SAAS CONTROL CENTER</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-400">
                            {userProfile?.email}
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Tenants</h3>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            <Building2 size={24} className="text-indigo-400" /> {companies.length}
                        </div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Requests</h3>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            <UserPlus size={24} className="text-orange-400" /> {requests.length}
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {statusMsg && (
                    <div className={`mb-8 p-3 rounded text-sm font-medium ${statusMsg.toLowerCase().includes('error') ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-green-900/30 text-green-300 border border-green-800'}`}>
                        {statusMsg}
                    </div>
                )}

                {/* Join Requests Section */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <UserPlus size={20} className="text-orange-400" /> Join Requests
                        </h2>
                    </div>
                    {requestsLoading ? (
                        <div className="p-8 text-center text-slate-500 animate-pulse">Loading requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No pending requests.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Requested On</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {requests.map(request => (
                                        <tr key={request.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{request.name}</td>
                                            <td className="px-6 py-4 text-slate-300">{request.email}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(request)}
                                                        disabled={processing === request.id}
                                                        className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-green-300 border border-green-600/50 rounded text-xs font-semibold transition-all disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request)}
                                                        disabled={processing === request.id}
                                                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 border border-red-600/50 rounded text-xs font-semibold transition-all disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Provision Company Section */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm mb-8">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-green-400" /> Provision New Company
                    </h2>
                    <form onSubmit={handleCreateCompany} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                            <input
                                type="text"
                                required
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                placeholder="e.g. Acme Industries"
                                className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-900/20"
                        >
                            {creating ? 'Provisioning...' : 'Create Tenant'}
                        </button>
                    </form>
                </div>

                {/* Companies List */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Building2 size={20} className="text-slate-400" /> Active Tenants
                        </h2>
                    </div>

                    {companiesLoading ? (
                        <div className="p-8 text-center text-slate-500 animate-pulse">Loading tenants data...</div>
                    ) : companies.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No companies found. Create one above.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Company</th>
                                        <th className="px-6 py-4">Manager License Key</th>
                                        <th className="px-6 py-4">Employee License Key</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {companies.map(company => (
                                        <tr key={company.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{company.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {company.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 bg-slate-900/50 py-1.5 px-3 rounded border border-slate-700 w-fit group">
                                                    <Key size={14} className="text-purple-400" />
                                                    <code className="text-sm text-purple-200 font-mono">{company.managerCode}</code>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CopyButton text={company.managerCode} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 bg-slate-900/50 py-1.5 px-3 rounded border border-slate-700 w-fit group">
                                                    <Users size={14} className="text-blue-400" />
                                                    <code className="text-sm text-blue-200 font-mono">{company.employeeCode}</code>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CopyButton text={company.employeeCode} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteCompany(company.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete Company"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
