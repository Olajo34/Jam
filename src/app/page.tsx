import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?w=420&q=80", // tresses — femme noire
  "https://images.unsplash.com/photo-1592437291558-44abbe69cb17?w=420&q=80", // maquillage artistique — femme noire
  "https://images.unsplash.com/photo-1677682693087-711e24efaa69?w=420&q=80", // massage dos — salon
  "https://images.unsplash.com/photo-1601642702400-c1544ff700d1?w=420&q=80", // manucure — peau foncée
];

const CATEGORIES = [
  { name: "Coiffure",      slug: "coiffure",   img: "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?w=300&q=75" },
  { name: "Massage",       slug: "massage",    img: "https://images.unsplash.com/photo-1677682693087-711e24efaa69?w=300&q=75" },
  { name: "Ongles",        slug: "ongles",     img: "https://images.unsplash.com/photo-1601642702400-c1544ff700d1?w=300&q=75" },
  { name: "Soins visage",  slug: "soins",      img: "https://images.unsplash.com/photo-1693004925174-d9e06209d0ee?w=300&q=75" },
  { name: "Maquillage",    slug: "maquillage", img: "https://images.unsplash.com/photo-1628682814595-a3f0816b25ff?w=300&q=75" },
  { name: "Épilation",     slug: "epilation",  img: "https://images.unsplash.com/photo-1716827173458-8bde30d6c78f?w=300&q=75" },
  { name: "Barbier",       slug: "barbier",    img: "https://images.unsplash.com/photo-1619233543112-fe382ff3693d?w=300&q=75" },
  { name: "Bien-être",     slug: "bienetre",   img: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300&q=75" },
];

const PLANS = [
  {
    key: "free",
    label: "Gratuit",
    price: "0 XAF",
    period: "jusqu'à 10 réservations/mois",
    featured: false,
    features: [
      "Profil prestataire",
      "Catalogue de services",
      "Paiement mobile money",
      "10 réservations/mois",
      "✦ Manou (aperçu limité)",
    ],
    manou: "aperçu",
  },
  {
    key: "pro",
    label: "Plan Pro",
    price: "5 000 XAF",
    period: "par mois · 100 réservations",
    featured: true,
    features: [
      "Tout du plan gratuit",
      "Jusqu'à 100 réservations/mois",
      "Statistiques avancées",
      "Support prioritaire",
      "✦ Manou IA — suggestions business",
    ],
    manou: "full",
  },
  {
    key: "gold",
    label: "Plan Gold ⭐",
    price: "15 000 XAF",
    period: "par mois · illimité",
    featured: false,
    features: [
      "Réservations illimitées",
      "Mise en avant dans l'app",
      "Badge Gold visible",
      "Support dédié",
      "✦ Manou IA — accès complet prioritaire",
    ],
    manou: "full",
  },
];

const TESTIMONIALS = [
  {
    name: "Aminata K.",
    role: "Cliente",
    city: "Douala",
    text: "J'ai trouvé ma coiffeuse en 2 minutes et payé via MTN MoMo. Jam c'est la révolution !",
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
  return (
    <main className="flex flex-col min-h-screen overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={100} height={38} priority />
          <nav className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/reservations" className="text-sm font-medium text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)] transition-colors">
                  Mes réservations
                </Link>
                <Link href="/profil"
                  className="w-9 h-9 rounded-full jam-gradient flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </Link>
              </>
            ) : (
              <>
                <Link href="/connexion" className="text-sm font-medium text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)] transition-colors">
                  Connexion
                </Link>
                <Link href="/inscription"
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white jam-gradient hover:opacity-90 transition-opacity animate-pulse-ring shadow-lg shadow-[#F2624D]/20">
                  S'inscrire
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[var(--color-cream)]">
        {/* Background blob */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full jam-gradient opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[var(--color-jam-amber)] opacity-10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <span className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-6">
              ✨ Beauté & Bien-être
            </span>
            <h1 className="animate-fade-up animate-fade-up-delay-1 text-5xl lg:text-6xl font-display font-semibold leading-[1.08] tracking-tight text-[var(--color-foreground)] mb-6">
              Réservez les{" "}
              <span className="jam-gradient-text">meilleurs professionnels</span>{" "}
              près de chez vous
            </h1>
            <p className="animate-fade-up animate-fade-up-delay-2 text-lg text-[var(--color-muted-foreground)] leading-relaxed mb-10 max-w-lg">
              Coiffure, massage, soin du visage, manucure… Trouvez, réservez et payez en toute sécurité via MTN MoMo ou Orange Money.
            </p>
            <div className="animate-fade-up animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4">
              <Link href="/recherche"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold jam-gradient hover:opacity-90 transition-opacity shadow-xl shadow-[#6E2B5E]/25">
                Trouver un prestataire
                <span>→</span>
              </Link>
              <Link href="/inscription?type=prestataire"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold border-2 border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-white hover:border-[var(--color-primary)]/30 transition-all">
                Je suis prestataire
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up animate-fade-up-delay-4 flex items-center gap-4 mt-10">
              <div className="flex -space-x-2">
                {HERO_IMAGES.slice(0,3).map((src, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow">
                    <Image src={src} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                <strong className="text-[var(--color-foreground)]">+500</strong> prestataires actifs en zone CEMAC
              </p>
            </div>
          </div>

          {/* Image collage */}
          <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in">
            {HERO_IMAGES.map((src, i) => (
              <div key={i}
                className={`overflow-hidden rounded-2xl shadow-xl ${i === 1 ? "mt-8" : i === 3 ? "-mt-8" : ""}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <Image src={src} alt="Prestation beauté" width={280} height={340}
                  className="w-full h-52 object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="bg-white py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-semibold text-[var(--color-foreground)] mb-3">
              Nos catégories
            </h2>
            <p className="text-[var(--color-muted-foreground)]">Choisissez votre type de prestation</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.slug} href={`/recherche?categorie=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm hover:shadow-xl transition-all duration-500"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <Image src={cat.img} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-0 right-0 text-center text-white text-sm font-semibold px-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 px-5 bg-[var(--color-cream)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-semibold text-[var(--color-foreground)] mb-3">
              Réservez en 3 étapes
            </h2>
            <p className="text-[var(--color-muted-foreground)]">Simple, rapide, sécurisé</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: "01", title: "Trouvez", desc: "Recherchez par catégorie, ville ou activez la géolocalisation pour voir les prestataires près de vous.", img: "https://images.unsplash.com/photo-1615890643735-6cd26210d646?w=300&q=75" },
              { n: "02", title: "Réservez", desc: "Choisissez votre prestation et votre créneau en quelques secondes, sans téléphone.", img: "https://images.unsplash.com/photo-1615891167714-6bb60917b7eb?w=300&q=75" },
              { n: "03", title: "Payez", desc: "Réglez en toute sécurité via MTN Mobile Money, Orange Money, Wave ou Moov.", img: "https://images.unsplash.com/photo-1615891081220-9116de3e1afd?w=300&q=75" },
            ].map((step) => (
              <div key={step.n} className="flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden aspect-video shadow-lg">
                  <Image src={step.img} alt={step.title} width={400} height={250} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--color-primary)] tracking-widest">{step.n}</span>
                  <h3 className="text-xl font-display font-semibold text-[var(--color-foreground)] mt-1 mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-semibold text-[var(--color-foreground)] mb-3">
              Elles adorent Jam
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-6">
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <Image src={t.img} alt={t.name} width={40} height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[var(--color-cream)]" />
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
      <section className="py-20 px-5 bg-[var(--color-background)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-display font-semibold text-[var(--color-foreground)] mb-3">
              Développez votre activité avec Jam
            </h2>
            <p className="text-[var(--color-muted-foreground)]">
              Commencez gratuitement. Passez à un plan supérieur quand votre activité décolle.
            </p>
          </div>
          {/* Manou callout */}
          <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-5 py-3 mb-8 max-w-xl mx-auto">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              <Image src="/images/manou-avatar.jpg" alt="Manou" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm text-[var(--color-foreground)]">
              <strong>Manou IA</strong> — votre assistante business — est incluse à partir du <strong>Plan Pro</strong>
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.key}
                className={`rounded-2xl p-6 flex flex-col border transition-all ${
                  plan.featured
                    ? "bg-[var(--color-primary)] text-white border-transparent shadow-xl shadow-[var(--color-primary)]/25 scale-[1.03]"
                    : "bg-[var(--color-card)] border-[var(--color-border)] hover:shadow-lg hover:-translate-y-1"
                }`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.featured ? "text-white/60" : "text-[var(--color-muted-foreground)]"}`}>
                  {plan.label}
                </p>
                <p className="text-3xl font-display font-semibold mb-0.5">{plan.price}</p>
                <p className={`text-xs mb-6 ${plan.featured ? "text-white/60" : "text-[var(--color-muted-foreground)]"}`}>
                  {plan.period}
                </p>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => {
                    const isManou = f.startsWith("✦");
                    return (
                      <li key={f} className={`flex items-start gap-2 text-sm ${
                        isManou
                          ? plan.featured ? "text-amber-200 font-medium" : "text-amber-700 font-medium"
                          : plan.featured ? "text-white/90" : "text-[var(--color-muted-foreground)]"
                      }`}>
                        <span className={`mt-0.5 font-bold ${
                          isManou ? (plan.featured ? "text-amber-200" : "text-amber-500") :
                          plan.featured ? "text-white" : "text-[var(--color-primary)]"
                        }`}>{isManou ? "✦" : "✓"}</span>
                        {f.replace("✦ ", "")}
                      </li>
                    );
                  })}
                </ul>
                <Link href="/inscription?type=prestataire"
                  className={`mt-6 block text-center py-2.5 rounded-full text-sm font-semibold transition-all ${
                    plan.featured
                      ? "bg-white text-[var(--color-primary)] hover:bg-white/90"
                      : "border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  }`}>
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="relative py-24 px-5 overflow-hidden">
        <div className="absolute inset-0 jam-gradient opacity-95" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1771771425082-49c05a9ecf48?w=1400&q=60')] bg-cover bg-center mix-blend-overlay opacity-20" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-display font-semibold text-white mb-4 leading-tight">
            Prêt à rejoindre la communauté Jam ?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Des milliers de professionnels et de clients vous attendent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription"
              className="px-8 py-3.5 rounded-full bg-white text-[var(--color-primary)] font-semibold hover:bg-white/90 transition shadow-xl">
              Créer un compte gratuit
            </Link>
            <Link href="/recherche"
              className="px-8 py-3.5 rounded-full border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition">
              Explorer les prestataires
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-[var(--color-dark)] text-white/50 py-14 px-5">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-10 mb-10">
            {/* Brand */}
            <div className="max-w-xs">
              <Image src="/jam-logo-primary.svg" alt="Jam" width={80} height={30} className="brightness-0 invert opacity-70 mb-4" />
              <p className="text-sm leading-relaxed">
                Jam est une marque du groupe <span className="text-white/80 font-medium">Elokan CS</span>, spécialiste du développement de plateformes numériques adaptées aux marchés africains.
              </p>
            </div>

            {/* Links grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white/30 uppercase tracking-widest text-xs font-semibold mb-3">Plateforme</p>
                <ul className="space-y-2">
                  <li><Link href="/recherche" className="hover:text-white transition-colors">Explorer</Link></li>
                  <li><Link href="/connexion" className="hover:text-white transition-colors">Connexion</Link></li>
                  <li><Link href="/inscription" className="hover:text-white transition-colors">S'inscrire</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white/30 uppercase tracking-widest text-xs font-semibold mb-3">À propos</p>
                <ul className="space-y-2">
                  <li><Link href="/a-propos" className="hover:text-white transition-colors">À propos de Jam</Link></li>
                  <li><Link href="/elokan" className="hover:text-white transition-colors">Groupe Elokan CS</Link></li>
                  <li><Link href="/accessibilite" className="hover:text-white transition-colors">Accessibilité</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white/30 uppercase tracking-widest text-xs font-semibold mb-3">Légal</p>
                <ul className="space-y-2">
                  <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Nous contacter</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} Jam by Elokan CS · Beauté & Bien-être · Zone CEMAC</p>
            <p className="text-white/30">Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
