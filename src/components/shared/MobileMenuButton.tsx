"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Props {
  hasSession: boolean;
}

export function MobileMenuButton({ hasSession }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden z-50 relative flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        <span
          className={`block h-px w-5 bg-[var(--color-foreground)] transition-all duration-300 origin-center ${
            open ? "rotate-45 translate-y-[6px]" : ""
          }`}
        />
        <span
          className={`block h-px w-5 bg-[var(--color-foreground)] transition-all duration-200 ${
            open ? "opacity-0 scale-x-0" : ""
          }`}
        />
        <span
          className={`block h-px w-5 bg-[var(--color-foreground)] transition-all duration-300 origin-center ${
            open ? "-rotate-45 -translate-y-[6px]" : ""
          }`}
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-[var(--color-cream)] flex flex-col pt-24 px-8 sm:hidden">
          <nav className="flex flex-col">
            {[
              { href: "/recherche", label: "Explorer" },
              { href: "/reservations", label: "Mes réservations", auth: true },
              { href: "/profil", label: "Mon profil", auth: true },
              { href: "/connexion", label: "Se connecter", guest: true },
              { href: "/inscription", label: "Créer un compte", guest: true },
            ]
              .filter((item) => {
                if (item.auth) return hasSession;
                if (item.guest) return !hasSession;
                return true;
              })
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="font-display font-light text-[2.4rem] py-4 border-b border-[var(--color-border)] text-[var(--color-foreground)] hover:text-[var(--color-secondary)] transition-colors tracking-tight leading-tight"
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          <div className="mt-auto pb-12">
            <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted-foreground)]">
              Beauté &amp; Bien-être · Zone CEMAC
            </p>
          </div>
        </div>
      )}
    </>
  );
}
