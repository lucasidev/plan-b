export const meta = {
  name: 'deep-review',
  description: 'Review adversarial de un diff: fan-out por dimensiones (correctness, boundaries/ADR, security, invariantes, tests), cada hallazgo verificado por escépticos independientes que intentan refutarlo, y sintetiza solo lo confirmado. La version pesada del subagente reviewer, para diffs no triviales.',
  phases: [
    { title: 'Review', detail: 'una dimension por agente, en paralelo' },
    { title: 'Verify', detail: 'N escepticos por hallazgo, la mayoria refuta lo mata' },
  ],
}

// Rango a revisar. Pasalo como args (string o {target}); default: lo que la branch agrego sobre main.
const target =
  typeof args === 'string' && args.trim()
    ? args.trim()
    : (args && args.target) || 'main...HEAD'

// Cada dimension es un lente distinto. El fan-out da diversidad: cada agente es ciego a lo que ven los otros.
const DIMENSIONS = [
  {
    key: 'correctness',
    focus:
      'bugs, edge cases sin manejar, null/empty, race conditions, off-by-one, manejo de errores incompleto. NO estilo ni naming.',
  },
  {
    key: 'boundaries',
    focus:
      'violaciones de arquitectura de planb: persistence ignorance (ADR-0017: no FK cross-schema, no EF navigation cross-module), Result<T> nunca throw para fallas de negocio, IDateTimeProvider.UtcNow nunca DateTime.UtcNow directo, server actions puras (ADR-0046: sin revalidatePath/redirect adentro). El detalle de cada ADR esta en docs/decisions/.',
  },
  {
    key: 'security',
    focus:
      'auth/gating por rol flojo o faltante, endpoints sin autorizacion, SQL sin parametrizar en Dapper (inyeccion), secrets o datos sensibles expuestos.',
  },
  {
    key: 'invariants',
    focus:
      'invariantes de dominio rotos: reglas del aggregate que el codigo saltea, estados invalidos que quedan permitidos. Las reglas del dominio estan en docs/domain/.',
  },
  {
    key: 'tests',
    focus:
      'cobertura segun la piramide (ADR-0036, docs/testing/conventions.md): el cambio tiene el test de la capa correcta? falta un test para un caso nuevo que introduce? NO pidas tests para casos imposibles ni cobertura por cobertura.',
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          summary: { type: 'string' },
          trigger: { type: 'string' },
        },
        required: ['file', 'severity', 'summary', 'trigger'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['real', 'reason'],
}

function reviewPrompt(d) {
  return `Sos un revisor senior hostil en contexto fresco: no viste el razonamiento que produjo este diff, lo juzgas por sus meritos. Mira el diff con \`git diff ${target}\` y abri los archivos que necesites para entender el contexto.

Revisa SOLO esta dimension: ${d.key}.
Busca: ${d.focus}

Por cada hallazgo real: file, line, severity (high/medium/low), summary (una frase) y trigger (el caso concreto de input/estado que lo dispara). Si el diff esta limpio en esta dimension, devolve findings vacio. No inventes hallazgos para justificar el pase: un falso positivo cuesta mas que un pase limpio.`
}

function refutePrompt(f, i) {
  return `Sos un esceptico independiente (revisor ${i + 1}), en contexto fresco. Tu trabajo es intentar REFUTAR este hallazgo de review mirando el codigo real (\`git diff ${target}\` y los archivos involucrados).

Hallazgo (dimension ${f.dimension}): ${f.file}:${f.line || '?'} [${f.severity}] ${f.summary}
Caso que lo dispararia: ${f.trigger}

Decidi: es un problema REAL que afecta correctness / seguridad / requisitos, o es un falso positivo (caso imposible en la practica, ya manejado en otro lado, o preferencia de estilo disfrazada)? Default a real=false si no estas convencido de que es real. Devolve real (bool) + reason (una frase con evidencia del codigo).`
}

async function verifyFinding(f) {
  const N = 3
  const votes = (
    await parallel(
      Array.from({ length: N }, (_, i) => () =>
        agent(refutePrompt(f, i), {
          label: `verify:${f.dimension}:${f.file}#${i + 1}`,
          phase: 'Verify',
          schema: VERDICT_SCHEMA,
          agentType: 'general-purpose',
          model: 'sonnet',
          effort: 'medium',
        })
      )
    )
  ).filter(Boolean)
  const realCount = votes.filter((v) => v.real).length
  return {
    survives: realCount > N / 2,
    realCount,
    total: votes.length,
    reasons: votes.map((v) => v.reason),
  }
}

log(`Reviewando \`${target}\` en ${DIMENSIONS.length} dimensiones...`)

// pipeline sin barrera: cada dimension que termina su review arranca a verificar sus hallazgos
// mientras las otras dimensiones siguen reviewando.
const perDimension = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(reviewPrompt(d), {
      label: `review:${d.key}`,
      phase: 'Review',
      schema: FINDINGS_SCHEMA,
      agentType: 'general-purpose',
      model: 'opus',
      effort: 'high',
    }),
  (review, d) =>
    parallel(
      ((review && review.findings) || []).map((f) => () =>
        verifyFinding({ ...f, dimension: d.key }).then((verdict) => ({
          ...f,
          dimension: d.key,
          verdict,
        }))
      )
    )
)

const all = perDimension.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict && f.verdict.survives)

// dedup: el mismo bug lo pueden marcar dos dimensiones (ej. correctness e invariants).
const seen = new Set()
const deduped = []
for (const f of confirmed) {
  const key = `${f.file}:${f.line || ''}:${(f.summary || '').slice(0, 40).toLowerCase()}`
  if (seen.has(key)) continue
  seen.add(key)
  deduped.push(f)
}

const order = { high: 0, medium: 1, low: 2 }
deduped.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))

log(`${all.length} hallazgos crudos, ${confirmed.length} sobrevivieron la refutacion, ${deduped.length} tras dedup.`)

return {
  target,
  confirmed: deduped,
  stats: {
    dimensions: DIMENSIONS.length,
    raw: all.length,
    confirmed: confirmed.length,
    deduped: deduped.length,
  },
}
