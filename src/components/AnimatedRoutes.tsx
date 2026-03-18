import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import PageTransition from "@/components/PageTransition";
import React, { Suspense } from "react";

// Eagerly load critical routes
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";

// Lazy-load non-critical routes for code splitting
const People = React.lazy(() => import("@/pages/People"));
const Messages = React.lazy(() => import("@/pages/Messages"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const Discover = React.lazy(() => import("@/pages/Discover"));
const AdminAds = React.lazy(() => import("@/pages/AdminAds"));
const AdminModeration = React.lazy(() => import("@/pages/AdminModeration"));
const Advertise = React.lazy(() => import("@/pages/Advertise"));
const Legal = React.lazy(() => import("@/pages/Legal"));
const EmberPublicProfile = React.lazy(() => import("@/pages/EmberPublicProfile"));
const SignalView = React.lazy(() => import("@/pages/SignalView"));
const CreatorAnalytics = React.lazy(() => import("@/pages/CreatorAnalytics"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const ResetPassword = React.lazy(() => import("@/pages/ResetPassword"));
const Install = React.lazy(() => import("@/pages/Install"));
const Camps = React.lazy(() => import("@/pages/Camps"));
const CampDetail = React.lazy(() => import("@/pages/CampDetail"));

const LazyFallback = () => (
  <div className="flex h-svh items-center justify-center bg-background">
    <p className="label-signal animate-pulse">arura</p>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LazyFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return <LazyFallback />;

  return (
    <Suspense fallback={<LazyFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <PageTransition className="h-svh"><Auth /></PageTransition>} />
          <Route path="/" element={user ? <Navigate to="/home" replace /> : <PageTransition><Landing /></PageTransition>} />
          <Route path="/home" element={<ProtectedRoute><PageTransition className="h-svh"><Index /></PageTransition></ProtectedRoute>} />
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
          <Route path="/analytics" element={<ProtectedRoute><PageTransition className="h-svh"><CreatorAnalytics /></PageTransition></ProtectedRoute>} />
          <Route path="/install" element={<PageTransition className="h-svh"><Install /></PageTransition>} />
          <Route path="*" element={<PageTransition className="h-svh"><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

export default AnimatedRoutes;
