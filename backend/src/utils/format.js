export const rupiah = (value = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

export const jakartaDateParts = (date = new Date()) => {
  const fmt = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    date: `${parts.day}/${parts.month}/${parts.year}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    isoDate: `${parts.year}-${parts.month}-${parts.day}`
  };
};

export const makeReceiptNo = () => {
  const now = new Date();
  const p = jakartaDateParts(now);
  const date = p.isoDate.replaceAll("-", "");
  const time = p.time.replaceAll(":", "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${date}-${time}-${rand}`;
};
