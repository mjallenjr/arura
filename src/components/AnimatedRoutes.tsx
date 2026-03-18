import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import PageTransition from "@/components/PageTransition";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import People from "@/pages/People";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Discover from "@/pages/Discover";
import AdminAds from "@/pages/AdminAds";
import AdminModeration from "@/pages/AdminModeration";
import Advertise from "@/pages/Advertise";
import Legal from "@/pages/Legal";
import EmberPublicProfile from "@/pages/EmberPublicProfile";
import SignalView from "@/pages/SignalView";
import CreatorAnalytics from "@/pages/CreatorAnalytics";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import Install from "@/pages/Install";
import React from "react";

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

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <p className="label-signal animate-pulse">arura</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <PageTransition className="h-svh"><Auth /></PageTransition>} />
        <Route path="/" element={<ProtectedRoute><PageTransition className="h-svh"><Index /></PageTransition></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><PageTransition className="h-svh"><Discover /></PageTransition></ProtectedRoute>} />
        <Route path="/people" element={<ProtectedRoute><PageTransition className="h-svh"><People /></PageTransition></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><PageTransition className="h-svh"><Messages /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition className="h-svh"><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/ember/:userId" element={<ProtectedRoute><PageTransition className="h-svh"><EmberPublicProfile /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/ads" element={<ProtectedRoute><PageTransition className="h-svh"><AdminAds /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/moderation" element={<ProtectedRoute><PageTransition className="h-svh"><AdminModeration /></PageTransition></ProtectedRoute>} />
        <Route path="/advertise" element={<PageTransition className="h-svh"><Advertise /></PageTransition>} />
        <Route path="/legal" element={<PageTransition className="h-svh"><Legal /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition className="h-svh"><ResetPassword /></PageTransition>} />
        <Route path="/signal/:signalId" element={<PageTransition className="h-svh"><SignalView /></PageTransition>} />
        <Route path="/install" element={<PageTransition className="h-svh"><Install /></PageTransition>} />
        <Route path="*" element={<PageTransition className="h-svh"><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
