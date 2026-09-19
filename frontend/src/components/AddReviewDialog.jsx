import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_LIST } from "@/lib/platforms";
import api from "@/lib/api";

const AddReviewDialog = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const reset = () => {
    setPlatform(""); setRating(0); setName(""); setText("");
  };

  const submit = async () => {
    if (!platform) return toast.error("Pick a platform");
    if (!rating) return toast.error("Pick a star rating");
    if (!text.trim()) return toast.error("Paste the review text");
    setSaving(true);
    try {
      const res = await api.post("/reviews/manual", {
        platform, rating, text: text.trim(), reviewer_name: name.trim(),
      });
      setOpen(false);
      reset();
      navigate(`/reply-studio/${res.data.id}`);
    } catch (e) {
      toast.error("Could not save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            data-testid="add-review-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Plus size={16} /> Add Review Manually
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="add-review-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add a review manually</DialogTitle>
          <DialogDescription>Paste any review and we'll draft a reply for it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="mt-1.5" data-testid="manual-platform-select">
                <SelectValue placeholder="Choose platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_LIST.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    <span className="flex items-center gap-2">
                      <p.Icon size={15} style={{ color: p.color }} /> {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Star rating</label>
            <div className="mt-1.5 flex items-center gap-1" data-testid="manual-rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} data-testid={`rating-star-${i}`}>
                  <Star size={26} className={i <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 hover:text-amber-200"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Reviewer name <span className="text-slate-400 font-normal">(optional)</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya N." className="mt-1.5" data-testid="manual-name-input" />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Review text</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Paste the customer's review here…" className="mt-1.5" data-testid="manual-text-input" />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={submit}
            disabled={saving}
            data-testid="manual-submit-btn"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Continue to Reply Studio"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddReviewDialog;
