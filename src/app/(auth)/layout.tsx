import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-cream)]">
      <div className="flex items-center justify-center py-8">
        <Link href="/">
          <Image src="/jam-logo-primary.svg" alt="Jam" width={100} height={38} priority />
        </Link>
      </div>
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
