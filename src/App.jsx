import React from 'react';
<<<<<<< HEAD
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SkeletonLayout from './components/SkeletonLayout';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import SeedData from './pages/SeedData';
=======
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
>>>>>>> 2879b6dbdb81e4a0735402b73425adc7a3331a75

// Auth Pages
import CompanyLogin from './pages/Auth/CompanyLogin';
import CompanySignup from './pages/Auth/CompanySignup';

// Dashboard Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SetupPage from './pages/SetupPage';
import TestConnection from './pages/TestConnection';

// Wrapper to handle redirection based on role
function RootRedirect() {
  const { currentUser, userProfile, loading } = useAuth();

<<<<<<< HEAD
  if (loading) return <SkeletonLayout />;
=======
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
>>>>>>> 2879b6dbdb81e4a0735402b73425adc7a3331a75

  if (!currentUser || !userProfile) {
    return <Navigate to="/primecommerce/login" />;
  }

  // Redirect based on role
  const companySlug = userProfile.companyId || 'primecommerce';

  // Super Admin gets special dashboard
  if (userProfile.isSuperAdmin) {
    return <Navigate to="/superadmin/dashboard" />;
  }

  if (userProfile.role === 'admin') {
    return <Navigate to={`/${companySlug}/admin/dashboard`} />;
  }
  if (userProfile.role === 'manager') {
    return <Navigate to={`/${companySlug}/manager/dashboard`} />;
  }
  return <Navigate to={`/${companySlug}/dashboard`} />;
}

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function App() {
  return (
<<<<<<< HEAD
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
=======
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Legacy routes - redirect to company-specific */}
            <Route path="/login" element={<Navigate to="/primecommerce/login" />} />
            <Route path="/signup" element={<Navigate to="/primecommerce/signup" />} />

            {/* Prime Commerce - Employee Routes */}
            <Route path="/primecommerce/login" element={<CompanyLogin role="employee" />} />
            <Route path="/primecommerce/signup" element={<CompanySignup role="employee" />} />

            {/* Prime Commerce - Manager Routes */}
            <Route path="/primecommerce/manager/login" element={<CompanyLogin role="manager" />} />
            <Route path="/primecommerce/manager/signup" element={<CompanySignup role="manager" />} />

            {/* Test Route */}
            <Route path="/test-connection" element={<TestConnection />} />

            {/* Prime Commerce - Admin Routes */}
            <Route path="/primecommerce/admin/login" element={<CompanyLogin role="admin" />} />
            <Route path="/primecommerce/admin/signup" element={<CompanySignup role="admin" />} />

            {/* Setup Page for creating Super Admin */}
            <Route path="/setup" element={<SetupPage />} />

            {/* Super Admin Dashboard */}
            <Route
              path="/superadmin/dashboard"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Dashboard Routes */}
            <Route
              path="/primecommerce/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/primecommerce/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard - placeholder for now */}
            <Route
              path="/primecommerce/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="mt-4">Coming soon...</p>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Legacy dashboard routes - redirect to company-specific */}
            <Route path="/user-dashboard" element={<Navigate to="/primecommerce/dashboard" />} />
            <Route path="/manager-dashboard" element={<Navigate to="/primecommerce/manager/dashboard" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
>>>>>>> 2879b6dbdb81e4a0735402b73425adc7a3331a75
  );
}

export default App;
