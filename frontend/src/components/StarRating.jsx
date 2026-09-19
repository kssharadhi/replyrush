import React from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating = 0, size = 16 }) => {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
        />
      ))}
    </div>
  );
};

export default StarRating;
