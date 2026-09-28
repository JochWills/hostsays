import { CONFIRM_WINDOW_HOURS, DEPOSIT_RATE } from "@/lib/config";
import { formatPercent } from "@/lib/format";

export const BOOKING_STEPS = [
  { title: "Request", body: "Pick a date and group size and send a request. It's free." },
  {
    title: "Operator confirms",
    body: `The operator confirms within ${CONFIRM_WINDOW_HOURS} hours, and we email you.`,
  },
  {
    title: `Pay ${formatPercent(DEPOSIT_RATE)} deposit`,
    body: "Secure your spot online. It counts toward the total price.",
  },
  { title: "Go", body: "Pay the balance to the operator on the day and enjoy it." },
];

export function HowSteps({ id = "how" }: { id?: string }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="mt-9 grid grid-cols-1 items-start gap-6 rounded-[14px] bg-surface px-[clamp(18px,3vw,36px)] py-7 shadow-card sm:grid-cols-2 lg:grid-cols-[260px_repeat(4,1fr)]"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <h2 id={`${id}-title`} className="m-0 text-[20px] font-bold">
          How booking works
        </h2>
        <p className="mt-1.5 text-[13.5px] text-muted">No payment until your booking is confirmed.</p>
      </div>
      {BOOKING_STEPS.map((s, i) => (
        <div key={s.title}>
          <b className="flex items-center gap-2.5 text-[14.5px]">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-green text-[13px] text-green-ink">
              {i + 1}
            </span>
            {s.title}
          </b>
          <p className="mt-2 text-[13px] text-muted">{s.body}</p>
        </div>
      ))}
    </section>
  );
}
