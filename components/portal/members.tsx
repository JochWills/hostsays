import type { MemberLogin } from "@/lib/data/portal";
import { panel, sectionTitle } from "@/components/ui/styles";

/** Who signs in for a host or operator (admin pages). Login emails are changed by the person themselves. */
export function Members({ members }: { members: MemberLogin[] }) {
  return (
    <section className={`${panel} mb-6`}>
      <h2 className={sectionTitle}>Who signs in</h2>
      {members.length === 0 ? (
        <p className="mt-2 text-[15px] text-muted">Nobody yet (demo or added by HostSays).</p>
      ) : (
        <ul className="mt-2 divide-y divide-line text-[15px]">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap gap-x-2 py-2">
              <span className="font-semibold">{m.name ?? "No name"}</span>
              {m.isOwner && <span className="text-muted">(owner)</span>}
              <span className="min-w-0 break-words text-muted">
                · {m.email ? <a href={`mailto:${m.email}`} className="text-green hover:underline">{m.email}</a> : "no email"}
                {m.phone && ` · ${m.phone}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
