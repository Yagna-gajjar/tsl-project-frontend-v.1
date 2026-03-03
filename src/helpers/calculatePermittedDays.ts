function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days));
  return result;
}

export const calsPermittedDays = ({ oldBillingAmount, pc, cgst, sgst, unitRate, startDays }: { oldBillingAmount: number, pc: number, cgst: number, sgst: number, unitRate: number, startDays: string }) => {
  const oldBillingAmountAfGst = (((oldBillingAmount * 100) / (Number(cgst) + Number(sgst) + 100)) - Number(pc ? pc : 0))

  const permittedDays = Math.floor(oldBillingAmountAfGst / Number(unitRate))

  const billable = (permittedDays * Number(unitRate) + Number(pc ? pc : 0));

  const billWithGst = ((billable * (Number(cgst) + Number(sgst) + 100)) / 100)

  const diff = oldBillingAmount - billWithGst

  const roundedAmount = ((diff * 100) / (Number(cgst) + Number(sgst) + 100))

  const finalBillingAmount = ((Number(unitRate) * permittedDays) + Number(pc ? pc : 0))
  const totalDebitedAmmount = ((finalBillingAmount * ((Number(cgst) + Number(sgst)) + 100)) / 100) + ((roundedAmount * ((Number(cgst) + Number(sgst)) + 100)) / 100)
  const endDate = addDays(new Date(startDays), (permittedDays - 1))
  return { roundedAmount, finalBillingAmount, totalDebitedAmmount, permittedDays, endDate }
}