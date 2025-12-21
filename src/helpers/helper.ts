type DateInput = string | number | Date;
export const addDays = (date: DateInput, days: number): Date => {
  const result = new Date(date);

  if (isNaN(result.getTime())) {
    throw new Error("Invalid date provided to addDays function");
  }
  result.setDate(result.getDate() + Number(days));
  return result;
};

export const formatDate = (date: DateInput): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const isSameDay = (date1: DateInput, date2: DateInput): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
