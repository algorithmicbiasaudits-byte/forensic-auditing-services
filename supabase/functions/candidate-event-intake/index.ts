import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { buildDemographicMatrix, computeDisparateImpactRatio } from "./impactAnalysis.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature-256, x-timestamp',
}

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60
const RATE_LIMIT_PER_MINUTE = 60

/**
 * Heuristic ingestion pre-processor for tracking screening proxies.
 * Treat these arrays as initial baselines to be tuned against real-world ATS data logs.
 */
function computeProxyFlags(rejectionReason: string | null) {
  if (!rejectionReason) {
    return { employment_gap_flagged: false, keyword_mismatch_flagged: false };
  }

  const normalized = rejectionReason.toLowerCase();

  const gapKeywords = ['gap', 'unemployed', 'inactivity', 'break in employment', 'resume hiatus'];
  const mismatchKeywords = ['mismatch', 'missing core skills', 'insufficient keywords', 'fail qualification filter', 'mismatched criteria'];

  return {
    employment_gap_flagged: gapKeywords.some(keyword => normalized.includes(keyword)),
    keyword_mismatch_flagged: mismatchKeywords.some(keyword => normalized.includes(keyword))
  };
}

/**
 * Second pair of heuristic flags, same "baseline to be tuned" status as
 * computeProxyFlags() above -- not a claim of sophisticated NLP, just
 * keyword pattern matching on the ATS-supplied rejection reason text.
 */
function computeSecondaryFlags(rejectionReason: string | null) {
  if (!rejectionReason) {
    return { proxy_discrimination_detected: false, legal_trigger_flagged: false };
  }

  const normalized = rejectionReason.toLowerCase();

  // Baseline proxy-for-protected-characteristic language (age/culture-fit
  // proxies most commonly cited in EEOC guidance and case law)
  const proxyKeywords = ['culture fit', 'not a good fit', 'overqualified', 'energy level', 'too experienced', 'digital native'];

  // Baseline direct references to protected characteristics -- presence
  // alone warrants human legal review, doesn't presume a violation
  const legalKeywords = ['pregnan', 'maternity', 'disab', 'religio', 'age', 'national origin', 'family status', 'medical leave'];

  return {
    proxy_discrimination_detected: proxyKeywords.some(k => normalized.includes(k)),
    legal_trigger_flagged: legalKeywords.some(k => normalized.includes(k)),
  };
}

async function hmacHex(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time string comparison -- avoids leaking match-length via response timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * HITL pipeline fix, 2026-08-08: for auditing_plus_hitl customers, a
 * rejected application must also become a case the live review queue
 * (rejections.html/rejection-detail.html/escalation-queue.html) can see.
 * Before this, applications and rejections/audits were structurally
 * disconnected -- nothing promoted one into the other. Auditing-only
 * customers never reach this path; their applications feed the
 * statistical engine (math/impactAnalysis.js) directly, unchanged.
 */
async function promoteToHitlCase(
  supabaseClient: ReturnType<typeof createClient>,
  customerId: number,
  hashedCandidateId: string,
  fields: {
    job_id: string; job_title: string; rejection_reason_from_ats: string | null;
    years_experience: number | null; education_level: string | null; skills: string[];
    ats_source: string; protected_class_cohort: string; occurred_at: string;
  },
  proxyMetrics: { employment_gap_flagged: boolean; keyword_mismatch_flagged: boolean }
) {
  const secondaryFlags = computeSecondaryFlags(fields.rejection_reason_from_ats)

  // Real 4/5ths check, not a heuristic -- reuses the actual statistical
  // engine against this customer's current applicant pool to see whether
  // this candidate's own cohort is presently below the 4/5ths threshold.
  let disparateImpactDetected = false
  const { data: pool } = await supabaseClient
    .from('applications')
    .select('outcome, protected_class_cohort')
    .eq('customer_id', customerId)
  if (pool && pool.length > 0) {
    const matrix = buildDemographicMatrix(pool as any)
    const { ratios } = computeDisparateImpactRatio(matrix)
    const cohortRatio = ratios.find(r => r.cohort === fields.protected_class_cohort)
    disparateImpactDetected = cohortRatio?.belowFourFifths === true
  }

  const riskLevel =
    (disparateImpactDetected || secondaryFlags.legal_trigger_flagged) ? 'red' :
    (proxyMetrics.employment_gap_flagged || proxyMetrics.keyword_mismatch_flagged || secondaryFlags.proxy_discrimination_detected) ? 'orange' :
    'green'

  const { data: rejection, error: rejError } = await supabaseClient
    .from('rejections')
    .insert({
      customer_id: customerId,
      candidate_id: hashedCandidateId,
      job_id: fields.job_id,
      job_title: fields.job_title,
      rejection_reason_from_ats: fields.rejection_reason_from_ats,
      years_experience: fields.years_experience,
      education_level: fields.education_level,
      skills: fields.skills,
      ats_source: fields.ats_source,
      protected_class_cohort: fields.protected_class_cohort,
      created_at: fields.occurred_at,
    })
    .select('rejection_id')
    .single()

  if (rejError || !rejection) {
    console.error('HITL promotion failed at rejections insert:', rejError?.message)
    return
  }

  const { error: auditError } = await supabaseClient
    .from('audits')
    .insert({
      rejection_id: rejection.rejection_id,
      risk_level: riskLevel,
      employment_gap_flagged: proxyMetrics.employment_gap_flagged,
      keyword_mismatch_flagged: proxyMetrics.keyword_mismatch_flagged,
      proxy_discrimination_detected: secondaryFlags.proxy_discrimination_detected,
      disparate_impact_detected: disparateImpactDetected,
      legal_trigger_flagged: secondaryFlags.legal_trigger_flagged,
      audit_timestamp: new Date().toISOString(),
    })

  if (auditError) {
    console.error('HITL promotion failed at audits insert:', auditError.message)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or malformed Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const apiKey = authHeader.split(' ')[1]

    const apiKeyHashSecret = Deno.env.get('API_KEY_HASH_SECRET')
    if (!apiKeyHashSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: API_KEY_HASH_SECRET missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const hashedApiKey = await hmacHex(apiKey, apiKeyHashSecret)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('customer_id, plan, webhook_signing_secret')
      .eq('api_key_hash', hashedApiKey)
      .single()

    if (customerError || !customer) {
      return new Response(JSON.stringify({ error: 'Invalid API Key / Unauthorized customer pipeline' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Payload signature verification ──────────────────────────────────────
    // Proves the request body wasn't tampered with or replayed -- separate
    // from the API key check above, which only proves the caller holds a
    // valid credential. Signed over the raw body text (before JSON parsing)
    // concatenated with the timestamp, so a captured request can't be
    // replayed later even with a valid signature.
    const signatureHeader = req.headers.get('X-Signature-256')
    const timestampHeader = req.headers.get('X-Timestamp')
    const rawBody = await req.text()

    if (!signatureHeader || !timestampHeader) {
      return new Response(JSON.stringify({ error: 'Missing X-Signature-256 or X-Timestamp header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const requestTime = Number(timestampHeader)
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (!Number.isFinite(requestTime) || Math.abs(nowSeconds - requestTime) > SIGNATURE_TOLERANCE_SECONDS) {
      return new Response(JSON.stringify({ error: 'Request timestamp outside allowed window' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!customer.webhook_signing_secret) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: no signing secret on file for this customer' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const expectedSignature = await hmacHex(`${timestampHeader}.${rawBody}`, customer.webhook_signing_secret)
    if (!timingSafeEqual(signatureHeader, expectedSignature)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const { data: withinLimit, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', { p_customer_id: customer.customer_id, p_limit: RATE_LIMIT_PER_MINUTE })

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError.message)
    } else if (withinLimit === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = JSON.parse(rawBody)

    const {
      event_id, candidate_id, job_id, job_title, outcome,
      rejection_reason_from_ats, years_experience, education_level,
      skills, ats_source, protected_class_cohort, demographic_source, occurred_at
    } = body

    if (!candidate_id || !job_id || !job_title || !outcome || !occurred_at) {
      return new Response(JSON.stringify({ error: 'Required fields missing from payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const validOutcomes = ['hired', 'rejected', 'pending']
    if (!validOutcomes.includes(outcome)) {
      return new Response(JSON.stringify({ error: `Invalid outcome value. Expected one of: ${validOutcomes.join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const validCohorts = ['hispanic_or_latino','white','black_or_african_american','native_hawaiian_or_pacific_islander','asian','american_indian_or_alaska_native','two_or_more_races','undisclosed','protected_veteran','individual_with_disability','non_protected_veteran','no_disability']
    if (protected_class_cohort && !validCohorts.includes(protected_class_cohort)) {
      return new Response(JSON.stringify({ error: 'Invalid protected_class_cohort value.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const validSources = ['candidate_self_id', 'inferred', 'not_collected']
    if (demographic_source && !validSources.includes(demographic_source)) {
      return new Response(JSON.stringify({ error: 'Invalid demographic_source value.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const hashSecret = Deno.env.get('CANDIDATE_ID_HASH_SECRET')
    if (!hashSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: CANDIDATE_ID_HASH_SECRET missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const hashedCandidateId = await hmacHex(candidate_id, hashSecret)

    const proxyMetrics = computeProxyFlags(rejection_reason_from_ats);
    const resolvedCohort = protected_class_cohort || 'undisclosed'
    const resolvedAtsSource = ats_source || 'unknown_api'

    const { error: insertError } = await supabaseClient
      .from('applications')
      .insert({
        customer_id: customer.customer_id,
        candidate_id: hashedCandidateId,
        job_id,
        job_title,
        outcome,
        rejection_reason_from_ats,
        years_experience,
        education_level,
        skills: skills || [],
        ats_source: resolvedAtsSource,
        protected_class_cohort: resolvedCohort,
        demographic_source: demographic_source || 'not_collected',
        occurred_at,
        employment_gap_flagged: proxyMetrics.employment_gap_flagged,
        keyword_mismatch_flagged: proxyMetrics.keyword_mismatch_flagged
      })

    if (insertError) throw insertError

    if (outcome === 'rejected' && customer.plan === 'auditing_plus_hitl') {
      await promoteToHitlCase(
        supabaseClient,
        customer.customer_id,
        hashedCandidateId,
        {
          job_id, job_title, rejection_reason_from_ats,
          years_experience, education_level, skills: skills || [],
          ats_source: resolvedAtsSource, protected_class_cohort: resolvedCohort, occurred_at,
        },
        proxyMetrics
      )
    }

    return new Response(JSON.stringify({ status: 'success', tracking_id: event_id || null }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
