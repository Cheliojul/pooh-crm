import Link from "next/link"

import { cn } from "@/lib/utils"

export type AppHeaderSection = "dashboard" | "shop-analyzer"

const NAV_LINKS: { key: AppHeaderSection; href: string; label: string }[] = [
  { key: "dashboard", href: "/dashboard", label: "Orders" },
  { key: "shop-analyzer", href: "/shop-analyzer", label: "Shop Analyzer" },
]

export interface AppHeaderProps {
  active: AppHeaderSection
}

/**
 * Shared app chrome. Stays a Server Component — the active section is passed in
 * rather than read from `usePathname`, so this ships no client JS.
 */
export function AppHeader({ active }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-6 px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="font-heading text-section-title font-semibold"
        >
          Pooh CRM
        </Link>
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={link.key === active ? "page" : undefined}
              className={cn(
                "text-body transition-colors",
                link.key === active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <Link
        href="/login"
        className="text-body text-muted-foreground hover:text-foreground"
      >
        Log out
      </Link>
    </header>
  )
}
