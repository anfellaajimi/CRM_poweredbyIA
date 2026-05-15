import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '../store/themeStore';
import { Toaster } from 'sonner';

import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../routes/ProtectedRoute';

import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { EspaceClient } from '../pages/EspaceClient';
import { EspaceClientSignup } from '../pages/EspaceClientSignup';
import { Dashboard } from '../pages/Dashboard';
import { Clients } from '../pages/Clients';
import { ClientDetails } from '../pages/ClientDetails';
import { Projects } from '../pages/Projects';
import { ProjectDetails } from '../pages/ProjectDetails';
import { Devis } from '../pages/Devis';
import { Factures } from '../pages/Factures';
import { Contrats } from '../pages/Contrats';
import { CahierDeCharge } from '../pages/CahierDeCharge';
import { AlertAutomaton } from '../pages/AlertAutomaton';
import { AIMonitoring } from '../pages/AIMonitoring';
import { AIPredictions } from '../pages/AIPredictions';
import { Rappels } from '../pages/Rappels';
import { Users } from '../pages/Users';
import { UserDetails } from '../pages/UserDetails';
import { NotFound } from '../pages/NotFound';
import { Profile } from '../pages/Profile';
import { Security } from '../pages/Security';
import { Settings } from '../pages/Settings';
import { Billing } from '../pages/Billing';
import { Support } from '../pages/Support';
import { Chat } from '../pages/Chat';

import { ClientLayout } from '../layouts/ClientLayout';
import { ClientDashboard } from '../pages/client/ClientDashboard';
import { ClientProjects } from '../pages/client/ClientProjects';
import { ClientDocuments } from '../pages/client/ClientDocuments';
import { ClientProfile } from '../pages/client/ClientProfile';
import { ClientProjectDetails } from '../pages/client/ClientProjectDetails';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no layout) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Espace Client — standalone login/register */}
          <Route path="/espace-client" element={<EspaceClient />} />
          <Route path="/client-signup" element={<EspaceClientSignup />} />

          {/* Protected Client Portal routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['Client']}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/client-portal" element={<ClientDashboard />} />
            <Route path="/client-portal/projects" element={<ClientProjects />} />
            <Route path="/client-portal/projects/:id" element={<ClientProjectDetails />} />
            <Route path="/client-portal/documents" element={<ClientDocuments />} />
            <Route path="/client-portal/profile" element={<ClientProfile />} />
            {/* Reusing Chat for client too */}
            <Route path="/client-portal/chat" element={<Chat />} />
          </Route>

          {/* Protected dashboard routes (Admin/Manager/Developer only) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Developer']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/devis" element={<Devis />} />
            <Route path="/factures" element={<Factures />} />
            <Route path="/contrats" element={<Contrats />} />
            <Route path="/cahier-de-charge" element={<CahierDeCharge />} />
            <Route path="/alert-automaton" element={<AlertAutomaton />} />
            <Route path="/ai-monitoring" element={<AIMonitoring />} />
            <Route path="/ai-predictions" element={<AIPredictions />} />
            <Route path="/rappels" element={<Rappels />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/security" element={<Security />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
