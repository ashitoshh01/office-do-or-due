import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import UploadModal from '../components/UploadModal';
import MediaModal from '../components/MediaModal';
import ChatModal from '../components/ChatModal'; // NEW: ChatModal Import
import { Check, Clock, AlertCircle, Briefcase, Hand, Trophy, Star, MessageSquare, Medal, Award } from 'lucide-react';
import { useTasks, useUpdateUserStatus, useUploadProof, useLeaderboard } from '../hooks/useReactQueryTasks';

export default function EmployeeDashboard() {
    const { userProfile } = useAuth();

    // React Query Hooks
    const { data: tasks = [], isLoading: loading } = useTasks(userProfile);
    const { mutate: updateUserStatus, isLoading: updatingStatus } = useUpdateUserStatus(userProfile);
    const { mutate: uploadProof, isLoading: uploading } = useUploadProof(userProfile);
    const { data: leaderboardData = [] } = useLeaderboard(userProfile);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [previewMedia, setPreviewMedia] = useState(null); // NEW: Preview state
    const [isChatOpen, setIsChatOpen] = useState(false); // NEW: Chat State

    // Local state for optimistic UI update
    const [localStatus, setLocalStatus] = useState(userProfile?.status || 'active');

    // Sync local status with userProfile when it changes
    React.useEffect(() => {
        if (userProfile?.status) {
            setLocalStatus(userProfile.status);
        }
    }, [userProfile?.status]);

    const isRequestingTask = localStatus === 'requesting_task';

    const toggleRequestWork = () => {
        const newStatus = isRequestingTask ? 'active' : 'requesting_task';
        setLocalStatus(newStatus); // Optimistic update
        updateUserStatus({ newStatus }, {
            onError: () => {
                // Revert on error
                setLocalStatus(userProfile?.status || 'active');
            }
        });
    };

    const handleUploadProof = (uploadPayload) => {
        if (!activeTaskId) return;
        uploadProof({ taskId: activeTaskId, uploadPayload }, {
            onSuccess: () => {
                setShowUploadModal(false);
                setActiveTaskId(null);
            }
        });
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
            <div className="max-w-4xl mx-auto pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Activities</h1>
                        <p className="text-sm text-slate-500">Complete challenges to earn points</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                        {/* Rank Badge - NEW */}
                        {(() => {
                            // Calculate rank based on all employees
                            const allEmployees = leaderboardData.length > 0 ? leaderboardData : [];
                            const myPoints = userProfile?.pointsStats?.totalEarned || 0;
                            const rank = allEmployees.findIndex(emp => emp.uid === userProfile?.uid) + 1;
                            const totalEmployees = allEmployees.length;

                            // Determine rank styling
                            const getRankStyle = () => {
                                if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-500', text: 'text-white', icon: '🥇', border: 'border-yellow-300', ring: 'ring-yellow-200' };
                                if (rank === 2) return { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-white', icon: '🥈', border: 'border-slate-300', ring: 'ring-slate-200' };
                                if (rank === 3) return { bg: 'bg-gradient-to-br from-orange-400 to-orange-500', text: 'text-white', icon: '🥉', border: 'border-orange-300', ring: 'ring-orange-200' };
                                if (rank <= 10) return { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-white', icon: '⭐', border: 'border-indigo-300', ring: 'ring-indigo-200' };
                                return { bg: 'bg-gradient-to-br from-slate-600 to-slate-700', text: 'text-white', icon: '🎯', border: 'border-slate-400', ring: 'ring-slate-300' };
                            };

                            const style = getRankStyle();

                            return rank > 0 && (
                                <div className={`flex items-center gap-3 ${style.bg} p-3 rounded-xl border-2 ${style.border} shadow-lg w-full md:w-auto justify-between md:justify-start ring-2 ${style.ring} transition-all hover:scale-105`}>
                                    <div className="flex items-center gap-2">
                                        <div className="text-3xl animate-bounce-slow">{style.icon}</div>
                                        <div className="flex flex-col">
                                            <span className={`${style.text} text-[9px] uppercase tracking-wider font-bold opacity-90`}>Your Rank</span>
                                            <span className={`${style.text} font-black text-2xl leading-none`}>
                                                #{rank}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`${style.text} text-xs opacity-80 font-semibold hidden md:block`}>
                                        of {totalEmployees}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Points Badge */}
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-yellow-200 shadow-sm w-full md:w-auto justify-between md:justify-start ring-1 ring-yellow-100">
                            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                <Trophy size={20} />
                            </div>
                            <div className="flex flex-col items-end px-2">
                                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Total Earned</span>
                                <span className="font-bold text-lg text-slate-800 flex items-center gap-1">
                                    {userProfile?.pointsStats?.totalEarned || 0} <span className="text-yellow-600 text-xs">PTS</span>
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={toggleRequestWork}
                            disabled={updatingStatus}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm w-full md:w-auto
                                ${isRequestingTask
                                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}
                                ${updatingStatus ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isRequestingTask ? (
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
                    {loading ? (
                        <div className="p-5 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-start animate-pulse">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-48 bg-slate-200 rounded"></div>
                                            <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-32 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="h-8 w-24 bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                            <Briefcase size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No tasks assigned yet</h3>
                            <p className="mt-1 max-w-sm mx-auto">Your list is empty. Click "Request Work" to get new challenges.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tasks.map(task => (
                                <li key={task.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <div className="flex-1 mr-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-medium text-slate-900 ${task.status === 'verified' ? 'line-through text-slate-400' : ''}`}>{task.title}</h3>
                                                <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                    <Star size={10} fill="currentColor" /> {task.points || 0} PTS
                                                </span>
                                            </div>
                                            {getStatusBadge(task.status)}
                                        </div>
                                        {task.description && <p className="text-sm text-slate-600 mb-2">{task.description}</p>}

                                        {/* Task Attachment from Manager */}
                                        {task.attachmentUrl && (
                                            <div className="mb-2">
                                                <button
                                                    onClick={() => setPreviewMedia({ url: task.attachmentUrl, type: task.attachmentType })}
                                                    className="text-xs text-blue-600 hover:underline flex items-center bg-blue-50 w-fit px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                                                >
                                                    <Briefcase size={12} className="mr-1" />
                                                    {task.attachmentType === 'link' ? 'Open Attachment Link' : 'Preview Attachment'}
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                            <span>Assigned: {new Date(task.createdAt).toLocaleDateString()}</span>
                                            {task.deadline && (
                                                <span className={`flex items-center gap-1 font-medium ${new Date(task.deadline) < new Date() && task.status !== 'verified' ? 'text-red-500' : 'text-slate-500'}`}>
                                                    <Clock size={12} /> Due: {new Date(task.deadline).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Rejection Message */}
                                        {task.status === 'rejected' && task.rejectionMessage && (
                                            <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-red-800 mb-1">Rejection Reason:</p>
                                                        <p className="text-xs text-red-700">{task.rejectionMessage}</p>
                                                        <p className="text-[10px] text-red-600 mt-2 italic">Please fix the issue and resubmit before the deadline.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(task.status === 'assigned' || task.status === 'rejected') && (
                                            <button
                                                onClick={() => { setActiveTaskId(task.id); setShowUploadModal(true); }}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors border border-blue-200 bg-white"
                                            >
                                                Submit Work
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
                        uploading={uploading}
                    />
                )}

                {/* Media Preview Modal */}
                {previewMedia && (
                    <MediaModal
                        url={previewMedia.url}
                        type={previewMedia.type}
                        onClose={() => setPreviewMedia(null)}
                    />
                )}

                {/* Floating Chat Button */}
                <div className="fixed bottom-6 right-6 z-30">
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-300 hover:bg-indigo-700 hover:scale-105 transition-all animate-bounce-slow"
                    >
                        <MessageSquare size={24} />
                    </button>
                </div>

                {/* Chat Modal */}
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    employeeId={userProfile?.uid}
                    employeeName={userProfile?.name}
                    isEmployeeView={true}
                />
            </div>
        </Layout>
    );
}
