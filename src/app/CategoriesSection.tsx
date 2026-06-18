"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    name: "Coiffure",
    slug: "coiffure",
    img: "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?w=500&q=80",
    services: ["Coupe femme", "Coupe homme", "Tressage", "Défrisage", "Lissage kératine", "Coloration", "Extension cheveux"],
  },
  {
    name: "Manucure & Pédicure",
    slug: "ongles",
    img: "https://images.unsplash.com/photo-1601642702400-c1544ff700d1?w=500&q=80",
    services: ["Manucure classique", "Pédicure", "Pose de gel", "Nail art", "Vernis semi-permanent", "Faux ongles"],
  },
  {
    name: "Massage",
    slug: "massage",
    img: "https://images.unsplash.com/photo-1677682693087-711e24efaa69?w=500&q=80",
    services: ["Massage relaxant", "Massage sportif", "Pierres chaudes", "Réflexologie", "Drainage lymphatique", "Massage prénatal"],
  },
  {
    name: "Soins visage",
    slug: "soins-visage",
    img: "https://images.unsplash.com/photo-1693004925174-d9e06209d0ee?w=500&q=80",
    services: ["Nettoyage de peau", "Soin hydratant", "Anti-âge", "Peeling", "Microdermabrasion", "Soin contour des yeux"],
  },
  {
    name: "Maquillage",
    slug: "maquillage",
    img: "https://images.unsplash.com/photo-1628682814595-a3f0816b25ff?w=500&q=80",
    services: ["Maquillage de jour", "Maquillage soirée", "Maquillage mariée", "Contouring", "Sourcils & cils", "Maquillage naturel"],
  },
  {
    name: "Épilation",
    slug: "epilation",
    img: "https://images.unsplash.com/photo-1716827173458-8bde30d6c78f?w=500&q=80",
    services: ["Épilation à la cire", "Épilation au fil", "Épilation au sucre", "Jambes complètes", "Maillot intégral", "Épilation visage"],
  },
  {
    name: "Barbier",
    slug: "barbier",
    img: "https://images.unsplash.com/photo-1619233543112-fe382ff3693d?w=500&q=80",
    services: ["Coupe homme", "Taille de barbe", "Rasage traditionnel", "Soin barbe", "Coupe + barbe", "Dégradé"],
  },
  {
    name: "Soins corps",
    slug: "soins-corps",
    img: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=500&q=80",
    services: ["Gommage corps", "Enveloppement", "Soin amincissant", "Bain dépigmentant", "Massage corps", "Soin anti-cellulite"],
  },
  {
    name: "Cils & Sourcils",
    slug: "cils-sourcils",
    img: "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=500&q=80",
    services: ["Extension de cils", "Pose cils volume", "Design sourcils", "Microblading", "Lamination cils", "Teinture cils"],
  },
  {
    name: "Bien-être",
    slug: "bienetre",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80",
    services: ["Yoga", "Méditation guidée", "Sophrologie", "Hammam", "Sauna", "Bain relaxant"],
  },
];

export default function CategoriesSection() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const toggle = (slug: string) =>
    setOpenSlug((prev) => (prev === slug ? null : slug));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {CATEGORIES.map((cat) => {
        const isOpen = openSlug === cat.slug;
        return (
          <div key={cat.slug} className="relative">
            {/* Carte catégorie */}
            <button
              onClick={() => toggle(cat.slug)}
              aria-expanded={isOpen}
              aria-controls={`dropdown-${cat.slug}`}
              aria-label={`${cat.name} — ${isOpen ? "fermer" : "voir les prestations"}`}
              className="group relative overflow-hidden rounded-xl aspect-[3/4] w-full cursor-pointer focus:outline-none"
            >
              <Image
                src={cat.img}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className={`absolute inset-0 transition-colors duration-300 bg-gradient-to-t ${isOpen ? "from-black/90 via-black/30 to-black/10" : "from-black/75 via-black/10 to-transparent"}`} />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-1">
                <p className="text-white font-display font-light text-base tracking-tight leading-tight text-left">
                  {cat.name}
                </p>
                <span
                  className={`shrink-0 text-white/70 text-xs transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </div>
            </button>

            {/* Dropdown services */}
            {isOpen && (
              <div
                id={`dropdown-${cat.slug}`}
                role="region"
                aria-label={`Prestations ${cat.name}`}
                className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-[#1a0d15] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-up"
              >
                <div className="p-2">
                  {cat.services.map((service) => (
                    <Link
                      key={service}
                      href={`/recherche?categorie=${cat.slug}&q=${encodeURIComponent(service)}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      <span className="text-[var(--color-secondary)] text-xs shrink-0">—</span>
                      {service}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-white/8 px-3 py-2.5">
                  <Link
                    href={`/recherche?categorie=${cat.slug}`}
                    className="flex items-center justify-between text-xs font-medium tracking-wide text-[var(--color-secondary)] hover:text-white transition-colors"
                  >
                    <span>Voir tous les prestataires</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
