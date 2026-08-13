/**
 * F.A.S. Canonical Jurisdiction Data Model
 * Single source of truth for all compliance pages.
 * Last verified: July 23, 2026
 */

const FAS_JURISDICTIONS = {

  ugesp: {
    id:         'ugesp',
    label:      'EEOC UGESP',
    fullName:   'Uniform Guidelines on Employee Selection Procedures',
    citation:   '29 C.F.R. Part 1607',
    enacted:    '1978',
    scope:      'ALL employers covered by Title VII (private + public)',
    icon:       '⚖️',
    color:      'navy',
    status:     'active',
    statusNote: 'EEOC guidance removed from EEOC.gov Jan 2025, but federal law remains fully in force',
    effectiveDate: null,
    burden:     'medium',
    penalty:    'Back pay, injunctive relief, attorney\'s fees, private litigation',
    coreRules: [
      '4/5ths rule — selection rate < 80% of highest group = adverse impact',
      'Job-related + consistent with business necessity defense required',
      'AI tools confirmed as "selection procedures" under UGESP (EEOC 2023)',
      '2+ year applicant flow data retention',
    ],
    fasCapabilities: [
      'Automated 4/5ths calculation per protected class',
      'Job-relatedness documentation workflow',
      'Validation study tracking',
      'Applicant flow reporting',
    ],
    alwaysActive: true,
  },

  nycll144: {
    id:         'nycll144',
    label:      'NYC Local Law 144',
    fullName:   'NYC Local Law 144 — Automated Employment Decision Tools',
    citation:   'NYC Admin. Code §20-870 et seq.',
    enacted:    '2023',
    scope:      'Employers using AEDT to screen or rank NYC candidates',
    icon:       '🗽',
    color:      'red',
    status:     'active',
    statusNote: 'Full requirements in effect',
    effectiveDate: '2023-07-05',
    burden:     'high',
    penalty:    '$500–$1,500 per violation per day',
    coreRules: [
      'Annual bias audit by independent third party required',
      '10-day advance notice to candidates before AEDT use',
      'Results published on company website',
      'Candidate may request alternative (human) review process',
    ],
    fasCapabilities: [
      'Automated annual audit scheduling',
      'Candidate notice tracking and logging',
      'Violation penalty calculator',
      'Audit result publication tracking',
    ],
  },

  coloradoSB189: {
    id:         'coloradoSB189',
    label:      'Colorado SB 189',
    fullName:   'Colorado SB 189 — Artificial Intelligence and Consumer Decisions (ADMT Act)',
    citation:   'C.R.S. §6-1-1801 et seq. (SB 26-189)',
    icon:       '🏔️',
    color:      'warning',
    status:     'delayed_rewritten',
    statusNote: 'SB 205 NEVER takes effect. Replaced by SB 189, signed May 14, 2026.',
    effectiveDate: '2027-01-01',
    burden:     'medium',
    penalty:    'Up to $20,000 per violation',
    legislativeHistory: [
      { date: '2024-05',    event: 'SB 205 passed — comprehensive requirements' },
      { date: '2025-08',    event: 'SB 205 delayed to June 30, 2026' },
      { date: '2026-05-12', event: 'SB 189 passed — full repeal and replacement of SB 205' },
      { date: '2026-05-14', event: 'Governor Polis signed SB 189' },
      { date: '2026-06-30', event: 'Original SB 205 NEVER takes effect (superseded)' },
      { date: '2027-01-01', event: 'SB 189 takes effect' },
    ],
    coreRules: [
      'Pre-use notice to consumers required',
      'Post-adverse-outcome disclosure within 30 days',
      '3-year record retention',
      '60-day cure period (new — not in SB 205)',
      'Up to $20,000/violation penalty',
    ],
    removedRequirements: [
      'Annual impact assessments (REMOVED)',
      'Risk management programs (REMOVED)',
      'Duty of care to prevent algorithmic discrimination (REMOVED)',
      'Public website disclosures (REMOVED)',
      '90-day AG notification (REMOVED)',
    ],
    fasCapabilities: [
      'Pre-use notice generation and tracking',
      'Post-decision disclosure automation (30-day deadline)',
      '3-year retention enforcement',
      'Cure period monitoring',
    ],
    scope: 'Employers using ADMT tools for consequential decisions about Colorado consumers',
  },

  illinoisHB3773: {
    id:         'illinoisHB3773',
    label:      'Illinois HB 3773',
    fullName:   'Illinois HB 3773 — Artificial Intelligence Video Interview Act (expanded)',
    citation:   'Pub. Act 103-0795',
    enacted:    '2025',
    scope:      'Employers using AI in employment decisions affecting Illinois residents',
    icon:       '🌾',
    color:      'warning',
    status:     'active',
    statusNote: 'Active since January 1, 2026',
    effectiveDate: '2026-01-01',
    burden:     'medium',
    penalty:    'Civil rights violation — IL Human Rights Act damages',
    coreRules: [
      'AI notice to employees and applicants required',
      'Strict liability for discriminatory effects (intent irrelevant)',
      'Zip code proxy discrimination explicitly banned',
      '4-year record retention',
    ],
    fasCapabilities: [
      'Notice tracking and logging',
      'Zip code proxy detection in ATS rules',
      '4-year retention enforcement',
      'Strict liability exposure alerts',
    ],
  },

  californiaAB1018: {
    // Object key/id kept as-is (internal identifier only, never rendered to
    // users) to avoid a schema migration on org_settings.j_caab1018 — content
    // below was corrected 2026-07-23. AB-1018 and the earlier AB-2930 both
    // stalled/were ordered inactive; neither is law. California's real
    // framework is the FEHA/CPPA regulatory track below. See California.md.
    id:         'californiaAB1018',
    label:      'California — CRC FEHA + CPPA ADMT',
    fullName:   'California FEHA Automated-Decision-System Regulations + CPPA ADMT Regulations',
    citation:   '2 CCR §11008 et seq. (FEHA) · Cal. Code Regs. tit. 11 (CPPA)',
    scope:      'FEHA: employers with 5+ CA employees, no revenue threshold. CPPA: businesses with $26.6M+ revenue or high-volume consumer data processing.',
    icon:       '🌉',
    color:      'warning',
    status:     'active',
    statusNote: 'FEHA ADS regulations in force since October 1, 2025; CPPA ADMT regulations effective January 1, 2027',
    effectiveDate: '2025-10-01',
    burden:     'high',
    penalty:    'FEHA: standard disparate-impact liability (back pay, damages). CPPA: up to $2,500/violation, $7,500 if intentional.',
    coreRules: [
      'FEHA: disparate impact prohibited on any ADS-derived selection criterion, 5+ employee threshold',
      'FEHA: absence of anti-bias testing is evidence of liability; independent audits strengthen the affirmative defense',
      'FEHA: 4-year retention for all ADS inputs, outputs, and decision criteria',
      'CPPA (eff. Jan 1, 2027): pre-use notice, risk assessments, opt-out rights for "significant decisions"',
    ],
    fasCapabilities: [
      'FEHA disparate-impact testing and documentation',
      'Independent-audit affirmative-defense evidence package',
      '4-year retention enforcement',
      'CPPA readiness tracking ahead of January 1, 2027',
    ],
  },

  ofccp: {
    id:         'ofccp',
    label:      'OFCCP',
    fullName:   'Office of Federal Contract Compliance Programs',
    citation:   '41 C.F.R. Parts 60-1, 60-300, 60-741',
    scope:      'Federal contractors/subcontractors ($50K+ Section 503; $200K+ VEVRAA)',
    icon:       '🏛️',
    color:      'info',
    status:     'active',
    statusNote: 'Active — applies only to qualifying federal contractors',
    effectiveDate: null,
    burden:     'medium',
    penalty:    'Contract debarment, back pay, corrective action, public listing',
    coreRules: [
      '2-year record retention (AI inputs, logs, hiring records)',
      'UGESP disparate impact analysis (4/5ths rule) required',
      'Written AAP under Section 503 (disability) and VEVRAA (veterans)',
      'Vendor contract audit access clause required',
      'Self-ID tracking: protected veteran and disability (pre-offer + post-offer)',
      'VEVRAA hiring benchmark: 5.1% (as of July 2025)',
    ],
    fasCapabilities: [
      'Federal contractor status detection and tracking',
      'AAP expiration alerts',
      'Self-ID invitation rate monitoring',
      'Vendor audit access clause verification',
      'VEVRAA benchmark tracking (5.1% target)',
      'Internet Applicant Rule compliance logging',
    ],
    contractorOnly: true,
    vevraaBenchmark: 0.051,
  },

  euAIAct: {
    id:         'euAIAct',
    label:      'EU AI Act',
    fullName:   'EU Artificial Intelligence Act — High-Risk Employment AI',
    citation:   'Regulation (EU) 2024/1689',
    scope:      'Organizations using AI in employment within EU jurisdiction',
    icon:       '🇪🇺',
    color:      'info',
    status:     'active_building',
    statusNote: 'High-risk employment AI requirements pushed to December 2, 2027 under the EU Digital Omnibus agreement (pending formal EU adoption)',
    effectiveDate: '2027-12-02',
    burden:     'high',
    penalty:    'Up to €15M or 3% of global annual turnover (high-risk-system tier)',
    coreRules: [
      'High-risk classification for employment AI systems',
      'Human oversight of high-risk AI decisions required',
      'Conformity assessment before deployment',
      'Technical documentation and logging obligations',
      'Transparency to affected individuals',
    ],
    fasCapabilities: [
      'High-risk classification check and documentation',
      'Human oversight logging (HOTL audit trail)',
      'EU compliance reporting package',
      'Transparency disclosure generation',
    ],
    globalOnly: true,
  },

};

// Ordered for display (foundation first, then jurisdictions)
const FAS_JURISDICTION_ORDER = [
  'ugesp', 'nycll144', 'coloradoSB189', 'illinoisHB3773',
  'californiaAB1018', 'ofccp', 'euAIAct',
];

const FAS_BURDEN_LABELS = {
  high:   { label: 'High', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  medium: { label: 'Medium', color: '#ca8a04', bg: '#fefce8', border: '#fde68a' },
  low:    { label: 'Low', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

const FAS_STATUS_LABELS = {
  active:           { label: 'Active', icon: '●', color: '#16a34a' },
  active_building:  { label: 'Building', icon: '◑', color: '#ca8a04' },
  delayed_rewritten:{ label: 'Delayed & Rewritten', icon: '⚠', color: '#dc2626' },
  pending:          { label: 'Pending', icon: '○', color: '#94a3b8' },
};

// Helper: get jurisdiction by id
function getJurisdiction(id) {
  return FAS_JURISDICTIONS[id] || null;
}

// Helper: get all active jurisdictions for a given org config
function getActiveJurisdictions({ isFederalContractor = false, isGlobal = false } = {}) {
  return FAS_JURISDICTION_ORDER
    .map(id => FAS_JURISDICTIONS[id])
    .filter(j => {
      if (j.contractorOnly && !isFederalContractor) return false;
      if (j.globalOnly && !isGlobal) return false;
      return true;
    });
}

if (typeof module !== 'undefined') module.exports = { FAS_JURISDICTIONS, FAS_JURISDICTION_ORDER, getJurisdiction, getActiveJurisdictions };
