import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import Layout from '../components/Layout';
import UploadModal from '../components/UploadModal';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Check, Clock, AlertCircle, Briefcase, Hand } from 'lucide-react';

export default function EmployeeDashboard() {
    const { userProfile } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [isRequestingWork, setIsRequestingWork] = useState(false);

    // Initial Status Check
    useEffect(() => {
        if (userProfile?.status === 'requesting_task' && !isRequestingWork) {
            setIsRequestingWork(true);
        } else if (userProfile?.status !== 'requesting_task' && isRequestingWork) {
            setIsRequestingWork(false);
        }
    }, [userProfile, isRequestingWork]);

    // Fetch Tasks
    useEffect(() => {
        if (!userProfile) return;

        const activitiesRef = collection(db, "companies", userProfile.companyId, "users", userProfile.uid, "activities");
        const q = query(activitiesRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    const toggleRequestWork = async () => {
        const newStatus = isRequestingWork ? 'active' : 'requesting_task';
        setIsRequestingWork(!isRequestingWork);

        try {
            const userRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid);
            await updateDoc(userRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
            setIsRequestingWork(!isRequestingWork); // Revert UI
        }
    };

    const handleUploadProof = async (uploadPayload) => {
        // uploadPayload: { type: 'file'|'link', data: File|string }
        if (!activeTaskId) return;

        try {
            let proofData = null;
            let proofType = uploadPayload.type;

            if (proofType === 'file') {
                const file = uploadPayload.data;
                if (file.size > 700 * 1024) {
                    alert("File too large! Max size is 700KB. Use 'Paste Link' instead.");
                    return;
                }

                // Convert to Base64
                const toBase64 = file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
                proofData = await toBase64(file);
            } else {
                // Link
                proofData = uploadPayload.data;
            }

            const taskRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid, "activities", activeTaskId);
            await updateDoc(taskRef, {
                status: 'verification_pending',
                proofUrl: proofData,
                proofType: proofType, // 'file' or 'link'
                completedAt: new Date().toISOString()
            });
            setShowUploadModal(false);
            setActiveTaskId(null);
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Failed to submit proof");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Check size={12} className="mr-1" /> Verified</span>;
            case 'verification_pending': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" /> Pending Verification</span>;
            case 'rejected': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={12} className="mr-1" /> Rejected</span>;
            default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Assigned</span>;
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Activities</h1>
                        <p className="text-sm text-slate-500">Complete tasks assigned by your manager</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                        {userProfile?.salaryStats && (
                            <div className="flex items-center gap-4 text-sm bg-white p-3 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
                                <div className="flex flex-col items-end px-2 border-r border-slate-100 flex-1 md:flex-none">
                                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Next Payout</span>
                                    <span className="font-bold text-lg text-slate-800">
                                        ₹{(userProfile.salaryStats.baseSalary || 40000) - (userProfile.salaryStats.withdrawn || 0) - (userProfile.salaryStats.deducted || 0)}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end px-2 border-r border-slate-100 flex-1 md:flex-none">
                                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Withdrawn</span>
                                    <span className="font-bold text-green-600">₹{userProfile.salaryStats.withdrawn || 0}</span>
                                </div>
                                <div className="flex flex-col items-end px-2 flex-1 md:flex-none">
                                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Deducted</span>
                                    <span className="font-bold text-red-500">₹{userProfile.salaryStats.deducted || 0}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={toggleRequestWork}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm w-full md:w-auto
                                ${isRequestingWork
                                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                            {isRequestingWork ? (
                                <>
                                    <span className="relative flex h-3 w-3 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                    </span>
                                    Requesting Work...
                                </>
                            ) : (
                                <>
                                    <Hand size={18} /> Request Work
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {tasks.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                            <Briefcase size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No tasks assigned yet</h3>
                            <p className="mt-1 max-w-sm mx-auto">Your task list is empty. Click "Request Work" to let your manager know you are available.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tasks.map(task => (
                                <li key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <div className="flex-1 mr-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-medium text-slate-900 ${task.status === 'verified' ? 'line-through text-slate-400' : ''}`}>{task.title}</h3>
                                                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                                    ₹{task.taskAmount || 0}
                                                </span>
                                            </div>
                                            {getStatusBadge(task.status)}
                                        </div>
                                        {task.description && <p className="text-sm text-slate-600 mb-2">{task.description}</p>}

                                        {/* Task Attachment from Manager */}
                                        {task.attachmentUrl && (
                                            <div className="mb-2">
                                                {task.attachmentType === 'link' ? (
                                                    <a href={task.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center bg-blue-50 w-fit px-2 py-1 rounded">
                                                        <Briefcase size={12} className="mr-1" />
                                                        Open Attachment Link
                                                    </a>
                                                ) : (
                                                    <a href={task.attachmentUrl} download={`attachment_${task.id}`} className="text-xs text-blue-600 hover:underline flex items-center bg-blue-50 w-fit px-2 py-1 rounded">
                                                        <Briefcase size={12} className="mr-1" />
                                                        Download Attachment
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>Assigned: {new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(task.status === 'assigned' || task.status === 'rejected') && (
                                            <button
                                                onClick={() => { setActiveTaskId(task.id); setShowUploadModal(true); }}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors border border-blue-200 bg-white"
                                            >
                                                Mark Done
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <UploadModal
                        onClose={() => { setShowUploadModal(false); setActiveTaskId(null); }}
                        onUpload={handleUploadProof}
                    />
                )}
            </div>
        </Layout>
    );
}
