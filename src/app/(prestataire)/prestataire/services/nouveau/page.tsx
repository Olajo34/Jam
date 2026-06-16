import { prisma } from "@/lib/prisma";
import { createService } from "@/lib/actions/prestataire";
import Link from "next/link";

export default async function NouveauServicePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/prestataire/services" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          ← Services
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Nouveau service</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Décrivez la prestation que vous proposez.</p>
      </div>

      <form action={createService} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 space-y-5">
        <ServiceFormFields categories={categories} />
        <div className="flex gap-3 pt-2">
          <Link
            href="/prestataire/services"
            className="flex-1 py-2.5 text-center rounded-full text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-cream)]"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-full text-sm font-medium text-white jam-gradient hover:opacity-90"
          >
            Créer le service
          </button>
        </div>
      </form>
    </div>
  );
}

export function ServiceFormFields({
  categories,
  defaults,
}: {
  categories: { id: string; name: string; icon?: string | null }[];
  defaults?: { name?: string; description?: string | null; categoryId?: string | null; duration?: number; price?: number; photos?: string[] };
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Nom du service *</label>
        <input
          name="name" required defaultValue={defaults?.name}
          placeholder="Ex: Coiffure femme, Massage relaxant, Manucure..."
          className="input-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">
          Catégorie <span className="font-normal text-[var(--color-muted-foreground)]">(optionnel)</span>
        </label>
        <select name="categoryId" defaultValue={defaults?.categoryId ?? ""} className="input-base">
          <option value="">Choisir une catégorie...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">
          Description <span className="font-normal text-[var(--color-muted-foreground)]">(optionnel)</span>
        </label>
        <textarea
          name="description" rows={3} defaultValue={defaults?.description ?? ""}
          placeholder="Décrivez la prestation, les techniques utilisées, les bénéfices..."
          className="input-base resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-foreground)]">Durée (minutes) *</label>
          <input
            name="duration" type="number" required min="5" step="5"
            defaultValue={defaults?.duration ?? 60}
            className="input-base"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-foreground)]">Prix (XAF) *</label>
          <input
            name="price" type="number" required min="0"
            defaultValue={defaults?.price ?? ""}
            placeholder="5000"
            className="input-base"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">
          Photos <span className="font-normal text-[var(--color-muted-foreground)]">(URLs séparées par des virgules)</span>
        </label>
        <textarea
          name="photos" rows={2}
          defaultValue={defaults?.photos?.join(", ") ?? ""}
          placeholder="https://... , https://..."
          className="input-base resize-none text-xs"
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Copiez les liens de vos photos depuis Google Drive, Dropbox ou tout hébergeur d'images. Min. 3 photos pour apparaître dans la recherche.
        </p>
      </div>
    </>
  );
}
