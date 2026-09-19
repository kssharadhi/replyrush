import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const PlatformCard = ({ platform, connected, reviewCount, loading, onConnect, index = 0 }) => {
  const { Icon, name, color, soft, desc } = platform;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl transition-shadow flex flex-col"
      data-testid={`platform-card-${platform.key}`}
    >
      <div className="flex items-center justify-between">
        <div className={`h-11 w-11 rounded-xl grid place-items-center ${soft}`}>
          <Icon size={22} style={{ color }} />
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 size={13} /> Connected
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{name}</h3>
      <p className="text-sm text-slate-400">
        {connected ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : desc}
      </p>

      <button
        onClick={() => onConnect(platform.key)}
        disabled={loading}
        data-testid={`connect-${platform.key}-btn`}
        className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          connected
            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
            : "text-white shadow-md hover:shadow-lg"
        }`}
        style={connected ? undefined : { backgroundColor: color }}
      >
        {connected ? "View reviews" : "Connect"}
        <ArrowRight size={15} />
      </button>
    </motion.div>
  );
};

export default PlatformCard;
