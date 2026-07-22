/**
 * FAS Auditing Core Mathematical Engine
 * Pure, deterministic calculations with zero external side effects or LLM dependencies.
 * Core Reference: Enforces Section 3 of Master-Narrative.md.
 */

const ROUND_DECIMALS = 4;

export function roundTo(value, decimals = ROUND_DECIMALS) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Evaluates operational risk rates via raw application proxy flags
 * Restructured to look exclusively at REJECTED records to prevent metric dilution.
 */
export function computeProxyImpactRatios(applicationRecords) {
  const rejectedRecords = applicationRecords.filter(r => r.outcome === 'rejected');
  const total = rejectedRecords.length;

  if (total === 0) {
    return {
      overall: { gapFlagRate: 0, keywordFlagRate: 0 },
      byJobTitle: {}
    };
  }

  let gapFlagged = 0, keywordFlagged = 0;
  const byJobTitle = {};

  for (const r of rejectedRecords) {
    if (r.employment_gap_flagged) gapFlagged++;
    if (r.keyword_mismatch_flagged) keywordFlagged++;

    const title = r.job_title || 'unspecified';
    byJobTitle[title] ??= { total: 0, gapFlagged: 0, keywordFlagged: 0 };
    byJobTitle[title].total++;

    if (r.employment_gap_flagged) byJobTitle[title].gapFlagged++;
    if (r.keyword_mismatch_flagged) byJobTitle[title].keywordFlagged++;
  }

  const byJobTitleRates = Object.fromEntries(
    Object.entries(byJobTitle).map(([title, c]) => [
      title,
      {
        gapFlagRate: roundTo(c.gapFlagged / c.total),
        keywordFlagRate: roundTo(c.keywordFlagged / c.total),
      }
    ])
  );

  return {
    overall: {
      gapFlagRate: roundTo(gapFlagged / total),
      keywordFlagRate: roundTo(keywordFlagged / total)
    },
    byJobTitle: byJobTitleRates,
  };
}

/**
 * Compiles the real demographic matrix directly from application records —
 * no external baseline input. Pool totals ARE the real applications table:
 * every candidate event already carries protected_class_cohort and outcome.
 *
 * Only resolved outcomes ('hired'/'rejected') count toward the pool —
 * 'pending' applications are deliberately excluded from the ratio math.
 * Including an undecided candidate in the denominator without counting them
 * as selected would understate the selection rate for any cohort with more
 * in-flight applicants at calculation time — a processing-lag artifact, not
 * a bias signal. Pending volume is tracked separately, not silently
 * dropped — see computePendingByCohort().
 */
export function buildDemographicMatrix(applicationRecords) {
  const matrix = {};
  for (const r of applicationRecords) {
    if (r.outcome !== 'hired' && r.outcome !== 'rejected') continue;
    const cohort = r.protected_class_cohort || 'undisclosed';
    matrix[cohort] ??= { total: 0, selected: 0 };
    matrix[cohort].total++;
    if (r.outcome === 'hired') matrix[cohort].selected++;
  }
  return matrix;
}

/**
 * Pending (undecided) counts per cohort — a data-quality signal, deliberately
 * kept out of the ratio math above but surfaced so a cohort with a large
 * undecided backlog isn't silently misread as having a small applicant pool.
 */
export function computePendingByCohort(applicationRecords) {
  const pending = {};
  for (const r of applicationRecords) {
    if (r.outcome !== 'pending') continue;
    const cohort = r.protected_class_cohort || 'undisclosed';
    pending[cohort] = (pending[cohort] || 0) + 1;
  }
  return pending;
}

/**
 * Core 4/5ths Rule selection metric calculation logic
 */
export function computeDisparateImpactRatio(matrix) {
  const cohorts = Object.entries(matrix).map(([key, c]) => ({
    key,
    total: c.total,
    selected: c.selected,
    rate: c.total > 0 ? c.selected / c.total : 0,
  }));

  if (cohorts.length === 0) return { ratios: [], referenceGroup: null };

  // Fixed Bug: Properly seeds the accumulator with the first cohort element object
  const referenceGroup = cohorts.reduce((max, c) => (c.rate > max.rate ? c : max), cohorts[0]);

  const ratios = cohorts.map((c) => {
    const ratio = referenceGroup.rate > 0 ? roundTo(c.rate / referenceGroup.rate) : null;
    return {
      cohort: c.key,
      selectionRate: roundTo(c.rate),
      impactRatio: ratio,
      belowFourFifths: ratio !== null ? ratio < 0.8 : null
    };
  });

  return { ratios, referenceGroup: referenceGroup.key };
}

/**
 * Evaluates two-proportion Z-score checks across demographics
 */
export function computeZScore(group, referenceGroup) {
  const { selected: x1, total: n1 } = group;
  const { selected: x2, total: n2 } = referenceGroup;

  // Protect against sample sizes dropping lower than standard statutory minimum limits
  if (n1 < 30 || n2 < 30) {
    return { zScore: null, significant: null, reason: 'sample size below n>=30 minimum' };
  }

  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPooled = (x1 + x2) / (n1 + n2);

  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
  if (se === 0) {
    return { zScore: null, significant: null, reason: 'zero variance in pooled rate' };
  }

  const z = (p1 - p2) / se;
  return {
    zScore: roundTo(z),
    significant: Math.abs(z) >= 1.96 // Standard 95% threshold criteria boundary check
  };
}

/**
 * Unified calculation orchestrator interface.
 * No external baseline input — the real applicant pool is derived directly
 * from applicationRecords (see buildDemographicMatrix()).
 */
export function analyze(applicationRecords) {
  const proxyRatios = computeProxyImpactRatios(applicationRecords);
  const matrix = buildDemographicMatrix(applicationRecords);
  const hasResolvedData = Object.keys(matrix).length > 0;

  const disparateImpact = hasResolvedData ? computeDisparateImpactRatio(matrix) : null;
  const pendingByCohort = computePendingByCohort(applicationRecords);

  return {
    proxyRatios,
    disparateImpact,
    pendingByCohort,
    dataQualityWarning: hasResolvedData
      ? null
      : 'No resolved (hired/rejected) applications available — disparate impact ratios not computed.',
  };
}
