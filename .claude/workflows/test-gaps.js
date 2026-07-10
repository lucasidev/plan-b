export const meta = {
  name: 'test-gaps',
  description: 'Barrido de cobertura del repo: fan-out por modulo/area, cada agente cruza el codigo con los tests existentes segun la piramide (ADR-0036) y marca logica real sin su test de capa, y un esceptico confirma que el gap es real (no cubierto en otro lado). Objetivo, no cobertura por cobertura.',
  phases: [
    { title: 'Scan', detail: 'un modulo/area por agente, codigo vs tests' },
    { title: 'Verify', detail: 'esceptico confirma que no esta cubierto en otro lado' },
  ],
}

const AREAS = [
  { key: 'identity', scope: 'backend/modules/identity' },
  { key: 'academic', scope: 'backend/modules/academic' },
  { key: 'enrollments', scope: 'backend/modules/enrollments' },
  { key: 'reviews', scope: 'backend/modules/reviews' },
  { key: 'moderation', scope: 'backend/modules/moderation' },
  { key: 'frontend', scope: 'frontend/src/features' },
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
          layer: { type: 'string' },
          what: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['file', 'layer', 'what', 'severity'],
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

function scanPrompt(a) {
  return `En ${a.scope}, cruza el codigo con los tests existentes segun la piramide de testing (ADR-0036, ver docs/testing/conventions.md para la tabla de que test para que capa).

Reporta gaps OBJETIVOS de cobertura por capa:
- Backend: un endpoint sin integration test (backend/tests/Planb.IntegrationTests/<Module>/); un aggregate o Value Object con logica de negocio sin domain unit test; un handler con ramas de decision sin cubrir.
- Frontend: un schema Zod sin schema.test.ts; una server action sin actions.test.ts; un componente con logica (no presentacional puro) sin test.

Por gap: file (el codigo sin test), layer (que test de capa falta), what (que caso concreto no esta cubierto), severity. NO pidas cobertura por cobertura, ni tests para getters triviales, mapeos obvios o casos imposibles: solo logica real sin su test de capa. Si el area esta bien cubierta, findings vacio.`
}

function refutePrompt(f, i) {
  return `Sos un esceptico independiente (revisor ${i + 1}). Intenta REFUTAR este gap de test mirando el codigo y los tests reales.

Gap: ${f.file} le falta ${f.layer}. Caso sin cubrir: ${f.what}

Es un gap REAL (logica de negocio real sin test de su capa), o falso positivo? Falsos positivos tipicos: ya esta cubierto por un test de otra capa (ej. un handler cubierto por su integration test), es codigo trivial/presentacional que no amerita test, o es un caso imposible. Default a real=false si no estas convencido de que hay logica real sin cubrir. Devolve real (bool) + reason (una frase con evidencia).`
}

async function verifyFinding(f) {
  const N = 2
  const votes = (
    await parallel(
      Array.from({ length: N }, (_, i) => () =>
        agent(refutePrompt(f, i), {
          label: `verify:${f.area}:${f.file}#${i + 1}`,
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
  return { survives: realCount > N / 2, realCount, total: votes.length }
}

log(`Buscando gaps de test en ${AREAS.length} areas...`)

const perArea = await pipeline(
  AREAS,
  (a) =>
    agent(scanPrompt(a), {
      label: `scan:${a.key}`,
      phase: 'Scan',
      schema: FINDINGS_SCHEMA,
      agentType: 'general-purpose',
      model: 'opus',
      effort: 'high',
    }),
  (review, a) =>
    parallel(
      ((review && review.findings) || []).map((f) => () =>
        verifyFinding({ ...f, area: a.key }).then((verdict) => ({ ...f, area: a.key, verdict }))
      )
    )
)

const all = perArea.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict && f.verdict.survives)

const seen = new Set()
const deduped = []
for (const f of confirmed) {
  const key = `${f.file}:${f.layer}:${(f.what || '').slice(0, 40).toLowerCase()}`
  if (seen.has(key)) continue
  seen.add(key)
  deduped.push(f)
}

const order = { high: 0, medium: 1, low: 2 }
deduped.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))

log(`${all.length} gaps crudos, ${confirmed.length} confirmados, ${deduped.length} tras dedup.`)

return {
  confirmed: deduped,
  stats: { areas: AREAS.length, raw: all.length, confirmed: confirmed.length, deduped: deduped.length },
}
