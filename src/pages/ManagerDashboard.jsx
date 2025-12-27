import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Trophy, Users, Briefcase, Star, Award, Zap, MessageSquare, Clock, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEmployees, useEmployeeTasks, useAssignTask, useVerifyTask, useLeaderboard } from '../hooks/useReactQueryTasks';
import ChatModal from '../components/ChatModal';
import MediaModal from '../components/MediaModal';
import ErrorBoundary from '../components/ErrorBoundary';

export default function ManagerDashboard() {
    const { userProfile, logout } = useAuth();

    // React Query Hooks
    const { data: employees = [], isLoading: loadingEmployees } = useEmployees(userProfile);
    const { data: leaderboard = [] } = useLeaderboard(userProfile);
    const { mutate: assignTask, isLoading: assigningLoading } = useAssignTask(userProfile);
    const { mutate: verifyTaskMutation } = useVerifyTask(userProfile);

    // Local State
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null); // { url, type }
    const [searchTerm, setSearchTerm] = useState(''); // NEW: Search
    const [isChatOpen, setIsChatOpen] = useState(false); // NEW: Chat Modal

    // Task fetching for selected employee
    const { data: employeeTasks = [] } = useEmployeeTasks(userProfile, selectedEmployee?.uid);

    // New Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPoints, setNewTaskPoints] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState(''); // NEW: Deadline state
    const [attachmentType, setAttachmentType] = useState('file');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentLink, setAttachmentLink] = useState('');

    const verifyTask = (taskId, status, points) => {
        if (!selectedEmployee) return;
        verifyTaskMutation({ employeeId: selectedEmployee.uid, taskId, status, points });
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        if (isSubmitting || assigningLoading) return;
        if (!selectedEmployee) return;

        if (selectedEmployee.role === 'manager') {
            alert("Error: You cannot assign tasks to another Manager.");
            return;
        }

        if (!newTaskPoints || isNaN(newTaskPoints)) {
            alert("Please enter a valid points value.");
            return;
        }

        setIsSubmitting(true);
        let attachmentData = null;
        let finalAttachmentType = null;

        try {
            if (attachmentType === 'file' && attachmentFile) {
                if (attachmentFile.size > 2000 * 1024) { // Updated to 2MB
                    alert("File too large! Max size is 2MB.");
                    setIsSubmitting(false);
                    return;
                }
                const toBase64 = file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
                attachmentData = await toBase64(attachmentFile);
                finalAttachmentType = 'file';
            } else if (attachmentType === 'link' && attachmentLink) {
                attachmentData = attachmentLink;
                finalAttachmentType = 'link';
            }

            assignTask({
                employeeId: selectedEmployee.uid,
                taskData: {
                    title: newTaskTitle,
                    description: newTaskDesc,
                    points: Number(newTaskPoints),
                    deadline: newTaskDeadline, // NEW: Pass deadline
                    attachmentUrl: attachmentData || null,
                    attachmentType: finalAttachmentType,
                }
            }, {
                onSuccess: () => {
                    setNewTaskTitle('');
                    setNewTaskDesc('');
                    setNewTaskPoints('');
                    setNewTaskDeadline('');
                    setAttachmentFile(null);
                    setAttachmentLink('');
                    setAttachmentType('file');
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false)
            });
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    if (loadingEmployees) return <div className="p-8 text-center">Loading Dashboard...</div>;

    const currentSelectedEmployee = employees.find(e => e.uid === selectedEmployee?.uid) || selectedEmployee;

    // Filter Employees
    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50 flex-col md:flex-row overflow-hidden relative">

            {/* NEW: Media Preview Modal */}
            {previewMedia && (
                <MediaModal
                    url={previewMedia.url}
                    type={previewMedia.type}
                    onClose={() => setPreviewMedia(null)}
                />
            )}

            {/* Mobile Header */}
            <header className="bg-slate-800 text-white p-4 flex items-center justify-between md:hidden shrink-0 z-30 relative shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-1 hover:bg-slate-700 rounded">
                        <Menu size={24} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold">Manager</h2>
                        <p className="text-[10px] text-slate-300">{userProfile?.companyName}</p>
                    </div>
                </div>
            </header>

            {/* Sidebar (Desktop + Mobile Drawer) */}
            <div className={`
                fixed inset-0 z-40 bg-slate-800 text-white flex flex-col transition-transform duration-300 transform 
                md:relative md:translate-x-0 md:w-80 md:inset-auto md:flex
                ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 border-b border-slate-700 bg-slate-800 sticky top-0 z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold">Office Manager</h2>
                            <p className="text-xs text-slate-400 mt-1">{userProfile?.companyName}</p>
                        </div>
                        <button onClick={() => setShowMobileSidebar(false)} className="md:hidden text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-2">
                    {/* Leaderboard Link */}
                    <div className="px-4 py-2 border-b border-slate-700/50 mb-2">
                        <Link to={`/${userProfile.companyId}/leaderboard`} className="flex items-center justify-between text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 p-2 rounded transition-colors group">
                            <span className="flex items-center gap-2"><Trophy size={14} /> View Full Leaderboard</span>
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </div>

                    <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users size={14} /> Employees</span>
                        <span className="bg-slate-700 px-2 py-0.5 rounded-full text-[10px]">{filteredEmployees.length}</span>
                    </div>

                    {filteredEmployees.length === 0 ? (
                        <div className="text-center p-4 text-slate-500 text-xs italic">No matching employees found.</div>
                    ) : (
                        <ul className="space-y-1 px-2">
                            {filteredEmployees.map(emp => {
                                const hasPending = emp.pendingTaskCount > 0;
                                const isRequesting = emp.status === 'requesting_task';
                                const isSelected = selectedEmployee?.uid === emp.uid;

                                return (
                                    <li key={emp.uid}>
                                        <button
                                            onClick={() => {
                                                setSelectedEmployee(emp);
                                                setShowMobileSidebar(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group relative
                                            ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}
                                        `}
                                        >
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-sm truncate">{emp.name}</div>
                                                    {/* Status Badges */}
                                                    {isRequesting && (
                                                        <span className="flex h-2 w-2 relative" title="Requesting Work">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                        </span>
                                                    )}
                                                    {hasPending && (
                                                        <span className="flex h-2 w-2 relative" title="Unverified Proofs">
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`text-xs mt-1 truncate w-full flex items-center gap-1 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                    <Trophy size={10} className={`${isSelected ? 'text-yellow-300' : 'text-yellow-600'}`} />
                                                    {emp.pointsStats?.totalEarned || 0} pts
                                                </div>
                                            </div>

                                            {/* Activity Indicator (Right Side) */}
                                            {hasPending && (
                                                <div className="bg-red-500 h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                    {emp.pendingTaskCount}
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button onClick={logout} className="w-full py-2 px-4 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
                {currentSelectedEmployee ? (
                    <>
                        <header className="bg-white shadow-sm shrink-0 p-4 md:px-8 border-b border-slate-200 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        {currentSelectedEmployee.name}
                                        {currentSelectedEmployee.status === 'requesting_task' && (
                                            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse border border-orange-200">
                                                Requesting Work
                                            </span>
                                        )}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{currentSelectedEmployee.email}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-bold text-indigo-600">
                                            Rank #{leaderboard.findIndex(u => u.uid === currentSelectedEmployee.uid) + 1}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <div className="text-3xl font-bold text-indigo-600">{currentSelectedEmployee.pointsStats?.totalEarned || 0}</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Points Earned</div>
                                </div>
                            </div>
                        </header>

                        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                                {/* Left Col: Tasks & Activity */}
                                <div className="xl:col-span-2 space-y-6">
                                    {/* Activity Log */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                <Briefcase size={18} className="text-slate-400" /> Activity Log
                                            </h3>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {employeeTasks.length === 0 ? (
                                                <div className="p-10 text-center text-slate-400">No tasks found for this employee.</div>
                                            ) : (
                                                employeeTasks.map(task => (
                                                    <div key={task.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.status === 'verified' ? 'bg-green-100 text-green-700' :
                                                                        task.status === 'verification_pending' ? 'bg-orange-100 text-orange-700 animate-pulse' :
                                                                            task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                                'bg-blue-100 text-blue-700'
                                                                        }`}>
                                                                        {task.status.replace('_', ' ')}
                                                                    </span>
                                                                    <h4 className="font-semibold text-slate-800">{task.title}</h4>
                                                                    <span className="text-slate-400 text-xs">•</span>
                                                                    <span className="text-yellow-600 font-bold text-xs flex items-center gap-0.5">
                                                                        <Star size={10} fill="currentColor" /> {task.points}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-600 mb-2">{task.description}</p>

                                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={12} /> Assigned: {new Date(task.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    {task.deadline && (
                                                                        <span className={`flex items-center gap-1 font-medium ${new Date(task.deadline) < new Date() && task.status !== 'verified' ? 'text-red-500' : 'text-slate-500'}`}>
                                                                            <Clock size={12} /> Due: {new Date(task.deadline).toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Proof Section */}
                                                                {task.proofUrl && (
                                                                    <div className="mt-3 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Proof of Work submitted</span>
                                                                            <span className="text-[10px] text-blue-600">
                                                                                {new Date(task.completedAt).toLocaleString()}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setPreviewMedia({ url: task.proofUrl, type: task.proofType })}
                                                                                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-medium rounded hover:bg-blue-50 transition shadow-sm"
                                                                            >
                                                                                Preview Proof
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Actions */}
                                                            {task.status === 'verification_pending' && (
                                                                <div className="flex flex-col gap-2 shrink-0">
                                                                    <button
                                                                        onClick={() => verifyTask(task.id, 'verified', task.points || 0)}
                                                                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow-sm hover:bg-green-700 transition active:scale-95"
                                                                    >
                                                                        <span className="md:hidden">✓</span>
                                                                        <span className="hidden md:inline">Approve</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => verifyTask(task.id, 'rejected', task.points || 0)}
                                                                        className="px-3 py-1.5 bg-red-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded shadow-sm transition active:scale-95"
                                                                    >
                                                                        <span className="md:hidden">✗</span>
                                                                        <span className="hidden md:inline">Reject</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Actions & Chat */}
                                <div className="space-y-6">

                                    {/* Task Assigner */}
                                    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Zap size={18} className="text-yellow-500" /> Assign New Task
                                        </h3>
                                        <form onSubmit={handleAssignTask} className="space-y-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Task Title..."
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Points (e.g. 100)"
                                                    value={newTaskPoints}
                                                    onChange={(e) => setNewTaskPoints(e.target.value)}
                                                />
                                                <input // New Deadline Input
                                                    type="datetime-local"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                                                    value={newTaskDeadline}
                                                    min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                                                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <textarea
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                                                    placeholder="Description & Instructions..."
                                                    value={newTaskDesc}
                                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                                ></textarea>
                                            </div>

                                            {/* Compact Attachment UI */}
                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                <div className="flex gap-2 mb-2">
                                                    <button type="button" onClick={() => setAttachmentType('file')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${attachmentType === 'file' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>File</button>
                                                    <button type="button" onClick={() => setAttachmentType('link')} className={`flex-1 text-[10px] uppercase font-bold py-1 rounded ${attachmentType === 'link' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Link</button>
                                                </div>
                                                {attachmentType === 'file' ? (
                                                    <input type="file" onChange={(e) => setAttachmentFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                                ) : (
                                                    <input type="url" placeholder="https://..." value={attachmentLink} onChange={(e) => setAttachmentLink(e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs" />
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={assigningLoading}
                                                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50"
                                            >
                                                {assigningLoading ? 'Assigning...' : 'Assign Task'}
                                            </button>
                                        </form>
                                    </div>

                                </div>
                            </div>
                        </main>

                        {/* Floating Chat Button */}
                        <div className="absolute bottom-6 right-6 z-30">
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
                            employeeId={currentSelectedEmployee.uid}
                            employeeName={currentSelectedEmployee.name}
                        />


                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce-slow">
                            <Users size={48} className="text-indigo-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-700 mb-2">Welcome, Manager!</h2>
                        <p className="text-slate-500 max-w-md">Select an employee from the sidebar to view their activity, track progress, assign tasks, or start a chat.</p>
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="mt-8 md:hidden px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-300 active:scale-95 transition-transform"
                        >
                            Select Employee
                        </button>
                    </div>
                )
                }
            </div >
        </div >
    );
}
