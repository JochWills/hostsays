import { DEPOSIT_RATE } from "../config";

export type BookingAmounts = {
  totalCents: number;
  depositCents: number;
  hostCommissionCents: number;
  platformCents: number;
  balanceCents: number;
};

/**
 * Booking money, per docs/02-business-rules.md. Pure and integer-only.
 * The server recomputes this from database prices when a request is made; anything shown in the
 * browser is a preview only.
 */
export function computeBookingAmounts(input: {
  unitPriceCents: number;
  isGroupPrice: boolean;
  people: number;
  /** The credited host's rate (e.g. 0.06), or null when no host is credited. */
  hostCommissionRate: number | null;
}): BookingAmounts {
  const { unitPriceCents, isGroupPrice, people, hostCommissionRate } = input;
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) throw new Error("Invalid price");
  if (!Number.isInteger(people) || people < 1) throw new Error("Invalid group size");

  const totalCents = isGroupPrice ? unitPriceCents : unitPriceCents * people;
  const depositCents = Math.round(totalCents * DEPOSIT_RATE);
  const hostCommissionCents =
    hostCommissionRate == null ? 0 : Math.min(Math.round(totalCents * hostCommissionRate), depositCents);

  return {
    totalCents,
    depositCents,
    hostCommissionCents,
    platformCents: depositCents - hostCommissionCents,
    balanceCents: totalCents - depositCents,
  };
}
