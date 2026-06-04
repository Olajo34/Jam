import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Création des profils de test...\n");

  const password = await bcrypt.hash("Jam2026!", 12);

  // ── 1. Admin ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@jam.cm" },
    update: {},
    create: {
      name: "Admin Jam",
      email: "admin@jam.cm",
      passwordHash: password,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin       →", admin.email, "/ mot de passe : Jam2026!");

  // ── 2. Modérateur (contrôleur) ────────────────────────────
  const moderateur = await prisma.user.upsert({
    where: { email: "moderateur@jam.cm" },
    update: {},
    create: {
      name: "Contrôleur Jam",
      email: "moderateur@jam.cm",
      passwordHash: password,
      role: "MODERATEUR",
    },
  });
  console.log("✅ Modérateur  →", moderateur.email, "/ mot de passe : Jam2026!");

  // ── 3. Prestataire ────────────────────────────────────────
  const prestUser = await prisma.user.upsert({
    where: { email: "prestataire@jam.cm" },
    update: {},
    create: {
      name: "Aminata Beauté",
      email: "prestataire@jam.cm",
      phone: "+237690000001",
      passwordHash: password,
      role: "PRESTATAIRE",
    },
  });

  const prestataire = await prisma.prestataire.upsert({
    where: { userId: prestUser.id },
    update: {},
    create: {
      userId: prestUser.id,
      businessName: "Salon Aminata",
      slug: "salon-aminata",
      description: "Spécialiste coiffure afro, tresses, soins capillaires et beauté complète à Douala.",
      city: "Douala",
      address: "Akwa, Boulevard de la Liberté",
      phone: "+237690000001",
      niu: "CM-2024-B-00001",
      enrollmentStatus: "APPROVED",
      rating: 4.7,
      totalReviews: 12,
    },
  });

  // Catégorie coiffure
  const categorie = await prisma.category.upsert({
    where: { slug: "coiffure" },
    update: {},
    create: { name: "Coiffure", slug: "coiffure", icon: "✂️" },
  });

  // Services
  await prisma.service.upsert({
    where: { id: "seed-service-1" },
    update: {},
    create: {
      id: "seed-service-1",
      prestataireId: prestataire.id,
      categoryId: categorie.id,
      name: "Tresses africaines",
      description: "Box braids, knotless, fulani braids — toutes techniques",
      duration: 180,
      price: 15000,
      status: "ACTIVE",
      photos: [],
    },
  });

  await prisma.service.upsert({
    where: { id: "seed-service-2" },
    update: {},
    create: {
      id: "seed-service-2",
      prestataireId: prestataire.id,
      categoryId: categorie.id,
      name: "Soin capillaire",
      description: "Shampooing, masque, brushing",
      duration: 60,
      price: 8000,
      status: "ACTIVE",
      photos: [],
    },
  });

  await prisma.subscription.upsert({
    where: { prestataireId: prestataire.id },
    update: {},
    create: {
      prestataireId: prestataire.id,
      plan: "PRO",
      status: "ACTIVE",
      monthlyCount: 3,
    },
  });

  console.log("✅ Prestataire →", prestUser.email, "/ mot de passe : Jam2026!");

  // ── 4. Client ─────────────────────────────────────────────
  const client = await prisma.user.upsert({
    where: { email: "client@jam.cm" },
    update: {},
    create: {
      name: "Fatou Diallo",
      email: "client@jam.cm",
      phone: "+237690000002",
      passwordHash: password,
      role: "USER",
    },
  });
  console.log("✅ Client      →", client.email, "/ mot de passe : Jam2026!");

  console.log("\n🎉 Tous les profils ont été créés !");
  console.log("─────────────────────────────────────────");
  console.log("🔑 Mot de passe commun : Jam2026!");
  console.log("─────────────────────────────────────────");
  console.log("  /admin/dashboard       → admin@jam.cm");
  console.log("  /moderateur/tickets    → moderateur@jam.cm");
  console.log("  /prestataire/dashboard → prestataire@jam.cm");
  console.log("  /recherche             → client@jam.cm");
}

main()
  .catch((e) => { console.error("❌ Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
