import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import NavBar from "@/components/NavBar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import People from "./pages/People";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import AdminAds from "./pages/AdminAds";
import AdminModeration from "./pages/AdminModeration";
import Advertise from "./pages/Advertise";
import Legal from "./pages/Legal";
import EmberPublicProfile from "./pages/EmberPublicProfile";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <p className="label-signal animate-pulse">arura</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <p className="label-signal animate-pulse">arura</p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
        <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/ember/:userId" element={<ProtectedRoute><EmberPublicProfile /></ProtectedRoute>} />
        <Route path="/admin/ads" element={<ProtectedRoute><AdminAds /></ProtectedRoute>} />
        <Route path="/admin/moderation" element={<ProtectedRoute><AdminModeration /></ProtectedRoute>} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <NavBar />}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineBanner />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
