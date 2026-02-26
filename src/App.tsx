import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { PendingApproval } from "@/components/PendingApproval";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Contracts from "./pages/Contracts";
import ContractDetails from "./pages/ContractDetails";
import Settings from "./pages/Settings";
import ClientDashboard from "./pages/ClientDashboard";
import Financial from "./pages/Financial";

import Reports from "./pages/Reports";
import Studies from "./pages/Studies";
import WhatsApp from "./pages/WhatsApp";
import Pipeline from "./pages/Pipeline";
import GlobalCalendar from "./pages/GlobalCalendar";
import TeamReports from "./pages/TeamReports";
import ActivityLogPage from "./pages/ActivityLog";

import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { status, isLoading: roleLoading, isAdmin } = useUserRole();
  
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  
  if (isAdmin) return <>{children}</>;
  
  if (status === 'pending') return <PendingApproval status="pending" />;
  if (status === 'rejected') return <PendingApproval status="rejected" />;
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/cliente/:token" element={<ErrorBoundary><ClientDashboard /></ErrorBoundary>} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="clientes" element={<Clients />} />
        <Route path="projetos" element={<Projects />} />
        <Route path="projetos/:id" element={<ProjectDetails />} />
        <Route path="contratos" element={<Contracts />} />
        <Route path="contratos/:id" element={<ContractDetails />} />
        <Route path="financeiro" element={<Financial />} />
        <Route path="pagamentos" element={<Navigate to="/financeiro" replace />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="estudos" element={<Studies />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="agenda" element={<GlobalCalendar />} />
        <Route path="equipe" element={<TeamReports />} />
        <Route path="atividades" element={<ActivityLogPage />} />
        
        <Route path="configuracoes" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
