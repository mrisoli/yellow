"use client";
import { navigation } from "@yellow/i18n/messages";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const links = [
    { to: "/", label: navigation.home() },
    { to: "/dashboard", label: navigation.dashboard() },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link href={to} key={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
  );
}
