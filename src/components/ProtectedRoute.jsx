import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLayout from './SkeletonLayout';

export default function ProtectedRoute({ children, allowedRoles, requireSuperAdmin = false }) {
    const { currentUser, userProfile, loading } = useAuth();
    const params = useParams(); // To get companyId from URL if available

    if (loading) {
        return <SkeletonLayout />;
    }

    if (!currentUser || !userProfile) {
        // If we are trying to access a company route, send them to that company's login
        if (params.companyId) {
            return <Navigate to={`/${params.companyId}/login`} />;
        }
        return <Navigate to="/primecommerce/login" />;
    }

    const companySlug = userProfile.companyId || 'primecommerce';

    // Check super admin requirement
    if (requireSuperAdmin && !userProfile.isSuperAdmin) {
        return <Navigate to="/" />;
    }

    // If roles are specified, check if user has permission
    if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
        // Redirect to their appropriate dashboard
        if (userProfile.isSuperAdmin) {
            return <Navigate to="/superadmin/dashboard" />;
        }
        if (userProfile.role === 'admin') {
            return <Navigate to={`/${companySlug}/admin/dashboard`} />;
        }
        if (userProfile.role === 'manager') {
            return <Navigate to={`/${companySlug}/manager/dashboard`} />;
        }
        if (userProfile.role === 'employee') {
            return <Navigate to={`/${companySlug}/dashboard`} />;
        }
        return <Navigate to="/" />;
    }

    return children;
}
