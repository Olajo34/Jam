import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CategoriesSection from "./CategoriesSection";
import { MobileMenuButton } from "@/components/shared/MobileMenuButton";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?w=420&q=80",
  "https://images.unsplash.com/photo-1592437291558-44abbe69cb17?w=420&q=80",
  "https://images.unsplash.com/photo-1677682693087-711e24efaa69?w=420&q=80",
  "https://images.unsplash.com/photo-1601642702400-c1544ff700d1?w=420&q=80",
];


const PLANS = [
  {
    key: "free",
    label: "Essentiel",
    price: "Gratuit",
    period: "jusqu'à 10 réservations / mois",
    featured: false,
    features: [
      "Profil prestataire",
      "Catalogue de services",
      "Paiement mobile money",
      "10 réservations / mois",
      "✦ Manou (aperçu)",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: "5 000 XAF",
    period: "/ mois · 100 réservations",
    featured: true,
    features: [
      "Tout du plan Essentiel",
      "100 réservations / mois",
      "Statistiques avancées",
      "Support prioritaire",
      "✦ Manou IA — suggestions business",
    ],
  },
  {
    key: "gold",
    label: "Gold",
    price: "10 000 XAF",
    period: "/ mois · illimité",
    featured: false,
    features: [
      "Réservations illimitées",
      "Mise en avant dans l'app",
      "Badge Gold visible",
      "Support dédié",
      "✦ Manou IA — accès complet prioritaire",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Aminata K.",
    role: "Cliente",
    city: "Douala",
    text: "J'ai trouvé ma coiffeuse en 2 minutes et payé via MTN MoMo. Jam c'est la révolution.",
    img: "https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=80&q=75",
  },
  {
    name: "Fatou D.",
    role: "Prestataire coiffure",
    city: "Yaoundé",
    text: "Depuis Jam, j'ai 3× plus de clients. Le plan Gold m'a vraiment boostée.",
    img: "https://images.unsplash.com/photo-1763347120836-5afd4a60fc01?w=80&q=75",
  },
  {
    name: "Mariam T.",
    role: "Cliente",
    city: "Bafoussam",
    text: "Simple, beau, rapide. Je réserve mes soins sans me déplacer, c'est parfait.",
    img: "https://images.unsplash.com/photo-1632828167073-bd533fe560cb?w=80&q=75",
  },
];

export default async function HomePage() {
  const session = await auth();

  if (session?.user.role === "ADMIN") redirect("/admin/dashboard");
  if (session?.user.role === "MODERATEUR") redirect("/moderateur/dashboard");
  if (session?.user.role === "PRESTATAIRE") redirect("/prestataire/dashboard");

  return (
    <main className="flex flex-col min-h-screen overflow-hidden">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={88} height={34} priority />
          <nav className="flex items-center gap-6">
            <Link href="/recherche" className="hidden sm:block text-xs font-medium tracking-widest uppercase text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors py-3 px-2 min-h-[44px] flex items-center">
              Explorer
            </Link>
            {session ? (
              <>
                <Link href="/reservations" className="hidden sm:flex text-xs font-medium tracking-widest uppercase text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors py-3 px-2 min-h-[44px] items-center">
                  Réservations
                </Link>
                <Link href="/profil"
                  className="w-9 h-9 rounded-full jam-gradient flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </Link>
              </>
            ) : (
              <>
                <Link href="/connexion" className="hidden sm:flex text-xs font-medium tracking-widest uppercase text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors py-3 px-2 min-h-[44px] items-center">
                  Connexion
                </Link>
                <Link href="/inscription"
                  className="hidden sm:block px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white jam-gradient hover:opacity-90 transition-opacity shadow-md animate-pulse-ring">
                  Commencer
                </Link>
              </>
            )}
            {/* Menu hamburger — mobile uniquement */}
            <MobileMenuButton hasSession={!!session} />
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-[var(--color-cream)]">
        {/* Lumières ambiantes */}
        <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full jam-gradient opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-[var(--color-secondary)] opacity-[0.07] blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Texte éditorial */}
          <div>
            {/* Label luxe */}
            <div className="animate-fade-up flex items-center gap-3 mb-8">
              <span className="block w-8 h-px bg-[var(--color-secondary)]" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-secondary)]">
                Beauté &amp; Bien-être · Zone CEMAC
              </span>
            </div>

            <h1 className="animate-fade-up animate-fade-up-delay-1 font-display font-light text-[clamp(3rem,6vw,5.5rem)] leading-[1.04] tracking-[-0.04em] text-[var(--color-foreground)] mb-8">
              L'élégance du<br />
              <em className="not-italic jam-gradient-text font-medium">soin de soi,</em><br />
              à portée de main.
            </h1>

            <p className="animate-fade-up animate-fade-up-delay-2 text-base text-[var(--color-muted-foreground)] leading-[1.8] mb-10 max-w-md">
              Coiffure, massage, soins du visage, manucure…
              Trouvez les meilleurs professionnels près de chez vous et payez en toute sécurité via mobile money.
            </p>

            <div className="animate-fade-up animate-fade-up-delay-3 flex flex-col sm:flex-row gap-3">
              <Link href="/recherche"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-white text-sm font-medium tracking-wide jam-gradient hover:opacity-90 transition-opacity shadow-lg shadow-[#4D1740]/20">
                Trouver un prestataire
                <span className="text-base">→</span>
              </Link>
              {!session && (
                <Link href="/inscription?type=prestataire"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-medium tracking-wide border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-all bg-white/60">
                  Je suis prestataire
                </Link>
              )}
            </div>

            {/* Image hero — mobile uniquement */}
            <div className="lg:hidden mt-10 overflow-hidden rounded-3xl shadow-2xl">
              <Image src={HERO_IMAGES[0]} alt="Prestation beauté" width={600} height={400}
                className="w-full h-56 object-cover" />
            </div>

            {/* Preuve sociale */}
            <div className="animate-fade-up animate-fade-up-delay-4 flex items-center gap-4 mt-12 pt-8 border-t border-[var(--color-border)]">
              <div className="flex -space-x-2.5">
                {HERO_IMAGES.slice(0, 4).map((src, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--color-cream)] overflow-hidden shadow-sm">
                    <Image src={src} alt="" width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">+500 prestataires</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">actifs en zone CEMAC</p>
              </div>
            </div>

            {/* Logos Mobile Money */}
            <div className="animate-fade-up animate-fade-up-delay-4 flex flex-wrap items-center gap-3 mt-6">
              <span className="text-xs text-[var(--color-muted-foreground)]">Paiement via</span>
              {[
                { name: "MTN", bg: "#FFC107", color: "#000" },
                { name: "Orange", bg: "#FF6600", color: "#fff" },
                { name: "Wave", bg: "#1A9BF4", color: "#fff" },
                { name: "Moov", bg: "#009B4E", color: "#fff" },
              ].map((p) => (
                <span
                  key={p.name}
                  className="px-2.5 py-1 rounded-md text-xs font-bold tracking-tight"
                  style={{ background: p.bg, color: p.color }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Collage photographique */}
          <div className="hidden lg:grid grid-cols-2 gap-5 animate-fade-in">
            {HERO_IMAGES.map((src, i) => (
              <div key={i}
                className={`overflow-hidden rounded-2xl shadow-lg ${i === 1 ? "mt-10" : i === 3 ? "-mt-10" : ""}`}>
                <Image src={src} alt="Prestation beauté" width={300} height={360}
                  className="w-full h-56 object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ──────────────────────────────────────── */}
      <section className="bg-[var(--color-foreground)] pt-0 pb-24 px-6">
        {/* Wave transition depuis le hero */}
        <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className="w-full block -mb-1" style={{ fill: "#100608" }}>
          <path d="M0,0 L0,35 C240,70 480,0 720,35 C960,70 1200,0 1440,35 L1440,0 Z" />
        </svg>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12" data-animate>
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-3">
                Notre sélection
              </p>
              <h2 className="font-display font-light text-4xl lg:text-5xl text-white leading-tight tracking-tight">
                Nos catégories
              </h2>
            </div>
            <Link href="/recherche"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-white/50 hover:text-white transition-colors">
              Tout explorer →
            </Link>
          </div>

          <CategoriesSection />
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────── */}
      <section className="py-28 px-6 bg-[var(--color-background)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-4">
              Le processus
            </p>
            <h2 className="font-display font-light text-4xl lg:text-5xl text-[var(--color-foreground)] tracking-tight">
              Réservez en 3 étapes
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-12">
            {[
              { n: "01", title: "Trouvez", desc: "Recherchez par catégorie, ville ou activez la géolocalisation pour voir les prestataires près de vous.", icon: "🔍" },
              { n: "02", title: "Réservez", desc: "Choisissez votre prestation et votre créneau en quelques secondes, sans téléphone.", icon: "📅" },
              { n: "03", title: "Payez", desc: "Réglez en toute sécurité via MTN Mobile Money, Orange Money, Wave ou Moov.", icon: "💳" },
            ].map((step, i) => (
              <div key={step.n} className="flex flex-col" data-animate data-delay={i}>
                {/* Numéro + ligne dorée */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-display text-5xl font-light text-[var(--color-secondary)] leading-none">{step.n}</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-secondary)] to-transparent opacity-40" />
                </div>
                {/* Icône dans un cercle */}
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-2xl mb-5 shadow-sm">
                  {step.icon}
                </div>
                <h3 className="font-display font-light text-2xl text-[var(--color-foreground)] mb-3 tracking-tight">{step.title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-[1.8]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────── */}
      <section className="py-28 bg-[var(--color-card)] overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16" data-animate>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-4">
              Témoignages
            </p>
            <h2 className="font-display font-light text-4xl lg:text-5xl text-[var(--color-foreground)] tracking-tight">
              Elles adorent Jam
            </h2>
          </div>
        </div>

        {/* Marquee pleine largeur */}
        <div className="overflow-hidden">
          <div className="flex gap-5 animate-marquee">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="flex-shrink-0 w-80 bg-[var(--color-background)] rounded-2xl p-7 border border-[var(--color-border)]">
                <div className="flex gap-0.5 mb-5" role="img" aria-label="5 étoiles sur 5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-[var(--color-secondary)] text-sm" aria-hidden="true">★</span>
                  ))}
                </div>
                <p className="font-display font-light text-lg italic text-[var(--color-foreground)] leading-[1.6] mb-6">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-[var(--color-border)]">
                  <Image src={t.img} alt={t.name} width={40} height={40}
                    className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[var(--color-background)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-4">
              Tarifs prestataires
            </p>
            <h2 className="font-display font-light text-4xl lg:text-5xl text-[var(--color-foreground)] tracking-tight mb-4">
              Développez votre activité
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-lg mx-auto leading-relaxed">
              Commencez gratuitement. Passez à un plan supérieur quand votre activité décolle.
            </p>
          </div>

          {/* Manou callout */}
          <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3.5 mb-10 max-w-md mx-auto">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              <Image src="/images/manou-avatar.jpg" alt="Manou" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              <strong className="text-[var(--color-foreground)]">Manou IA</strong> — assistante business — incluse dès le Plan Pro
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <div key={plan.key} data-animate data-delay={i}
                className={`rounded-2xl p-7 flex flex-col border transition-all ${
                  plan.featured
                    ? "jam-gradient text-white border-transparent shadow-xl shadow-[#4D1740]/30 scale-[1.03]"
                    : "bg-[var(--color-card)] border-[var(--color-border)] hover:shadow-lg hover:-translate-y-1"
                }`}>
                <p className={`text-xs font-medium tracking-[0.15em] uppercase mb-4 ${plan.featured ? "text-white/60" : "text-[var(--color-secondary)]"}`}>
                  {plan.label}
                </p>
                <p className={`font-display font-light text-3xl mb-0.5 ${plan.featured ? "text-white" : "text-[var(--color-foreground)]"}`}>
                  {plan.price}
                </p>
                <p className={`text-xs mb-7 ${plan.featured ? "text-white/55" : "text-[var(--color-muted-foreground)]"}`}>
                  {plan.period}
                </p>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => {
                    const isManou = f.startsWith("✦");
                    return (
                      <li key={f} className={`flex items-start gap-2.5 text-sm ${
                        isManou
                          ? plan.featured ? "text-amber-200 font-medium" : "text-[var(--color-secondary)] font-medium"
                          : plan.featured ? "text-white/85" : "text-[var(--color-muted-foreground)]"
                      }`}>
                        <span className={`shrink-0 mt-0.5 text-xs ${
                          isManou
                            ? plan.featured ? "text-amber-300" : "text-[var(--color-secondary)]"
                            : plan.featured ? "text-white/60" : "text-[var(--color-muted-foreground)]"
                        }`}>{isManou ? "✦" : "—"}</span>
                        {f.replace("✦ ", "")}
                      </li>
                    );
                  })}
                </ul>
                <Link href="/inscription?type=prestataire"
                  className={`mt-8 block text-center py-3 rounded-full text-xs font-medium tracking-wider uppercase transition-all ${
                    plan.featured
                      ? "bg-white text-[var(--color-primary)] hover:bg-white/92"
                      : "border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                  }`}>
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 jam-gradient" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1771771425082-49c05a9ecf48?w=1400&q=60')] bg-cover bg-center mix-blend-overlay opacity-15" />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/50 mb-6">
            Rejoignez Jam
          </p>
          <h2 className="font-display font-light text-5xl lg:text-6xl text-white mb-6 leading-[1.05] tracking-tight">
            Votre beauté mérite<br />le meilleur.
          </h2>
          <p className="text-white/65 text-base mb-10 leading-relaxed max-w-md mx-auto">
            Des milliers de professionnels et de clients vous attendent sur la plateforme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!session ? (
              <Link href="/inscription"
                className="px-8 py-4 rounded-full bg-white text-[var(--color-primary)] text-sm font-semibold tracking-wide hover:bg-white/92 transition shadow-xl">
                Créer un compte
              </Link>
            ) : (
              <Link href="/reservations"
                className="px-8 py-4 rounded-full bg-white text-[var(--color-primary)] text-sm font-semibold tracking-wide hover:bg-white/92 transition shadow-xl">
                Mes réservations
              </Link>
            )}
            <Link href="/recherche"
              className="px-8 py-4 rounded-full border border-white/30 text-white text-sm font-medium tracking-wide hover:bg-white/10 transition backdrop-blur-sm">
              Explorer les prestataires
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-[var(--color-dark)] text-white/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">

          {/* Logo */}
          <Image src="/jam-logo-primary.svg" alt="Jam" width={64} height={25} className="brightness-0 invert opacity-50" />

          {/* Liens essentiels */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
            <Link href="/recherche" className="hover:text-white/70 transition-colors">Explorer</Link>
            <Link href="/a-propos" className="hover:text-white/70 transition-colors">À propos</Link>
            <Link href="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
            <Link href="/cgu" className="hover:text-white/70 transition-colors">CGU</Link>
          </nav>

          {/* Réseaux sociaux */}
          <div className="flex items-center gap-4">
            {/* Instagram */}
            <a href="https://instagram.com/jamfeeling" target="_blank" rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* TikTok */}
            <a href="https://tiktok.com/@jamfeeling" target="_blank" rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://facebook.com/jamfeeling" target="_blank" rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.093.544 4.059 1.497 5.77L0 24l6.404-1.675A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.372l-.36-.213-3.714.972.99-3.617-.235-.372A9.818 9.818 0 112 12c0 5.422 4.398 9.818 9.818 9.818h.182z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com/company/jamfeeling" target="_blank" rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/25 text-center">
            © {new Date().getFullYear()} Jam by Elokan CS · Beauté &amp; Bien-être · Zone CEMAC
          </p>
        </div>
      </footer>
    </main>
  );
}
