import type { Membership } from "@/lib/data/portal";

/** Where a host or operator stands with verification, shown at the top of their portal. */
export function ApprovalStatus({ membership, kind }: { membership: Membership | null; kind: "host" | "operator" }) {
  if (!membership) return null;
  const { status, name } = membership;
  if (status === "verified") return null;
  const message =
    status === "pending"
      ? kind === "host"
        ? "Thanks for signing up. We're checking your listing and will email you once you're verified, usually within two working days."
        : "Thanks for signing up. We're checking your business and will email you once you're verified, usually within two working days."
      : status === "rejected"
        ? "We couldn't verify your details. Please reply to our email or contact us so we can sort it out."
        : "Your account is paused. Please contact us.";
  return (
    <p className="mb-6 rounded-[10px] border border-gold/50 bg-gold/10 px-4 py-3 text-[14px]">
      <strong>{name}</strong>: {message}
    </p>
  );
}
