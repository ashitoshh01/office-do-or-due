import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard } from '../hooks/useReactQueryTasks';
import { Trophy, Award, TrendingUp, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LeaderboardPage() {
    const { userProfile } = useAuth();
    const { data: leaderboard = [], isLoading } = useLeaderboard(userProfile);

    // Filter top 3 for podium
    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header / Navbar */}
            <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={userProfile?.role === 'manager' ? `/${userProfile?.companyId}/manager-dashboard` : `/${userProfile?.companyId}/dashboard`}>
                            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Trophy className="text-yellow-500 fill-yellow-500" size={24} />
                            Leaderboard
                        </h1>
                    </div>
                    <div className="text-sm text-slate-500 hidden sm:block">
                        {userProfile?.companyName}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-slate-500">Loading Rankings...</p>
                    </div>
                ) : (
                    <>
                        {/* Podium Section */}
                        {topThree.length > 0 && (
                            <div className="mb-12 flex justify-center items-end gap-2 sm:gap-6 mt-8">
                                {/* 2nd Place */}
                                {topThree[1] && (
                                    <div className="flex flex-col items-center order-1 w-24 sm:w-32 animate-fade-in-up delay-100">
                                        <div className="mb-2 relative">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-full border-4 border-slate-300 flex items-center justify-center overflow-hidden shadow-lg">
                                                {topThree[1].photoURL ? (
                                                    <img src={topThree[1].photoURL} alt={topThree[1].name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={32} className="text-slate-400" />
                                                )}
                                            </div>
                                            <span className="absolute -bottom-2 -right-2 bg-slate-400 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold border-2 border-white text-sm">2</span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-slate-700 text-sm sm:text-base truncate w-full">{topThree[1].name}</h3>
                                            <p className="text-xs sm:text-sm font-semibold text-slate-500">{topThree[1].pointsStats?.totalEarned || 0} pts</p>
                                        </div>
                                        <div className="h-32 w-full bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg mt-2 shadow-sm border-t border-slate-200"></div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                <div className="flex flex-col items-center order-2 w-28 sm:w-40 z-10 animate-fade-in-up">
                                    <div className="mb-3 relative">
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-yellow-100 rounded-full border-4 border-yellow-400 flex items-center justify-center overflow-hidden shadow-xl ring-4 ring-yellow-100">
                                            {topThree[0]?.photoURL ? (
                                                <img src={topThree[0].photoURL} alt={topThree[0].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={40} className="text-yellow-400" />
                                            )}
                                        </div>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                            <Trophy size={32} className="text-yellow-500 fill-yellow-400 drop-shadow-sm" />
                                        </div>
                                        <span className="absolute -bottom-3 -right-1 bg-yellow-500 text-white w-9 h-9 flex items-center justify-center rounded-full font-bold border-2 border-white text-lg">1</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-slate-800 text-base sm:text-lg truncate w-full">{topThree[0]?.name}</h3>
                                        <p className="text-sm font-bold text-yellow-600">{topThree[0]?.pointsStats?.totalEarned || 0} pts</p>
                                    </div>
                                    <div className="h-40 w-full bg-gradient-to-t from-yellow-100 to-yellow-50 rounded-t-xl mt-2 shadow-md border-t border-yellow-200 flex items-end justify-center pb-4">
                                        <Award className="text-yellow-300 opacity-50" size={40} />
                                    </div>
                                </div>

                                {/* 3rd Place */}
                                {topThree[2] && (
                                    <div className="flex flex-col items-center order-3 w-24 sm:w-32 animate-fade-in-up delay-200">
                                        <div className="mb-2 relative">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full border-4 border-orange-300 flex items-center justify-center overflow-hidden shadow-lg">
                                                {topThree[2].photoURL ? (
                                                    <img src={topThree[2].photoURL} alt={topThree[2].name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={32} className="text-orange-300" />
                                                )}
                                            </div>
                                            <span className="absolute -bottom-2 -right-2 bg-orange-400 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold border-2 border-white text-sm">3</span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-slate-700 text-sm sm:text-base truncate w-full">{topThree[2].name}</h3>
                                            <p className="text-xs sm:text-sm font-semibold text-slate-500">{topThree[2].pointsStats?.totalEarned || 0} pts</p>
                                        </div>
                                        <div className="h-24 w-full bg-gradient-to-t from-orange-100 to-orange-50 rounded-t-lg mt-2 shadow-sm border-t border-orange-200"></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* List View for Rest */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-500 flex justify-between items-center text-sm">
                                <span>RANK</span>
                                <span className="flex-1 ml-4">EMPLOYEE</span>
                                <span>POINTS</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {rest.map((emp, idx) => (
                                    <div key={emp.uid} className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                        <div className="w-8 text-center font-bold text-slate-400 font-mono">
                                            {idx + 4}
                                        </div>
                                        <div className="flex-1 ml-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                {emp.photoURL ? <img src={emp.photoURL} alt="" className="w-full h-full rounded-full" /> : <User size={16} />}
                                            </div>
                                            <span className="font-semibold text-slate-700">{emp.name}</span>
                                        </div>
                                        <div className="font-bold text-indigo-600 font-mono">
                                            {emp.pointsStats?.totalEarned || 0}
                                        </div>
                                    </div>
                                ))}
                                {rest.length === 0 && topThree.length < 4 && (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        That's everyone!
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
