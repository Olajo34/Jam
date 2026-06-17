"use client";

import { useState, useRef, useTransition } from "react";
import { updateAvatar } from "@/lib/actions/auth";

const MAX_SIZE = 800;
const QUALITY = 0.88;

async function compressAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height, MAX_SIZE);
      const canvas = document.createElement("canvas");
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext("2d")!;
      // Centrer le crop carré
      const sx = (img.width - Math.min(img.width, img.height)) / 2;
      const sy = (img.height - Math.min(img.width, img.height)) / 2;
      const sSize = Math.min(img.width, img.height);
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, side, side);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression échouée"));
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image invalide")); };
    img.src = url;
  });
}

export default function AvatarUploader({
  currentImage,
  initials,
}: {
  currentImage?: string | null;
  initials: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Format non supporté");
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const compressed = await compressAvatar(file);
      const fd = new FormData();
      fd.append("file", compressed, "avatar.webp");
      fd.append("folder", "avatars");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        let msg = `Erreur serveur (${res.status})`;
        try { msg = (await res.json()).error ?? msg; } catch {}
        throw new Error(msg);
      }
      const { url } = await res.json();
      setPreview(url);
      startTransition(async () => {
        const result = await updateAvatar(url);
        if (result?.error) setError(result.error);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circulaire cliquable */}
      <label className="relative cursor-pointer group">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {/* Cercle 96×96 */}
        <div className="w-24 h-24 rounded-full overflow-hidden relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Photo de profil"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full jam-gradient flex items-center justify-center text-white text-3xl font-bold select-none">
              {initials}
            </div>
          )}

          {/* Overlay au hover / pendant l'upload */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all rounded-full ${
            uploading
              ? "bg-black/50"
              : "bg-black/0 group-hover:bg-black/45"
          }`}>
            {uploading ? (
              <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity leading-tight text-center">
                  Modifier
                </span>
              </>
            )}
          </div>
        </div>

        {/* Pastille caméra en bas à droite */}
        {!uploading && (
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border-2 border-[var(--color-border)] shadow flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:border-[var(--color-primary)] transition-colors">
            <svg className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </label>

      {/* Message d'état */}
      {uploading && (
        <p className="text-xs text-[var(--color-muted-foreground)]">Envoi en cours…</p>
      )}
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
      {!uploading && !error && (
        <p className="text-xs text-[var(--color-muted-foreground)]">Cliquez pour changer la photo</p>
      )}
    </div>
  );
}
