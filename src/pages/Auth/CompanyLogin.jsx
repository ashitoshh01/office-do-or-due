import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';

/**
 * CompanyLogin - Unified login component for employee, manager, and admin
 * Route determines which role is logging in
 */
export default function CompanyLogin({ role = 'employee' }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Get company slug from URL (will be 'primecommerce' for now)
    const companySlug = 'primecommerce';

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password, companySlug, role);
            // AuthContext will handle redirect based on actual user role
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to log in');
        }
        setLoading(false);
    }

    // Role-specific content
    const roleConfig = {
        employee: {
            title: 'Employee Login',
            subtitle: 'Access your workspace',
            signupLink: `/${companySlug}/signup`,
            managerLink: `/${companySlug}/manager/login`,
            adminLink: `/${companySlug}/admin/login`
        },
        manager: {
            title: 'Manager Login',
            subtitle: 'Manage your team',
            signupLink: `/${companySlug}/manager/signup`,
            employeeLink: `/${companySlug}/login`,
            adminLink: `/${companySlug}/admin/login`
        },
        admin: {
            title: 'Admin Login',
            subtitle: 'Administrative access',
            signupLink: `/${companySlug}/admin/signup`,
            employeeLink: `/${companySlug}/login`,
            managerLink: `/${companySlug}/manager/login`
        }
    };

    const config = roleConfig[role] || roleConfig.employee;

    return (
        <AuthLayout companySlug={companySlug}>
            <div className="bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{config.title}</h2>
                <p className="text-slate-600 mb-6">{config.subtitle}</p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>

                {/* Role Navigation Links */}
                <div className="mt-6 flex justify-between items-center text-sm">
                    <div className="flex gap-3">
                        {role !== 'manager' && config.managerLink && (
                            <Link to={config.managerLink} className="text-blue-600 hover:text-blue-500">
                                Manager
                            </Link>
                        )}
                        {role !== 'employee' && config.employeeLink && (
                            <Link to={config.employeeLink} className="text-blue-600 hover:text-blue-500">
                                Employee
                            </Link>
                        )}
                    </div>
                    {role !== 'admin' && config.adminLink && (
                        <Link to={config.adminLink} className="text-blue-600 hover:text-blue-500">
                            Admin
                        </Link>
                    )}
                </div>

                {/* Signup Link */}
                <div className="mt-6 text-center text-sm border-t border-slate-200 pt-4">
                    <p className="text-slate-600">
                        Don't have an account?{' '}
                        <Link to={config.signupLink} className="font-medium text-blue-600 hover:text-blue-500">
                            Request to join
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
