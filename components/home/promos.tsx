import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEPOSIT_RATE, HOST_COMMISSION_RATE } from "@/lib/config";
import { formatPercent } from "@/lib/format";

const promo = "relative min-h-[250px] rounded-[14px] bg-panel px-[22px] py-[26px]";
const promoBtn =
  "inline-flex items-center gap-2.5 rounded-[14px] bg-green px-[22px] py-[11px] text-[14px] font-semibold whitespace-nowrap text-green-ink hover:brightness-110";

export function HostPromo() {
  return (
    <section className={`${promo} flex-1`} id="for-hosts" aria-labelledby="promo-hosts">
      <small className="text-[11.5px] font-medium text-muted">For guesthouses, B&amp;Bs and hotels</small>
      <h3 id="promo-hosts" className="mt-1.5 mb-3 text-[20px] leading-[1.2] font-bold tracking-[-0.015em] sm:max-w-[220px]">
        Your guests ask what to do. Earn when they book.
      </h3>
      <p className="mb-[22px] text-[13.5px] leading-[1.45] text-muted sm:max-w-[210px]">
        Get a free HostSays page with your recommended experiences, and earn {formatPercent(HOST_COMMISSION_RATE)} on
        every booking your guests make.
      </p>
      <Link href="/for-hosts" className={promoBtn}>
        Join as a host <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </Link>
      {/* Tilted storefront preview. Decorative. */}
      <div
        aria-hidden="true"
        className="absolute top-[22px] right-4 hidden w-[172px] rotate-3 rounded-[10px] bg-white px-1.5 pt-1.5 pb-3 text-[#1E2723] shadow-[0_12px_30px_rgba(0,0,0,.18)] sm:block lg:-right-[26px]"
      >
        <div className="h-[92px] rounded-md bg-[url(/images/room.jpg)] bg-cover bg-center" />
        <div className="mx-1 mt-2.5 mb-2 text-[10.5px] leading-[1.3] text-[#5b615c]">
          hostsays.com/onthebay
          <br />
          <b className="text-[#1E2723]">Our picks near you</b>
        </div>
        <div className="flex gap-[5px] px-[3px]">
          <i className="block h-[58px] flex-1 rounded-[5px] bg-[url(/images/mini1.jpg)] bg-cover bg-center" />
          <i className="block h-[58px] flex-1 rounded-[5px] bg-[url(/images/mini2.jpg)] bg-cover bg-center" />
          <i className="block h-[58px] flex-1 rounded-[5px] bg-[url(/images/seal.jpg)] bg-cover bg-center" />
        </div>
      </div>
    </section>
  );
}

export function OperatorPromo() {
  return (
    <section className={`${promo} min-h-[210px] flex-1`} id="for-operators" aria-labelledby="promo-ops">
      <small className="text-[11.5px] font-medium text-muted">For tourism operators</small>
      <h3 id="promo-ops" className="mt-1.5 mb-3 text-[20px] leading-[1.2] font-bold tracking-[-0.015em] sm:max-w-[220px]">
        Reach travellers through trusted local stays.
      </h3>
      <p className="mb-[22px] text-[13.5px] leading-[1.45] text-muted sm:max-w-[250px]">
        List your experience for free. No monthly fees: you only pay {formatPercent(DEPOSIT_RATE)} on completed bookings,
        and we collect it for you.
      </p>
      <Link href="/signup?as=operator" className={promoBtn}>
        List your experience <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </Link>
    </section>
  );
}
