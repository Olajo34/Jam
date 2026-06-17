"use client";

import { useState, useRef } from "react";

const MAX_PHOTOS = 3;
const MAX_WIDTH = 1200;
const QUALITY = 0.82;

async function compressToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("La compression a échoué"));
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image invalide")); };
    img.src = url;
  });
}

export default function PhotoUploader({ defaultUrls = [] }: { defaultUrls?: string[] }) {
  const [photos, setPhotos] = useState<string[]>(defaultUrls.slice(0, MAX_PHOTOS));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const available = MAX_PHOTOS - photos.length;
    if (available <= 0) return;
    setUploading(true);
    setError("");

    const toProcess = Array.from(files).slice(0, available);
    const newUrls: string[] = [];

    for (const file of toProcess) {
      try {
        const compressed = await compressToWebP(file);
        const fd = new FormData();
        fd.append("file", compressed, "photo.webp");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          let errMsg = `Erreur serveur (${res.status})`;
          try { errMsg = (await res.json()).error ?? errMsg; } catch {}
          throw new Error(errMsg);
        }
        const data = await res.json();
        newUrls.push(data.url as string);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors du téléchargement");
      }
    }

    setPhotos((prev) => [...prev, ...newUrls].slice(0, MAX_PHOTOS));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((u) => u !== url));
  }

  const remaining = MAX_PHOTOS - photos.length;

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="photos" value={photos.join(",")} />

      {/* Thumbnails + slots vides */}
      <div className="flex gap-2 flex-wrap">
        {photos.map((url, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-border)] group flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              aria-label="Supprimer"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: remaining }).map((_, i) => (
          <div
            key={`slot-${i}`}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] text-2xl flex-shrink-0"
          >
            <span className="opacity-40">+</span>
          </div>
        ))}
      </div>

      {/* Zone de dépôt */}
      {remaining > 0 && (
        <label
          className={`flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            uploading
              ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 cursor-not-allowed"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-cream)]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <>
              <span className="text-xl">⏳</span>
              <span className="text-sm text-[var(--color-muted-foreground)]">Compression et envoi…</span>
            </>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                Ajouter {photos.length === 0 ? "des photos" : "une photo"}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)] text-center">
                {remaining} emplacement{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""} · Auto-compressé en WebP
              </span>
            </>
          )}
        </label>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-xs text-[var(--color-muted-foreground)]">
        1 photo minimum · 3 maximum · Chaque image est redimensionnée et convertie en WebP léger.
      </p>
    </div>
  );
}
