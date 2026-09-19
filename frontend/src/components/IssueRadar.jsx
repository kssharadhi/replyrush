import React from "react";
import { motion } from "framer-motion";
import { Radar, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";

const TrendIcon = ({ trend }) => {
  if (trend === "up") return <ArrowUp size={14} className="text-red-500" />;
  if (trend === "down") return <ArrowDown size={14} className="text-emerald-500" />;
  return <Minus size={14} className="text-slate-400" />;
};

const IssueRadar = ({ themes = [], onThemeClick }) => {
  const max = Math.max(1, ...themes.map((t) => t.count));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="issue-radar-panel">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center">
          <Radar className="text-white" size={18} />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900">Issue Radar</h3>
          <p className="text-xs text-slate-400">Top themes across your reviews · last 30 days</p>
        </div>
      </div>

      {themes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
          Connect a platform to see recurring themes light up here.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {themes.map((t, i) => {
            const width = Math.round((t.count / max) * 100);
            const isHot = t.negative >= 3 || t.red >= 2;
            return (
              <motion.button
                key={t.theme}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onThemeClick(t.theme)}
                data-testid={`radar-theme-${t.theme.replace(/[^a-zA-Z]/g, "-")}`}
                className="group w-full text-left"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    {t.theme}
                    {isHot && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {t.platforms.slice(0, 4).map((p) => {
                        const meta = PLATFORMS[p.platform];
                        const Icon = meta?.Icon;
                        return (
                          <span key={p.platform} className="h-5 w-5 rounded-full bg-white ring-1 ring-slate-200 grid place-items-center" title={meta?.name}>
                            {Icon && <Icon size={11} style={{ color: meta.color }} />}
                          </span>
                        );
                      })}
                    </div>
                    <TrendIcon trend={t.trend} />
                    <span className="w-6 text-right font-bold text-slate-900">{t.count}</span>
                  </div>
                </div>
                <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                    className={`h-full rounded-full ${isHot ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssueRadar;
