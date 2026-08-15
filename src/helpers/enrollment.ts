import { addMinutes, format, parseISO } from "date-fns";

export function getFinalAmounts(
  rackPrice: number,
  patternDiscount: number,
  dnOrDiscount: number,
  billingDaysSessions: number,
  processingCharge: number,
  sgst: number,
  cgst: number,
  membersEnrolled: number,
  startTime: string,
  sessionMinutes: number,
  attendingStartDate: string,
  hasDnAccount: boolean = false,
) {
  // Enrolment Rules sheet, item 20/22: the member's discounted per-unit rate.
  const discountedRate =
    rackPrice * patternDiscount - dnOrDiscount / billingDaysSessions;

  // Item 26: when a debit-note/discount account absorbs the discount, the
  // rounding base uses the full undiscounted rack price instead.
  const roundingBaseRate = hasDnAccount
    ? rackPrice * patternDiscount
    : discountedRate;

  const gstFactor = 100 + sgst + cgst; // "B" in the spec (percentage scale, e.g. 118)

  const totalBeforeRounding =
    roundingBaseRate * billingDaysSessions + processingCharge; // "A"
  const totalWithGst = totalBeforeRounding * (gstFactor / 100); // "X"
  const roundedTotalWithGst = Math.ceil(totalWithGst); // "Y"
  const roundingGap = roundedTotalWithGst - totalWithGst; // "Z"
  const roundedAmount = (100 * roundingGap) / gstFactor;

  // Item 25: the member's true net cost always nets the discount, regardless
  // of who bears it.
  const costToMember = discountedRate + roundedAmount;

  // Item 24: the per-unit rate actually billed — just the discount portion
  // when a debit-note/discount account is absorbing it.
  const perUnitBillRate = hasDnAccount
    ? dnOrDiscount / billingDaysSessions
    : discountedRate;
  const billingRate = perUnitBillRate + roundedAmount;

  // Item 27: billed off billingRate (which already includes the rounding
  // correction), not the raw discounted rate.
  const billingAmount = billingRate * billingDaysSessions * membersEnrolled;

  // Items 28/29: processingCharge is a flat charge, not per member.
  const cgstAmount = (billingAmount + processingCharge) * (cgst / 100);
  const sgstAmount = (billingAmount + processingCharge) * (sgst / 100);

  // Item 30: built off costToMember (roundedAmount already folded in), plus
  // a single flat processingCharge.
  const totalDebitAmount =
    costToMember * billingDaysSessions * membersEnrolled +
    cgstAmount +
    sgstAmount +
    processingCharge;

  let calculatedEndTime = startTime || "";
  if (attendingStartDate && startTime && sessionMinutes) {
    const startDateTime = parseISO(`${attendingStartDate}T${startTime}`);
    const endDateTime = addMinutes(startDateTime, sessionMinutes);
    calculatedEndTime = format(endDateTime, "HH:mm:ss");
  }
  return {
    baseRate: discountedRate,
    billingRate,
    roundedAmount,
    costToMember,
    billingAmount,
    cgstAmount,
    sgstAmount,
    totalDebitAmount,
    calculatedEndTime,
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days));
  return result;
}

export const calsPermittedDays = ({
  oldBillingAmount,
  pc,
  cgst,
  sgst,
  unitRate,
  startDays,
}: {
  oldBillingAmount: number;
  pc: number;
  cgst: number;
  sgst: number;
  unitRate: number;
  startDays: string;
}) => {
  const oldBillingAmountAfGst =
    (oldBillingAmount * 100) / (Number(cgst) + Number(sgst) + 100) -
    Number(pc ? pc : 0);

  const permittedDays = Math.floor(oldBillingAmountAfGst / Number(unitRate));

  const billable = permittedDays * Number(unitRate) + Number(pc ? pc : 0);

  const billWithGst = (billable * (Number(cgst) + Number(sgst) + 100)) / 100;

  const diff = oldBillingAmount - billWithGst;

  const roundedAmount = (diff * 100) / (Number(cgst) + Number(sgst) + 100);

  const finalBillingAmount =
    Number(unitRate) * permittedDays + Number(pc ? pc : 0);
  const totalDebitedAmmount =
    (finalBillingAmount * (Number(cgst) + Number(sgst) + 100)) / 100 +
    (roundedAmount * (Number(cgst) + Number(sgst) + 100)) / 100;
  const endDate = addDays(new Date(startDays), permittedDays - 1);
  return {
    roundedAmount,
    finalBillingAmount,
    totalDebitedAmmount,
    permittedDays,
    endDate,
  };
};
