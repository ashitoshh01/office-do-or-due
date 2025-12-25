import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Trophy, Users, Briefcase, Star, Award, Zap } from 'lucide-react';
import { useEmployees, useEmployeeTasks, useAssignTask, useVerifyTask, useLeaderboard } from '../hooks/useReactQueryTasks';

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

    // Task fetching for selected employee
    const { data: employeeTasks = [] } = useEmployeeTasks(userProfile, selectedEmployee?.uid);

    // New Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPoints, setNewTaskPoints] = useState('');
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
                if (attachmentFile.size > 700 * 1024) {
                    alert("File too large! Max size is 700KB for free storage.");
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
                    taskAmount: 0, // Legacy field
                    points: Number(newTaskPoints),
                    attachmentUrl: attachmentData || null,
                    attachmentType: finalAttachmentType,
                }
            }, {
                onSuccess: () => {
                    setNewTaskTitle('');
                    setNewTaskDesc('');
                    setNewTaskPoints('');
                    setAttachmentFile(null);
                    setAttachmentLink('');
                    setAttachmentType('file');
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    if (loadingEmployees) return <div className="p-8 text-center">Loading Dashboard...</div>;

    // We may need to find the latest version of the selected employee from the list to get updated stats
    const currentSelectedEmployee = employees.find(e => e.uid === selectedEmployee?.uid) || selectedEmployee;

    return (
        <div className="flex h-screen bg-slate-50 flex-col md:flex-row overflow-hidden">
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
                md:relative md:translate-x-0 md:w-72 md:inset-auto md:flex
                ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">Office Manager</h2>
                        <p className="text-xs text-slate-400 mt-1">{userProfile?.companyName}</p>
                    </div>
                    <button onClick={() => setShowMobileSidebar(false)} className="md:hidden text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} /> Employees ({employees.length})
                    </div>
                    <ul>
                        {employees.map(emp => (
                            <li key={emp.uid}>
                                <button
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        setShowMobileSidebar(false);
                                    }}
                                    className={`w-full text-left px-6 py-3 hover:bg-slate-700 transition-colors flex items-center justify-between group ${selectedEmployee?.uid === emp.uid ? 'bg-slate-700 border-r-4 border-yellow-500' : ''}`}
                                >
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="font-medium text-sm truncate">{emp.name}</div>
                                        <div className="text-xs text-slate-400 truncate w-full flex items-center gap-1">
                                            <Trophy size={10} className="text-yellow-500" />
                                            {emp.pointsStats?.totalEarned || 0} pts
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {emp.status === 'available' && (
                                            <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" title="Available"></span>
                                        )}
                                        {emp.status === 'busy' && (
                                            <span className="h-3 w-3 rounded-full bg-orange-500" title="Busy"></span>
                                        )}
                                        {(!emp.status || emp.status === 'active' || emp.status === 'idle') && (
                                            <span className="h-3 w-3 rounded-full bg-red-500" title="Idle"></span>
                                        )}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={logout} className="w-full py-2 px-4 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
                {currentSelectedEmployee ? (
                    <>
                        <header className="bg-white shadow-sm shrink-0 p-4 md:px-8 border-b border-slate-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">
                                        {currentSelectedEmployee.name}
                                    </h1>
                                    <p className="text-xs text-slate-500 md:hidden">{currentSelectedEmployee.email}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                    <div className="flex flex-col items-start md:items-end shrink-0">
                                        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Total Earned</span>
                                        <span className="font-bold text-xl text-yellow-600 flex items-center gap-1">
                                            <Trophy size={18} /> {currentSelectedEmployee.pointsStats?.totalEarned || 0}
                                        </span>
                                    </div>

                                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                                    <div className="flex flex-col items-start md:items-end shrink-0">
                                        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Current Balance</span>
                                        <span className="font-bold text-slate-700">{currentSelectedEmployee.pointsStats?.currentBalance || 0} pts</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <main className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-20 md:pb-0">

                                {/* Task List (Left 2 cols) */}
                                <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                                            <Briefcase size={20} /> Activity Log
                                        </h3>
                                    </div>

                                    {employeeTasks.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-100 rounded-lg border border-dashed border-slate-300">
                                            <p className="text-slate-500 italic">No tasks assigned yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {employeeTasks.map(task => (
                                                <div key={task.id} className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <h4 className="font-bold text-slate-800 break-words pr-2">{task.title}</h4>
                                                                <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded text-xs shrink-0 whitespace-nowrap flex items-center gap-1">
                                                                    <Star size={10} fill="currentColor" /> {task.points || 0} PTS
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 mt-1 break-words">{task.description}</p>

                                                            <div className="flex flex-wrap items-center mt-3 gap-2">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold
                                                                    ${task.status === 'verification_pending' ? 'bg-orange-100 text-orange-800' :
                                                                        task.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                                            task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                                'bg-blue-100 text-blue-800' // assigned
                                                                    }`}>
                                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>

                                                            {/* Manager Attachment Link */}
                                                            {task.attachmentUrl && (
                                                                <div className="mt-2 pt-2 border-t border-slate-50">
                                                                    {task.attachmentType === 'link' ? (
                                                                        <a href={task.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                            Open Attachment Link
                                                                        </a>
                                                                    ) : (
                                                                        <a href={task.attachmentUrl} download={`attachment_${task.id}`} className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                                            Download Attachment
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {task.status === 'verification_pending' && (
                                                            <div className="flex md:flex-col gap-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                                                                <button
                                                                    onClick={() => verifyTask(task.id, 'verified', task.points || 0)}
                                                                    className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-medium shadow-sm active:scale-95 transition-all text-center"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => verifyTask(task.id, 'rejected', task.points || 0)}
                                                                    className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-medium shadow-sm active:scale-95 transition-all text-center"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {task.proofUrl && (
                                                        <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-100">
                                                            <h5 className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Proof Submission</h5>
                                                            {task.proofType === 'link' ? (
                                                                <a href={task.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center break-all">
                                                                    {task.proofUrl}
                                                                </a>
                                                            ) : (
                                                                <a href={task.proofUrl} download={`proof_${task.id}`} className="text-sm text-blue-600 hover:underline flex items-center">
                                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                                    Download Proof File
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Leaderboard & Assign Task */}
                                <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">

                                    {/* Leaderboard Widget */}
                                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-lg p-5 text-white">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Award size={20} className="text-yellow-300" /> Top Performers
                                        </h3>
                                        <div className="space-y-3">
                                            {leaderboard.length === 0 ? (
                                                <p className="text-indigo-200 text-sm italic">No data yet.</p>
                                            ) : (
                                                leaderboard.map((user, index) => (
                                                    <div key={user.uid} className="flex items-center gap-3 bg-white/10 p-2 rounded-lg border border-white/10">
                                                        <div className={`
                                                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                                            ${index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-yellow-500/50' :
                                                                index === 1 ? 'bg-slate-300 text-slate-800' :
                                                                    'bg-amber-600 text-amber-100'}
                                                            shadow-sm
                                                        `}>
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-sm truncate">{user.name}</div>
                                                            <div className="text-indigo-200 text-xs truncate">{user.pointsStats?.totalEarned || 0} pts</div>
                                                        </div>
                                                        {index === 0 && <Zap size={16} className="text-yellow-300 animate-pulse" />}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Assign Task Form */}
                                    <div className="bg-white rounded-lg shadow-md p-5 border border-slate-200 sticky top-4">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600"><Star size={18} /></div>
                                            Assign New Task
                                        </h3>
                                        <form onSubmit={handleAssignTask} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g. Weekly Challenge"
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Points Reward</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 font-mono"
                                                    placeholder="100"
                                                    value={newTaskPoints}
                                                    onChange={(e) => setNewTaskPoints(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                                                <textarea
                                                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 h-24"
                                                    placeholder="Details about the task..."
                                                    value={newTaskDesc}
                                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                                ></textarea>
                                            </div>

                                            {/* Attachment Input */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachment</label>
                                                    <div className="flex bg-slate-100 rounded p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttachmentType('file')}
                                                            className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${attachmentType === 'file' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            File
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttachmentType('link')}
                                                            className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${attachmentType === 'link' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            Link
                                                        </button>
                                                    </div>
                                                </div>

                                                {attachmentType === 'file' ? (
                                                    <div className="space-y-1">
                                                        <input
                                                            type="file"
                                                            className="block w-full text-sm text-slate-500
                                                                file:mr-4 file:py-2 file:px-4
                                                                file:rounded-full file:border-0
                                                                file:text-xs file:font-semibold
                                                                file:bg-blue-50 file:text-blue-700
                                                                hover:file:bg-blue-100"
                                                            onChange={(e) => setAttachmentFile(e.target.files[0])}
                                                        />
                                                        <p className="text-[10px] text-slate-400">Max 700KB. For larger files, use 'Link' option.</p>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="url"
                                                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        placeholder="https://drive.google.com/..."
                                                        value={attachmentLink}
                                                        onChange={(e) => setAttachmentLink(e.target.value)}
                                                    />
                                                )}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={assigningLoading}
                                                className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 font-bold tracking-wide disabled:opacity-50 transition-colors shadow-sm active:scale-95"
                                            >
                                                {assigningLoading ? 'Assigning...' : 'Assign Challenge'}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                            </div>
                        </main>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <div className="bg-slate-100 p-6 rounded-full mb-4">
                            <Users size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">No Employee Selected</h3>
                        <p className="text-sm max-w-xs">Open the sidebar menu and select an employee to view their tasks or assign new work.</p>
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="mt-6 md:hidden px-6 py-2 bg-blue-600 text-white rounded-full font-medium shadow"
                        >
                            Select Employee
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
