import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History as HistoryIcon, Inbox } from "lucide-react";

import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS, PLATFORM_LIST, URGENCY } from "@/lib/platforms";
import api from "@/lib/api";

const flagFilters = [
  { key: "all", label: "All flags" },
  { key: "red", label: "Red" },
  { key: "yellow", label: "Yellow" },
  { key: "green", label: "Green" },
];

const formatDate = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
};

const History = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");
  const [flag, setFlag] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = { handled: true };
    if (platform !== "all") params.platform = platform;
    if (flag !== "all") params.flag = flag;
    try {
      const res = await api.get("/reviews", { params });
      setRows(res.data);
    } finally {
      setLoading(false);
    }
  }, [platform, flag]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center">
            <HistoryIcon className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">History</h1>
            <p className="text-sm text-slate-400">Every review you've handled with ReplyRush.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-44" data-testid="filter-platform"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {PLATFORM_LIST.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  <span className="flex items-center gap-2"><p.Icon size={14} style={{ color: p.color }} /> {p.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-1.5" data-testid="filter-flags">
            {flagFilters.map((f) => {
              const active = flag === f.key;
              const u = URGENCY[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => setFlag(f.key)}
                  data-testid={`filter-flag-${f.key}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all border ${
                    active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {u && <span className={`h-2 w-2 rounded-full ${u.dot}`} />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rows */}
        <div className="mt-6 space-y-3" data-testid="history-list">
          {loading ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-14 text-center">
              <Inbox className="mx-auto text-slate-300" size={40} />
              <p className="mt-3 font-semibold text-slate-500">No handled reviews yet</p>
              <p className="text-sm text-slate-400">Connect a platform and draft your first reply.</p>
            </div>
          ) : (
            rows.map((r, i) => {
              const meta = PLATFORMS[r.platform];
              const Icon = meta?.Icon;
              const u = URGENCY[r.flag] || URGENCY.yellow;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  onClick={() => navigate(`/reply-studio/${r.id}`)}
                  data-testid={`history-row-${r.id}`}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${u.dot}`} title={u.long} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-7 w-7 rounded-lg grid place-items-center ${meta?.soft}`}>
                          {Icon && <Icon size={14} style={{ color: meta.color }} />}
                        </span>
                        <span className="font-semibold text-slate-900">{r.reviewer_name}</span>
                        <StarRating rating={r.rating} size={12} />
                        <span className="text-xs text-slate-400 ml-auto">{formatDate(r.handled_at || r.date)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 line-clamp-1">"{r.text}"</p>
                      <div className="mt-2 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Reply</p>
                        <p className="mt-0.5 text-sm text-slate-700 line-clamp-2">{r.reply}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
