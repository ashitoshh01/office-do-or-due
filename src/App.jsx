import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import SkeletonLayout from './components/SkeletonLayout';

// Auth Pages
import SelectCompany from './pages/SelectCompany';
import CompanyLogin from './pages/CompanyLogin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';

// Dashboard Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LeaderboardPage from './pages/LeaderboardPage'; // NEW IMPORT
import SetupPage from './pages/SetupPage';
import TestConnection from './pages/TestConnection';
import SeedData from './pages/SeedData';

// Wrapper to handle redirection based on role
function RootRedirect() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <SkeletonLayout />;

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] font-sans">
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Static/Utility Routes */}
              <Route path="/seed" element={<SeedData />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/test-connection" element={<TestConnection />} />
              <Route path="/setup" element={<SetupPage />} />

              {/* Super Admin Routes */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute requireSuperAdmin={true}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Company Selection */}
              <Route path="/select-company" element={<SelectCompany />} />

              {/* Tenant Auth Routes */}
              <Route path="/:companyId/login" element={<CompanyLogin />} />
              <Route path="/:companyId/signup" element={<Signup />} />

              {/* Prime Commerce Specific Routes */}
              <Route path="/primecommerce/manager/login" element={<CompanyLogin role="manager" />} />
              <Route path="/primecommerce/admin/login" element={<CompanyLogin role="admin" />} />

              {/* Tenant Dashboard Routes */}
              <Route
                path="/:companyId/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:companyId/manager/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* NEW: Leaderboard Route */}
              <Route
                path="/:companyId/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'employee']}>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:companyId/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="p-8">
                      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                      <p className="mt-4">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Legacy redirects */}
              <Route path="/user-dashboard" element={<Navigate to="/primecommerce/dashboard" />} />
              <Route path="/manager-dashboard" element={<Navigate to="/primecommerce/manager/dashboard" />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;