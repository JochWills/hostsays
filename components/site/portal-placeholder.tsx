import type { CurrentUser } from "@/lib/auth";
import { btnSecondary, pageTitle, panel } from "@/components/ui/styles";

/** Landing for a signed-in portal until its dashboard is built (Phases 5–7). */
export function PortalPlaceholder({ user, title, children }: { user: CurrentUser; title: string; children: React.ReactNode }) {
  return (
    <div className="wrap pt-8 pb-16">
      <div className="max-w-[640px]">
        <h1 className={pageTitle}>{title}</h1>
        <p className="mt-2 text-muted">
          Signed in as <strong className="text-ink">{user.fullName ?? user.email}</strong>
          {user.fullName && <> ({user.email})</>}
        </p>
        <div className={`${panel} mt-6 text-[15px]`}>{children}</div>
        <form method="post" action="/auth/sign-out" className="mt-6">
          <button type="submit" className={btnSecondary}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
