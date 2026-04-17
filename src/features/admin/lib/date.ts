const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateParts(value: string): DateParts {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  return { year, month, day };
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateYear(value: string) {
  return parseDateParts(value).year;
}

export function getDateMonth(value: string) {
  return parseDateParts(value).month;
}

export function formatDateOnly(value: string) {
  const { year, month, day } = parseDateParts(value);

  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatMonthOnly(value: string) {
  const { year, month } = parseDateParts(value);

  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function compareDateOnlyDescending(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  return left < right ? 1 : -1;
}
