import { setAccountStatus, setListingStatus } from "@/app/(site)/admin/actions";
import { ConfirmButton } from "./form";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";

const small = "!px-3.5 !py-2 !text-[13.5px]";

/** Status buttons for a host or operator, depending on where it stands. */
export function AccountActions({ kind, id, name, status }: { kind: "host" | "operator"; id: string; name: string; status: string }) {
  const button = (value: string, text: string, primary = false, confirm?: string) => (
    <form action={setAccountStatus}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={value} />
      {confirm ? (
        <ConfirmButton message={confirm} className={`${primary ? btnPrimary : btnSecondary} ${small}`} aria-label={`${text} ${name}`}>
          {text}
        </ConfirmButton>
      ) : (
        <button type="submit" className={`${primary ? btnPrimary : btnSecondary} ${small}`} aria-label={`${text} ${name}`}>
          {text}
        </button>
      )}
    </form>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <>
          {button("verified", "Verify", true)}
          {button("rejected", "Reject", false, `Reject ${name}? They won't appear on the site.`)}
        </>
      )}
      {status === "verified" && button("suspended", "Suspend", false, `Suspend ${name}? They'll disappear from the site until reinstated.`)}
      {(status === "suspended" || status === "rejected") && button("verified", status === "suspended" ? "Reinstate" : "Verify after all")}
    </div>
  );
}

export function ListingActions({ id, title, status }: { id: string; title: string; status: string }) {
  const button = (value: string, text: string, primary = false, confirm?: string) => (
    <form action={setListingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={value} />
      {confirm ? (
        <ConfirmButton message={confirm} className={`${primary ? btnPrimary : btnSecondary} ${small}`} aria-label={`${text} ${title}`}>
          {text}
        </ConfirmButton>
      ) : (
        <button type="submit" className={`${primary ? btnPrimary : btnSecondary} ${small}`} aria-label={`${text} ${title}`}>
          {text}
        </button>
      )}
    </form>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending_review" && (
        <>
          {button("live", "Approve", true)}
          {button("rejected", "Send back", false, `Send "${title}" back to the operator for changes? Email them what to fix.`)}
        </>
      )}
      {(status === "draft" || status === "rejected") &&
        button("live", "Approve and put live", true, `Put "${title}" live now? It hasn't been submitted for review.`)}
      {status === "live" && button("paused", "Pause", false, `Take "${title}" off the site?`)}
      {status === "paused" && button("live", "Put live again")}
    </div>
  );
}
