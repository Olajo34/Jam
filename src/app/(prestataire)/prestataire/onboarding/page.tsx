import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createPrestataireProfile } from "@/lib/actions/prestataire";
import { LocationPicker } from "@/components/shared/LocationPicker";

const CITIES = [
  "Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua",
  "Maroua", "Ngaoundéré", "Bertoua", "Kribi", "Limbé",
  "Brazzaville", "Libreville", "N'Djamena", "Bangui",
];

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/connexion");
  if (session.user.role !== "PRESTATAIRE") redirect("/");

  const existing = await prisma.prestataire.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/prestataire/dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Step n={1} label="Profil" active />
          <Divider />
          <Step n={2} label="Services" />
          <Divider />
          <Step n={3} label="Documents" />
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8">
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)] mb-1">
            Votre profil professionnel
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
            Ces informations seront visibles par les clients sur votre fiche.
          </p>

          <form action={createPrestataireProfile} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Nom de votre établissement / activité *
              </label>
              <input
                name="businessName" required
                placeholder="Ex: Salon Beauté Divine, Massage Zen..."
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Ville *</label>
                <select name="city" required className="input-base">
                  <option value="">Choisir...</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Téléphone *</label>
                <input
                  name="phone" required type="tel"
                  placeholder="+225 07 00 00 00"
                  className="input-base"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Adresse <span className="font-normal text-[var(--color-muted-foreground)]">(optionnel)</span>
              </label>
              <input
                name="address"
                placeholder="Quartier, rue, commune..."
                className="input-base"
              />
            </div>

            <LocationPicker />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Description <span className="font-normal text-[var(--color-muted-foreground)]">(optionnel)</span>
              </label>
              <textarea
                name="description" rows={3}
                placeholder="Décrivez votre activité, votre spécialité, votre expérience..."
                className="input-base resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full font-medium text-white jam-gradient hover:opacity-90 transition-opacity"
            >
              Continuer → Ajouter mes services
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, active }: { n: number; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? "jam-gradient text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"}`}>
        {n}
      </div>
      <span className={`text-xs font-medium ${active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"}`}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="flex-1 h-px bg-[var(--color-border)] mt-0" />;
}
