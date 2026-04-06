import { addMinutes, format, parseISO } from "date-fns"

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
  attendingStartDate: string
) {

  const baseRate = rackPrice * patternDiscount - (dnOrDiscount / billingDaysSessions)
  const gst = (100 + (sgst + cgst)) / 100
  const baseRateWithGst = baseRate * gst
  const roundedBaseRateWithGst = Math.ceil(Number(baseRateWithGst))
  const roundedAmount = (100 * (roundedBaseRateWithGst - baseRateWithGst) / gst)
  const costToMember = rackPrice * patternDiscount
  const billingAmount = baseRate * billingDaysSessions * membersEnrolled
  const cgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (cgst / 100)
  const sgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (sgst / 100)
  const totalDebitAmount = (costToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + (processingCharge * membersEnrolled) + roundedAmount;
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
    calculatedEndTime
  }
}