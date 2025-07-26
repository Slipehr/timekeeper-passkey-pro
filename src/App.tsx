import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, UserRole } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { ProtectedTimesheet } from "@/components/ProtectedTimesheet";
import { ProtectedProjects } from "@/components/ProtectedProjects";
import Reports from "./pages/Reports";
import Approvals from "./pages/Approvals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/timesheet" element={
              <ProtectedRoute>
                <ProtectedTimesheet />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <ProtectedProjects />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRoles={[UserRole.AUDIT, UserRole.MANAGER, UserRole.ADMINISTRATOR]}>
                  <Reports />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole={UserRole.MANAGER}>
                  <Approvals />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
