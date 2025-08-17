export const getEntityId = (v: any) => (typeof v === "string" ? v : v?._id || v?.id);

export const safeToArray = <T,>(x: T[] | T | null | undefined): T[] =>
  Array.isArray(x) ? x : x ? [x as T] : [];
