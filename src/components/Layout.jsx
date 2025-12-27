import React, { useState } from 'react';
import { Building, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarContent = ({ appTitle, role, navigate, location, userProfile, handleLogout, setIsMobileMenuOpen }) => {
    const companyId = userProfile?.companyId || 'primecommerce';

    const navItemStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        width: '100%',
        color: location.pathname === path ? '#2563EB' : '#64748B',
        backgroundColor: location.pathname === path ? '#EFF6FF' : 'transparent',
        fontWeight: location.pathname === path ? 600 : 500,
        textDecoration: 'none',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

    return (
        <>
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <Building className="text-blue-600 mr-2" size={24} />
                <span className="font-bold text-lg text-slate-800 truncate">{appTitle}</span>
            </div>

            <nav className="flex-1 p-4">
                {role === 'employee' && (
                    <div
                        onClick={() => { navigate(`/${companyId}/dashboard`); setIsMobileMenuOpen(false); }}
                        style={navItemStyle(`/${companyId}/dashboard`)}
                    >
                        <LayoutDashboard size={20} /> Dashboard
                    </div>
                )}
                {/* Leaderboard Link for Employees */}
                {role === 'employee' && (
                    <div
                        onClick={() => { navigate(`/${companyId}/leaderboard`); setIsMobileMenuOpen(false); }}
                        style={navItemStyle(`/${companyId}/leaderboard`)}
                    >
                        <LayoutDashboard size={20} /> Leaderboard
                    </div>
                )}

                {role === 'manager' && (
                    <div
                        onClick={() => { navigate(`/${companyId}/manager/dashboard`); setIsMobileMenuOpen(false); }}
                        style={navItemStyle(`/${companyId}/manager/dashboard`)}
                    >
                        <LayoutDashboard size={20} /> Team Overview
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {userProfile?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">{userProfile?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </>
    );
};

const Layout = ({ children }) => {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Determine title based on role
    const appTitle = userProfile?.companyName || 'Office App';
    const role = userProfile?.role || 'employee';

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/select-company'); // Better UX: go to company selection
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const sidebarProps = {
        appTitle,
        role,
        navigate,
        location,
        userProfile,
        handleLogout,
        setIsMobileMenuOpen
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-slate-600">
                        <Menu size={24} />
                    </button>
                    <Building className="text-blue-600" size={20} />
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{appTitle}</span>
                </div>
            </header>

            {/* Mobile Sidebar Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <aside className="relative w-64 h-full bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                        <SidebarContent {...sidebarProps} />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 pt-16 md:pt-0 p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden">
                {children}
            </main>
        </div>
    );
};

export default Layout;
