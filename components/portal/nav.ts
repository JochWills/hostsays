import type { Role } from "@/lib/auth";

export type NavItem = { href: string; label: string };

/** Portal sections (docs/03-site-structure.md). Pages not built yet show an honest "coming" state. */
export const PORTAL_NAV: Record<Role, NavItem[]> = {
  operator: [
    { href: "/operator", label: "Overview" },
    { href: "/operator/experiences", label: "Experiences" },
    { href: "/operator/requests", label: "Requests" },
    { href: "/operator/bookings", label: "Bookings" },
    { href: "/operator/availability", label: "Availability" },
    { href: "/operator/statements", label: "Statements" },
    { href: "/operator/settings", label: "Settings" },
  ],
  host: [
    { href: "/host", label: "Overview" },
    { href: "/host/picks", label: "Your picks" },
    { href: "/host/storefront", label: "Storefront" },
    { href: "/host/share", label: "Share" },
    { href: "/host/earnings", label: "Earnings" },
    { href: "/host/settings", label: "Settings" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/approvals", label: "Approvals" },
    { href: "/admin/experiences", label: "Experiences" },
    { href: "/admin/operators", label: "Operators" },
    { href: "/admin/hosts", label: "Hosts" },
    { href: "/admin/areas", label: "Areas" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/payouts", label: "Payouts" },
    { href: "/admin/settings", label: "Settings" },
  ],
  guest: [
    { href: "/account", label: "Your trips" },
    { href: "/account/settings", label: "Settings" },
  ],
};
