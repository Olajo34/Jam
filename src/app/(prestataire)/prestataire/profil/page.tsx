import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import AvailabilityForm from "./AvailabilityForm";

export default async function ProfilPrestatairePage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const prestataire = await prisma.prestataire.findUnique({
    where: { userId: session.user.id },
    include: { availabilities: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!prestataire) redirect("/prestataire/onboarding");

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">Mon profil</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          Ces informations apparaissent sur votre page publique.
        </p>
      </div>

      {/* Informations & localisation */}
      <section className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
        <h2 className="font-semibold text-[var(--color-foreground)] mb-5">Informations générales</h2>
        <ProfileForm
          businessName={prestataire.businessName}
          description={prestataire.description}
          phone={prestataire.phone}
          address={prestataire.address}
          city={prestataire.city}
          latitude={prestataire.latitude}
          longitude={prestataire.longitude}
        />
      </section>

      {/* Horaires */}
      <section className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
        <h2 className="font-semibold text-[var(--color-foreground)] mb-1">Horaires d'ouverture</h2>
        <p className="text-xs text-[var(--color-muted-foreground)] mb-5">
          Les clients ne pourront réserver que sur les créneaux correspondant à ces horaires.
        </p>
        <AvailabilityForm
          initial={prestataire.availabilities.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            isActive: a.isActive,
            startTime: a.startTime,
            endTime: a.endTime,
          }))}
        />
      </section>
    </div>
  );
}
