import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Sparkles } from "lucide-react";

import Navbar from "@/components/Navbar";
import AnalyticsWidget from "@/components/AnalyticsWidget";
import IssueRadar from "@/components/IssueRadar";
import ThemeDrawer from "@/components/ThemeDrawer";
import PlatformCard from "@/components/PlatformCard";
import AddReviewDialog from "@/components/AddReviewDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_LIST, URGENCY } from "@/lib/platforms";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [radar, setRadar] = useState({ themes: [], alerts: [] });
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerTheme, setDrawerTheme] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, r, s] = await Promise.all([
        api.get("/analytics"),
        api.get("/issue-radar"),
        api.get("/platforms/status"),
      ]);
      setAnalytics(a.data);
      setRadar(r.data);
      setStatuses(s.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusMap = Object.fromEntries(statuses.map((s) => [s.platform, s]));

  const openTheme = (theme) => { setDrawerTheme(theme); setDrawerOpen(true); };

  const chips = [
    { key: "red", count: analytics?.red || 0 },
    { key: "yellow", count: analytics?.yellow || 0 },
    { key: "green", count: analytics?.green || 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Welcome back, {user?.name?.split(" ")[0]} 👋</p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
            </div>
            <AddReviewDialog />
          </div>
        </motion.div>

        {/* Needs attention banner */}
        <AnimatePresence>
          {radar.alerts?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              data-testid="needs-attention-banner"
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 animate-pulse-slow">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-red-500 grid place-items-center animate-pulse">
                    <AlertTriangle className="text-white" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-800">Needs attention</p>
                    <div className="mt-1 space-y-0.5">
                      {radar.alerts.map((a) => (
                        <button
                          key={a.theme}
                          onClick={() => openTheme(a.theme)}
                          className="block text-sm text-red-700 hover:text-red-900 hover:underline font-medium text-left"
                          data-testid={`alert-${a.theme.replace(/[^a-zA-Z]/g, "-")}`}
                        >
                          {a.message}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics + chips */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : (
            <AnalyticsWidget analytics={analytics} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="urgency-chips">
          {chips.map((c) => {
            const u = URGENCY[c.key];
            return (
              <span key={c.key} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${u.soft} ${u.text} ${u.border}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${u.dot}`} />
                {u.long}
                <span className="rounded-full bg-white/70 px-1.5 text-xs">{c.count}</span>
              </span>
            );
          })}
        </div>

        {/* Radar + platforms */}
        <div className="mt-6 grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            {loading ? <Skeleton className="h-80 rounded-3xl" /> : (
              <IssueRadar themes={radar.themes} onThemeClick={openTheme} />
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-500" />
              <h3 className="font-display text-lg font-bold text-slate-900">Your platforms</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORM_LIST.map((p, i) => {
                const st = statusMap[p.key] || {};
                return (
                  <PlatformCard
                    key={p.key}
                    platform={p}
                    connected={st.connected}
                    reviewCount={st.review_count}
                    index={i}
                    onConnect={(key) => navigate(`/connect/${key}`)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <ThemeDrawer theme={drawerTheme} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default Dashboard;
