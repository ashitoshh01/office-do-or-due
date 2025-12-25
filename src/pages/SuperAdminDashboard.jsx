import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import JoinRequestService from '../services/JoinRequestService';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SuperAdminDashboard() {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    // Ensure only super admin can access
    useEffect(() => {
        if (!userProfile?.isSuperAdmin) {
            navigate('/');
        }
    }, [userProfile, navigate]);

    // Fetch admin join requests
    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        try {
            setLoading(true);
            const pendingRequests = await JoinRequestService.getPendingRequestsForApprover('superadmin@primecommerce.com');
            // Filter only ADMIN role requests
            const adminRequests = pendingRequests.filter(req => req.roleRequested === 'ADMIN');
            setRequests(adminRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(request) {
        try {
            setProcessing(request.id);

            // We expect request.uid to exist because users now sign up first
            let userId = request.uid;

            // FALLBACK for legacy requests without UID (won't happen for new flow)
            // If we don't have a UID, we can't create the profile easily because we can't look up by email client-side.
            if (!userId) {
                // Try to see if we can create the user (if they truly didn't exist)
                try {
                    const tempPassword = generateRandomPassword();
                    const userCredential = await createUserWithEmailAndPassword(auth, request.email, tempPassword);
                    userId = userCredential.user.uid;
                    await sendPasswordResetEmail(auth, request.email);
                    alert(`Legacy request approved! Password reset sent to ${request.email}`);
                } catch (err) {
                    if (err.code === 'auth/email-already-in-use') {
                        throw new Error("This user already exists in Auth but the request has no UID attached. Please UNLOCK/REJECT this request and ask the user to sign up again.");
                    }
                    throw err;
                }
            }

            // Create Firestore user document (Profile)
            // Note: If the user already logged in once, this might overwrite? 
            // setDoc with { merge: true } is safer but for initial setup standard setDoc is okay.
            const userRef = doc(db, 'companies', 'primecommerce', 'users', userId);
            const userData = {
                uid: userId, // Ensure UID matches Auth UID
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

            // Update join request status
            await JoinRequestService.updateRequestStatus(request.id, 'APPROVED');

            // If we had a UID, we assume they know their password (set during signup)
            // So we don't send a password reset unless we created a temp one above.
            if (request.uid) {
                alert('Admin approved successfully! They can now log in with their chosen password.');
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
            alert('Request rejected');
            loadRequests();
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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Super Admin Portal</h1>
                        <p className="text-sm text-slate-600">Prime Commerce</p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">Admin Join Requests</h2>
                    <p className="text-slate-600 text-sm">Manage admin access requests for Prime Commerce</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-slate-600">Loading requests...</div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="text-slate-400 text-5xl mb-4">📭</div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No pending requests</h3>
                        <p className="text-slate-600">All admin join requests have been processed.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Requested On
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{request.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600">{request.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(request)}
                                                    disabled={processing === request.id}
                                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request)}
                                                    disabled={processing === request.id}
                                                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
