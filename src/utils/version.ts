/**
 * Dependency-free comparison of dotted numeric versions (e.g. "1.5.1").
 *
 * Returns -1 when `a < b`, 0 when equal, 1 when `a > b`. Any pre-release or
 * build suffix after a "-" or "+" is ignored, and missing trailing segments
 * count as 0 (so "1.5" === "1.5.0"). Non-numeric segments are treated as 0.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const parse = (v: string): number[] =>
    v
      .trim()
      .split(/[-+]/)[0]
      .split(".")
      .map((n) => {
        const parsed = parseInt(n, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      });

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}
