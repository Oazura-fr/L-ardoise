"use client";

import { usePathname } from "next/navigation";
import { Home, CalendarClock, User } from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Ardoise", icon: Home },
  { href: "/echeancier", label: "Échéances", icon: CalendarClock },
  { href: "/profil", label: "Profil", icon: User },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {ITEMS.map((it) => {
          const active = path === it.href;
          const Icon = it.icon;
          return (
            <a
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-accent" : "text-inksoft"}`}
            >
              <Icon size={20} />
              {it.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
