import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  signal_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

type FilterStatus = "pending" | "reviewed" | "all";

const AdminModeration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      if (!data) navigate("/");
    });
  }, [user, navigate]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") {
      query = query.eq("status", filter === "pending" ? "pending" : "reviewed");
    }
    const { data } = await query;
    if (!data) { setReports([]); setLoading(false); return; }

    // Get names
    const userIds = [...new Set([
      ...data.map(r => r.reporter_id),
      ...data.map(r => r.reported_user_id).filter(Boolean),
    ] as string[])];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) ?? []);

    setReports(data.map(r => ({
      ...r,
      reporter_name: nameMap.get(r.reporter_id) ?? "unknown",
      reported_name: r.reported_user_id ? nameMap.get(r.reported_user_id) ?? "unknown" : undefined,
    })));
    setLoading(false);
  }, [filter]);

  useEffect(() => { if (isAdmin) loadReports(); }, [isAdmin, loadReports]);

  const handleResolve = async (reportId: string, action: "dismissed" | "actioned") => {
    await supabase.from("reports").update({ status: action === "dismissed" ? "reviewed" : "actioned", reviewed_at: new Date().toISOString() }).eq("id", reportId);
    toast.success(action === "dismissed" ? "Dismissed" : "Actioned");
    setSelectedReport(null);
    loadReports();
  };

  const handleDeleteSignal = async (signalId: string, reportId: string) => {
    await supabase.from("signals").delete().eq("id", signalId);
    await supabase.from("reports").update({ status: "actioned", reviewed_at: new Date().toISOString() }).eq("id", reportId);
    toast.success("Signal removed & report actioned");
    setSelectedReport(null);
    loadReports();
  };

  if (!isAdmin) return null;

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/admin/ads")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">moderation</p>
        <div className="w-5" />
      </div>

      {/* Stats */}
      <div className="px-6 mb-4">
        <div className="signal-surface rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">pending reports</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-destructive">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-6 mb-4">
        {(["pending", "reviewed", "all"] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-full py-2 text-xs font-medium signal-ease ${
              filter === f ? "bg-primary text-primary-foreground" : "signal-surface text-muted-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-12">
            {filter === "pending" ? "No pending reports 🎉" : "No reports found"}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {reports.map(report => (
              <motion.button
                key={report.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedReport(report)}
                className="signal-surface rounded-xl p-4 text-left w-full signal-ease hover:ring-1 hover:ring-primary/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    report.status === "pending" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{report.reason}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {report.reporter_name} → {report.reported_name ?? "content"}
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Report detail overlay */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={signalTransition}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-10"
            >
              <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-muted" />
              <p className="label-signal text-center mb-4">Report Details</p>

              <div className="space-y-3 mb-6">
                <div className="signal-surface rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Reason</p>
                  <p className="text-sm text-foreground">{selectedReport.reason}</p>
                </div>
                {selectedReport.details && (
                  <div className="signal-surface rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">Details</p>
                    <p className="text-sm text-foreground">{selectedReport.details}</p>
                  </div>
                )}
                <div className="signal-surface rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Reported by</p>
                  <p className="text-sm text-foreground">{selectedReport.reporter_name}</p>
                </div>
                {selectedReport.reported_name && (
                  <div className="signal-surface rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">Reported user</p>
                    <p className="text-sm text-foreground">{selectedReport.reported_name}</p>
                  </div>
                )}
              </div>

              {selectedReport.status === "pending" && (
                <div className="flex flex-col gap-2">
                  {selectedReport.signal_id && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDeleteSignal(selectedReport.signal_id!, selectedReport.id)}
                      className="rounded-full bg-destructive px-6 py-3 text-sm font-medium text-destructive-foreground"
                    >
                      Remove Signal & Action
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleResolve(selectedReport.id, "actioned")}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
                  >
                    Mark Actioned
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleResolve(selectedReport.id, "dismissed")}
                    className="signal-surface rounded-full px-6 py-3 text-sm font-medium text-muted-foreground"
                  >
                    Dismiss
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminModeration;
