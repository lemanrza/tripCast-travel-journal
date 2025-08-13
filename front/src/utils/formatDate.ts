
function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" });
}
export default formatDate;