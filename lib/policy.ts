import { CONFIRM_WINDOW_HOURS, FREE_CANCELLATION_DAYS } from "./config";

/** Standard cancellation policy (docs/02-business-rules.md). Must be shown before payment. */
export const CANCELLATION_POLICY = `Free cancellation up to ${FREE_CANCELLATION_DAYS} days before. Within ${FREE_CANCELLATION_DAYS} days, the deposit is non-refundable. If the operator cancels, you get a full refund.`;

export function requestNote(operatorName: string) {
  return `No payment now. ${operatorName} will confirm within ${CONFIRM_WINDOW_HOURS} hours.`;
}
