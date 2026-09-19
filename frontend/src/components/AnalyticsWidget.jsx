import React from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MessageSquareText, Clock, TrendingUp } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";

const StatCard = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-shadow"
  >
    {children}
  </motion.div>
);

const AnalyticsWidget = ({ analytics }) => {
  const { total_reviews = 0, handled = 0, positive = 0, negative = 0, minutes_saved = 0 } = analytics || {};
  const totalFlagged = positive + negative;
  const posPct = totalFlagged ? Math.round((positive / totalFlagged) * 100) : 0;
  const negPct = totalFlagged ? 100 - posPct : 0;

  const hours = Math.floor(minutes_saved / 60);
  const mins = minutes_saved % 60;

  const pieData = totalFlagged
    ? [
        { name: "Positive", value: positive, color: "#10B981" },
        { name: "Negative", value: negative, color: "#EF4444" },
      ]
    : [{ name: "None", value: 1, color: "#E2E8F0" }];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="analytics-widget">
      <StatCard delay={0}>
        <div className="flex items-center gap-2 text-slate-400">
          <MessageSquareText size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Reviews Handled</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <AnimatedCounter value={total_reviews} className="font-display text-4xl font-extrabold text-slate-900" data-testid="stat-total-reviews" />
          <span className="mb-1 text-sm text-slate-400">total</span>
        </div>
        <p className="mt-1 text-sm text-emerald-600 font-semibold flex items-center gap-1">
          <TrendingUp size={14} /> <AnimatedCounter value={handled} /> replied
        </p>
      </StatCard>

      <StatCard delay={0.08}>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Sentiment Split</span>
        </div>
        <div className="mt-1 flex items-center gap-4">
          <div className="relative h-24 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={30} outerRadius={44} paddingAngle={totalFlagged ? 3 : 0} stroke="none">
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-lg font-extrabold text-emerald-600" data-testid="stat-positive-pct">{posPct}%</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Positive</span>
              <span className="font-semibold text-slate-900 ml-auto">{posPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-slate-600">Negative</span>
              <span className="font-semibold text-slate-900 ml-auto">{negPct}%</span>
            </div>
          </div>
        </div>
      </StatCard>

      <StatCard delay={0.16}>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Time Saved</span>
        </div>
        <div className="mt-3 flex items-end gap-1" data-testid="stat-time-saved">
          <AnimatedCounter value={hours} className="font-display text-4xl font-extrabold text-slate-900" />
          <span className="mb-1 text-lg font-semibold text-slate-500">h</span>
          <AnimatedCounter value={mins} className="font-display text-4xl font-extrabold text-slate-900 ml-1" />
          <span className="mb-1 text-lg font-semibold text-slate-500">m</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">~5 min saved per reply</p>
      </StatCard>
    </div>
  );
};

export default AnalyticsWidget;
