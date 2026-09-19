import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Copy, RefreshCw, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS, URGENCY, BUSINESS_TYPES, TONES } from "@/lib/platforms";
import api from "@/lib/api";

const ReplyStudio = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessType, setBusinessType] = useState("Restaurant");
  const [tone, setTone] = useState("Friendly");
  const [offer, setOffer] = useState("");
  const [reply, setReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    api
      .get(`/reviews/${reviewId}`)
      .then((res) => {
        setReview(res.data);
        if (res.data.reply) { setReply(res.data.reply); setHasGenerated(true); }
        if (res.data.business_type) setBusinessType(res.data.business_type);
        if (res.data.tone) setTone(res.data.tone);
      })
      .catch(() => navigate("/dashboard", { replace: true }))
      .finally(() => setLoading(false));
  }, [reviewId, navigate]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/reviews/${reviewId}/generate`, {
        business_type: businessType, tone, offer,
      });
      setReview(res.data);
      setReply(res.data.reply);
      setHasGenerated(true);
      toast.success("Reply drafted");
    } catch (e) {
      toast.error("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyReply = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      toast.success("Reply copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </main>
      </div>
    );
  }

  const meta = PLATFORMS[review.platform];
  const Icon = meta?.Icon;
  const u = URGENCY[review.flag] || null;
  const words = reply.trim() ? reply.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors" data-testid="reply-back-btn">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="mt-4 grid lg:grid-cols-2 gap-6">
          {/* Review side */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit" data-testid="studio-review">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl grid place-items-center ${meta?.soft}`}>
                  {Icon && <Icon size={22} style={{ color: meta.color }} />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{review.reviewer_name}</p>
                  <StarRating rating={review.rating} size={15} />
                </div>
              </div>
              {u && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${u.soft} ${u.text}`}>
                  <span className={`h-2 w-2 rounded-full ${u.dot}`} /> {u.label}
                </span>
              )}
            </div>
            <p className="mt-4 text-slate-700 leading-relaxed">{review.text}</p>
            {review.themes?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {review.themes.map((t) => (
                  <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{t}</span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Studio side */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              <h2 className="font-display text-xl font-bold text-slate-900">Reply Studio</h2>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Business type</label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="mt-1.5" data-testid="business-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Tone</label>
                <div className="mt-1.5 flex flex-wrap gap-2" data-testid="tone-selector">
                  {TONES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTone(t.key)}
                      data-testid={`tone-${t.key}`}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        tone === t.key ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">What can you actually offer? <span className="text-slate-400 font-normal">(optional)</span></label>
                <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="refund, replacement, contact details, policy…" className="mt-1.5" data-testid="offer-input" />
                <p className="mt-1 text-xs text-slate-400">The AI only mentions resolutions you enter here — nothing invented.</p>
              </div>

              <button
                onClick={generate}
                disabled={generating}
                data-testid="generate-reply-btn"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {generating ? <><Loader2 size={16} className="animate-spin" /> Drafting…</> : <><Wand2 size={16} /> {hasGenerated ? "Regenerate" : "Generate Reply"}</>}
              </button>
            </div>

            {(hasGenerated || generating) && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Your reply</label>
                  <span className="text-xs text-slate-400">{words} words</span>
                </div>
                {generating && !reply ? (
                  <div className="mt-1.5 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : (
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={6} className="mt-1.5 leading-relaxed" data-testid="reply-textarea" />
                )}
                <div className="mt-3 flex gap-2">
                  <button onClick={copyReply} disabled={!reply} data-testid="copy-reply-btn" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
                    <Copy size={15} /> Copy Reply
                  </button>
                  <button onClick={generate} disabled={generating} data-testid="regenerate-btn" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={15} className={generating ? "animate-spin" : ""} /> Regenerate
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ReplyStudio;
