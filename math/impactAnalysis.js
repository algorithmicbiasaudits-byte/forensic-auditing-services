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
 * Chi-square test of independence across the full cohort x outcome
 * contingency table -- tests whether selection outcome is independent of
 * protected-class membership across ALL cohorts at once (omnibus), rather
 * than pairwise against a single reference group like computeZScore().
 * Standard 2 x k contingency table: each cohort's (selected, not-selected)
 * counts vs. the pooled total.
 *
 * Validity assumption (standard chi-square requirement, not a stylistic
 * choice): every expected cell count must be >= 5. Below that, the
 * chi-square approximation is unreliable -- same discipline as
 * computeZScore()'s n>=30 floor, just the correct threshold for this test.
 */
const CHI_SQUARE_CRITICAL_VALUES_ALPHA_05 = {
  1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
  6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307,
  11: 19.675, 12: 21.026, 13: 22.362, 14: 23.685, 15: 24.996,
};

export function computeChiSquare(matrix) {
  const cohorts = Object.entries(matrix)
    .map(([key, c]) => ({ key, total: c.total, selected: c.selected, notSelected: c.total - c.selected }))
    .filter(c => c.total > 0);

  if (cohorts.length < 2) {
    return { chiSquare: null, degreesOfFreedom: null, significant: null, reason: 'fewer than 2 cohorts with data' };
  }

  const grandSelected = cohorts.reduce((s, c) => s + c.selected, 0);
  const grandNotSelected = cohorts.reduce((s, c) => s + c.notSelected, 0);
  const grandTotal = grandSelected + grandNotSelected;

  if (grandTotal === 0) {
    return { chiSquare: null, degreesOfFreedom: null, significant: null, reason: 'no resolved outcomes' };
  }

  let chiSquare = 0;
  let minExpected = Infinity;

  for (const c of cohorts) {
    const expectedSelected = (c.total * grandSelected) / grandTotal;
    const expectedNotSelected = (c.total * grandNotSelected) / grandTotal;
    minExpected = Math.min(minExpected, expectedSelected, expectedNotSelected);
    if (expectedSelected > 0) chiSquare += ((c.selected - expectedSelected) ** 2) / expectedSelected;
    if (expectedNotSelected > 0) chiSquare += ((c.notSelected - expectedNotSelected) ** 2) / expectedNotSelected;
  }

  const degreesOfFreedom = cohorts.length - 1;

  if (minExpected < 5) {
    return {
      chiSquare: roundTo(chiSquare),
      degreesOfFreedom,
      significant: null,
      reason: 'expected cell count below 5 in at least one cohort — chi-square validity assumption not met',
    };
  }

  const critical = CHI_SQUARE_CRITICAL_VALUES_ALPHA_05[degreesOfFreedom];
  return {
    chiSquare: roundTo(chiSquare),
    degreesOfFreedom,
    significant: critical !== undefined ? chiSquare >= critical : null,
    reason: critical === undefined ? 'degrees of freedom exceed critical-value table range (>15 cohorts)' : null,
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
  const chiSquare = hasResolvedData ? computeChiSquare(matrix) : null;
  const pendingByCohort = computePendingByCohort(applicationRecords);

  return {
    proxyRatios,
    disparateImpact,
    chiSquare,
    pendingByCohort,
    dataQualityWarning: hasResolvedData
      ? null
      : 'No resolved (hired/rejected) applications available — disparate impact ratios not computed.',
  };
}
