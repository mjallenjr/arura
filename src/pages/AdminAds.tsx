import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface Ad {
  id: string;
  company_name: string;
  headline: string;
  description: string | null;
  media_url: string;
  media_type: string;
  cta_text: string | null;
  cta_url: string | null;
  target_interests: string[] | null;
  cost_per_impression: number | null;
  active: boolean | null;
  created_at: string;
}

const emptyAd = {
  company_name: "",
  headline: "",
  description: "",
  media_url: "",
  media_type: "image",
  cta_text: "Learn More",
  cta_url: "",
  target_interests: "",
  cost_per_impression: "0.005",
  active: true,
};

const AdminAds = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyAd);
  const [saving, setSaving] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => {
        setIsAdmin(data && data.length > 0);
      });
  }, [user]);

  // Load all ads (admins can see all via the select policy)
  const loadAds = useCallback(async () => {
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });
    setAds(data ?? []);
  }, []);

  useEffect(() => {
    if (isAdmin) loadAds();
  }, [isAdmin, loadAds]);

  const openEdit = (ad: Ad) => {
    setEditing(ad);
    setCreating(false);
    setForm({
      company_name: ad.company_name,
      headline: ad.headline,
      description: ad.description ?? "",
      media_url: ad.media_url,
      media_type: ad.media_type,
      cta_text: ad.cta_text ?? "Learn More",
      cta_url: ad.cta_url ?? "",
      target_interests: (ad.target_interests ?? []).join(", "),
      cost_per_impression: String(ad.cost_per_impression ?? "0.005"),
      active: ad.active ?? true,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyAd);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyAd);
  };

  const handleSave = async () => {
    if (!form.company_name.trim() || !form.headline.trim() || !form.media_url.trim()) {
      toast.error("Company, headline, and media URL are required");
      return;
    }

    setSaving(true);
    const interests = form.target_interests
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      company_name: form.company_name.trim(),
      headline: form.headline.trim(),
      description: form.description.trim() || null,
      media_url: form.media_url.trim(),
      media_type: form.media_type,
      cta_text: form.cta_text?.trim() || null,
      cta_url: form.cta_url?.trim() || null,
      target_interests: interests,
      cost_per_impression: parseFloat(form.cost_per_impression) || 0.005,
      active: form.active,
    };

    if (editing) {
      const { error } = await supabase
        .from("advertisements")
        .update(payload)
        .eq("id", editing.id);
      if (error) toast.error("Update failed");
      else toast.success("Ad updated");
    } else {
      const { error } = await supabase
        .from("advertisements")
        .insert(payload);
      if (error) toast.error("Create failed");
      else toast.success("Ad created");
    }

    setSaving(false);
    closeForm();
    loadAds();
  };

  const toggleActive = async (ad: Ad) => {
    const { error } = await supabase
      .from("advertisements")
      .update({ active: !ad.active })
      .eq("id", ad.id);
    if (error) toast.error("Toggle failed");
    else loadAds();
  };

  const deleteAd = async (ad: Ad) => {
    const { error } = await supabase
      .from("advertisements")
      .delete()
      .eq("id", ad.id);
    if (error) toast.error("Delete failed");
    else {
      toast.success("Ad deleted");
      loadAds();
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <p className="label-signal animate-pulse">checking access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-background gap-4 px-8">
        <p className="text-lg font-medium text-foreground">🔒 Admin only</p>
        <p className="text-sm text-muted-foreground text-center">You don't have permission to access this page.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
           onClick={() => navigate("/home")}
          className="rounded-full signal-surface px-6 py-2.5 text-sm font-medium text-muted-foreground signal-ease"
        >
          Go back
        </motion.button>
      </div>
    );
  }

  const showForm = creating || editing;

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/home")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">ad manager</p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={openCreate}
          className="text-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </motion.button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 px-4 mb-4">
        <div className="flex-1 signal-surface rounded-xl p-3 flex flex-col items-center">
          <span className="text-lg font-medium text-foreground">{ads.length}</span>
          <span className="label-signal">Total</span>
        </div>
        <div className="flex-1 signal-surface rounded-xl p-3 flex flex-col items-center">
          <span className="text-lg font-medium text-primary">{ads.filter((a) => a.active).length}</span>
          <span className="label-signal">Active</span>
        </div>
        <div className="flex-1 signal-surface rounded-xl p-3 flex flex-col items-center">
          <span className="text-lg font-medium text-muted-foreground">{ads.filter((a) => !a.active).length}</span>
          <span className="label-signal">Paused</span>
        </div>
      </div>

      {/* Ad list */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="flex flex-col gap-2">
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`signal-surface rounded-xl p-3 flex items-center gap-3 ${
                !ad.active ? "opacity-50" : ""
              }`}
            >
              {/* Thumbnail */}
              <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                <img src={ad.media_url} alt="" className="h-full w-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0" onClick={() => openEdit(ad)}>
                <p className="text-sm font-medium text-foreground truncate">{ad.headline}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ad.company_name}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(ad.target_interests ?? []).slice(0, 3).map((t) => (
                    <span key={t} className="text-[8px] text-primary/70 bg-primary/10 rounded-full px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleActive(ad)}
                  className={`rounded-full px-3 py-1 text-[10px] font-medium ${
                    ad.active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ad.active ? "Live" : "Paused"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteAd(ad)}
                  className="rounded-full px-3 py-1 text-[10px] font-medium bg-destructive/10 text-destructive"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}

          {ads.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No ads yet</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openCreate}
                className="mt-4 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground"
              >
                Create first ad
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit form overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/95 signal-blur flex flex-col"
          >
            <div className="flex items-center justify-between p-4">
              <button onClick={closeForm} className="text-muted-foreground">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="label-signal">{editing ? "edit ad" : "new ad"}</p>
              <div className="w-5" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32">
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                {/* Preview */}
                {form.media_url && (
                  <div className="rounded-xl overflow-hidden h-40 relative">
                    <img src={form.media_url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-sm font-bold text-foreground">{form.headline || "Headline"}</p>
                      <p className="text-[10px] text-muted-foreground">{form.company_name || "Company"}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label-signal mb-1.5 block">Company Name *</label>
                  <input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="label-signal mb-1.5 block">Headline *</label>
                  <input
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Your fire starts here"
                  />
                </div>

                <div>
                  <label className="label-signal mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    placeholder="Short description..."
                  />
                </div>

                <div>
                  <label className="label-signal mb-1.5 block">Media URL *</label>
                  <input
                    value={form.media_url}
                    onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                    className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-signal mb-1.5 block">CTA Text</label>
                    <input
                      value={form.cta_text}
                      onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                      className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="Learn More"
                    />
                  </div>
                  <div>
                    <label className="label-signal mb-1.5 block">Cost/Impression</label>
                    <input
                      type="number"
                      step="0.001"
                      value={form.cost_per_impression}
                      onChange={(e) => setForm({ ...form, cost_per_impression: e.target.value })}
                      className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-signal mb-1.5 block">CTA URL</label>
                  <input
                    value={form.cta_url}
                    onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                    className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="label-signal mb-1.5 block">Target Interests (comma-separated)</label>
                  <input
                    value={form.target_interests}
                    onChange={(e) => setForm({ ...form, target_interests: e.target.value })}
                    className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="music, coffee, travel"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between signal-surface rounded-xl p-4">
                  <span className="text-sm text-foreground">Active</span>
                  <button
                    onClick={() => setForm({ ...form, active: !form.active })}
                    className={`relative h-6 w-11 rounded-full signal-ease ${
                      form.active ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-foreground"
                      animate={{ left: form.active ? "calc(100% - 22px)" : "2px" }}
                      transition={signalTransition}
                    />
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50 mt-2"
                >
                  {saving ? "Saving..." : editing ? "Update Ad" : "Create Ad"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAds;
