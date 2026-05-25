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
) {
  const baseRate =
    rackPrice * patternDiscount - dnOrDiscount / billingDaysSessions;

  const gst = (100 + (sgst + cgst)) / 100;

  const baseRateWithGst = baseRate * gst;
  const roundedBaseRateWithGst = Math.ceil(Number(baseRateWithGst));
  const roundedAmount =
    (100 * (roundedBaseRateWithGst - baseRateWithGst)) / gst;
  const costToMember = rackPrice * patternDiscount;
  const billingAmount = baseRate * billingDaysSessions * membersEnrolled;

  const cgstAmount =
    (billingAmount + processingCharge * membersEnrolled + roundedAmount) *
    (cgst / 100);

  const sgstAmount =
    (billingAmount + processingCharge * membersEnrolled + roundedAmount) *
    (sgst / 100);

  const totalDebitAmount =
    baseRate * billingDaysSessions * membersEnrolled +
    cgstAmount +
    sgstAmount +
    processingCharge * membersEnrolled +
    roundedAmount;
  let calculatedEndTime = startTime || "";
  if (attendingStartDate && startTime && sessionMinutes) {
    const startDateTime = parseISO(`${attendingStartDate}T${startTime}`);
    const endDateTime = addMinutes(startDateTime, sessionMinutes);
    calculatedEndTime = format(endDateTime, "HH:mm:ss");
  }
  return {
    baseRate,
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
