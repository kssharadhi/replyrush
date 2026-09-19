import React from "react";
import { motion } from "framer-motion";
import { PLATFORMS, URGENCY } from "@/lib/platforms";
import StarRating from "@/components/StarRating";
import { CheckCircle2 } from "lucide-react";

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const ReviewCard = ({ review, onClick, index = 0, compact = false }) => {
  const p = PLATFORMS[review.platform];
  const u = URGENCY[review.flag] || URGENCY.yellow;
  const Icon = p?.Icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      data-testid={`review-card-${review.id}`}
      className={`group relative w-full text-left rounded-2xl border bg-white p-5 shadow-sm hover:shadow-xl transition-shadow ${p?.border || "border-slate-200"}`}
    >
      <span className={`absolute left-0 top-5 bottom-5 w-1 rounded-full ${u.solid}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center ${p?.soft}`}>
            {Icon && <Icon size={20} style={{ color: p.color }} />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{review.reviewer_name}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size={14} />
              <span className="text-xs text-slate-400">· {formatDate(review.date)}</span>
            </div>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${u.soft} ${u.text}`}>
          <span className={`h-2 w-2 rounded-full ${u.dot}`} />
          {u.label}
        </span>
      </div>

      <p className={`mt-3 text-sm text-slate-600 leading-relaxed ${compact ? "line-clamp-2" : "line-clamp-4"}`}>
        {review.text}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(review.themes || []).map((t) => (
          <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {t}
          </span>
        ))}
        {review.handled && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 size={14} /> Replied
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default ReviewCard;
