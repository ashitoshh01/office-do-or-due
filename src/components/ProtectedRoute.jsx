import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLayout from './SkeletonLayout';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) {
        return <SkeletonLayout />;
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // If roles are specified, check if user has permission
    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        // Redirect to their appropriate dashboard if they try to access wrong area
        if (userProfile.role === 'manager') return <Navigate to="/manager-dashboard" />;
        if (userProfile.role === 'employee') return <Navigate to="/user-dashboard" />;
        return <Navigate to="/" />; // Fallback
    }

    return children;
}
