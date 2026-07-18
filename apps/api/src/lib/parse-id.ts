/** Parse a positive-integer path id, or null if it isn't one (callers → 404). */
export const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};
