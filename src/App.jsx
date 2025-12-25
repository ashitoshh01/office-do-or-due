import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SkeletonLayout from './components/SkeletonLayout';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import SeedData from './pages/SeedData';

import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

// Wrapper to handle redirection based on role
function RootRedirect() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <SkeletonLayout />;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If logged in but no profile (Google Auth first time), go to complete profile
  if (!userProfile) {
    return <Navigate to="/complete-profile" />;
  }

  if (userProfile?.role === 'manager') {
    return <Navigate to="/manager-dashboard" />;
  }

  return <Navigate to="/user-dashboard" />;
}

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] font-sans">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/seed" element={<SeedData />} />

              <Route path="/" element={<RootRedirect />} />

              <Route
                path="/user-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/manager-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
