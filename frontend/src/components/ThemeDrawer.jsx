import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ReviewCard from "@/components/ReviewCard";
import api from "@/lib/api";

const ThemeDrawer = ({ theme, open, onOpenChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !theme) return;
    setLoading(true);
    setData(null);
    api
      .get(`/issue-radar/theme/${encodeURIComponent(theme)}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [open, theme]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="theme-drawer">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{theme}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={18} /> Analysing this theme…
          </div>
        ) : data ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                <Lightbulb size={14} /> Suggested action for you
              </div>
              <p className="mt-2 text-sm text-slate-800 leading-relaxed" data-testid="theme-suggested-action">
                {data.suggested_action}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {data.reviews.length} matching review{data.reviews.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {data.reviews.map((r, i) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    index={i}
                    compact
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/reply-studio/${r.id}`);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default ThemeDrawer;
