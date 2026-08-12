/**
 * FAS Auditing Core Mathematical Engine (Edge Function copy)
 * Kept in sync with math/impactAnalysis.js in the main repo -- same pure,
 * deterministic logic, ported to .ts only because Edge Functions deploy as
 * standalone bundles and can't reach across the repo at runtime. If the
 * source in math/impactAnalysis.js changes, this file needs the same change.
 */

const ROUND_DECIMALS = 4;

export function roundTo(value: number | null | undefined, decimals = ROUND_DECIMALS) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function buildDemographicMatrix(applicationRecords: { outcome: string; protected_class_cohort: string | null }[]) {
  const matrix: Record<string, { total: number; selected: number }> = {};
  for (const r of applicationRecords) {
    if (r.outcome !== 'hired' && r.outcome !== 'rejected') continue;
    const cohort = r.protected_class_cohort || 'undisclosed';
    matrix[cohort] ??= { total: 0, selected: 0 };
    matrix[cohort].total++;
    if (r.outcome === 'hired') matrix[cohort].selected++;
  }
  return matrix;
}

export function computeDisparateImpactRatio(matrix: Record<string, { total: number; selected: number }>) {
  const cohorts = Object.entries(matrix).map(([key, c]) => ({
    key,
    total: c.total,
    selected: c.selected,
    rate: c.total > 0 ? c.selected / c.total : 0,
  }));

  if (cohorts.length === 0) return { ratios: [] as any[], referenceGroup: null as string | null };

  const referenceGroup = cohorts.reduce((max, c) => (c.rate > max.rate ? c : max), cohorts[0]);

  const ratios = cohorts.map((c) => {
    const ratio = referenceGroup.rate > 0 ? roundTo(c.rate / referenceGroup.rate) : null;
    return {
      cohort: c.key,
      selectionRate: roundTo(c.rate),
      impactRatio: ratio,
      belowFourFifths: ratio !== null ? ratio < 0.8 : null,
    };
  });

  return { ratios, referenceGroup: referenceGroup.key };
}
