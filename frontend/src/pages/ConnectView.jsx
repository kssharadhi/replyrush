import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import ReviewCard from "@/components/ReviewCard";
import AddReviewDialog from "@/components/AddReviewDialog";
import { PLATFORMS } from "@/lib/platforms";
import api from "@/lib/api";

const ConnectView = () => {
  const { platform } = useParams();
  const navigate = useNavigate();
  const meta = PLATFORMS[platform];
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const run = async () => {
      const start = Date.now();
      try {
        const res = await api.post(`/connect/${platform}`);
        const elapsed = Date.now() - start;
        const wait = Math.max(0, 2000 - elapsed); // ensure ~2s "fetching" animation
        setTimeout(() => {
          setReviews(res.data);
          setLoading(false);
        }, wait);
      } catch (e) {
        navigate("/dashboard", { replace: true });
      }
    };
    run();
  }, [platform, navigate]);

  if (!meta) {
    navigate("/dashboard", { replace: true });
    return null;
  }
  const Icon = meta.Icon;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors" data-testid="back-to-dashboard">
          <ArrowLeft size={16} /> Dashboard
        </button>

        {loading ? (
          <div className="mt-24 flex flex-col items-center justify-center" data-testid="connect-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
              className={`h-16 w-16 rounded-2xl grid place-items-center ${meta.soft}`}
            >
              <Icon size={30} style={{ color: meta.color }} />
            </motion.div>
            <div className="mt-6 flex items-center gap-2 text-slate-500">
              <Loader2 className="animate-spin" size={16} />
              <span className="font-medium">Fetching your latest reviews…</span>
            </div>
            <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200">
              <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} className="h-full w-1/2" style={{ backgroundColor: meta.color }} />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl grid place-items-center ${meta.soft}`}>
                  <Icon size={24} style={{ color: meta.color }} />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-slate-900">{meta.name} reviews</h1>
                  <p className="text-sm text-slate-400">{reviews.length} reviews · sorted by urgency</p>
                </div>
              </div>
              <AddReviewDialog />
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {reviews.map((r, i) => (
                <ReviewCard key={r.id} review={r} index={i} onClick={() => navigate(`/reply-studio/${r.id}`)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ConnectView;
