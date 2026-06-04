"use client";

import { useState } from "react";
import { submitReview } from "@/lib/actions/review";

export function ReviewForm({ bookingId, businessName }: { bookingId: string; businessName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [pending, setPending] = useState(false);

  const LABELS = ["", "Décevant", "Passable", "Bien", "Très bien", "Excellent"];

  async function handleSubmit(formData: FormData) {
    if (rating === 0) return;
    setPending(true);
    await submitReview(formData);
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
      <h2 className="font-display font-semibold text-[var(--color-foreground)] mb-1">
        Notez votre expérience
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
        Chez <strong>{businessName}</strong>
      </p>

      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="rating" value={rating} />

        {/* Star picker */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className={`text-4xl transition-transform hover:scale-110 ${
                  star <= (hover || rating) ? "text-amber-400" : "text-gray-200"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-[var(--color-muted-foreground)] h-5">
            {LABELS[hover || rating]}
          </p>
        </div>

        {/* Comment */}
        <div>
          <textarea
            name="comment"
            rows={3}
            maxLength={500}
            placeholder="Partagez votre expérience (optionnel)…"
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-cream)]"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || pending}
          className="w-full py-3 rounded-full text-sm font-semibold text-white jam-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {pending ? "Envoi en cours…" : "Publier mon avis"}
        </button>
      </form>
    </div>
  );
}
