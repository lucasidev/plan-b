export const meta = {
  name: 'security-audit',
  description: 'Barrido de seguridad del repo entero (no de un diff): fan-out por modulo, cada agente audita TODOS los endpoints del modulo por auth faltante/floja y por SQL sin parametrizar, y un esceptico confirma cada hallazgo. Distinto de la dimension security de deep-review (que mira un diff): esto cubre todos los endpoints existentes.',
  phases: [
    { title: 'Audit', detail: 'un modulo por agente, todos sus endpoints' },
    { title: 'Verify', detail: 'esceptico confirma que el agujero es real' },
  ],
}

const MODULES = ['identity', 'academic', 'enrollments', 'reviews', 'moderation']

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
          issue: { type: 'string' },
          current: { type: 'string' },
          expected: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['file', 'issue', 'severity'],
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

function auditPrompt(m) {
  return `Audita TODOS los endpoints del modulo ${m}: abri con grep/read los archivos backend/modules/${m}/**/Features/**/*Endpoint.cs.

Por cada endpoint chequea DOS cosas objetivas de planb:

1. Auth/gating. No hay default seguro: cada endpoint declara su acceso. Un endpoint que MUTA o EXPONE datos de un user o de staff debe tener \`.RequireAuthorization()\`, o \`.RequireAuthorization(p => p.RequireRole(...))\` si es staff (ModerationPolicy.StaffRoles / AdminTeacherPolicy). Solo lo genuinamente publico (catalogo publico, sign-in, register, verify-email) lleva \`.AllowAnonymous()\`. Reporta endpoints que mutan o exponen datos sensibles con \`.AllowAnonymous()\` o sin ninguna declaracion de auth.

2. Injection. Si el endpoint o su query service usa Dapper, los parametros van parametrizados (@x con new { x }), nunca interpolados en el string SQL. Reporta cualquier SQL con interpolacion de variables.

Por hallazgo: file, line, issue (que esta mal), current (que hace hoy), expected (que deberia), severity. NO reportes preferencias ni estilo: solo auth faltante/floja o SQL sin parametrizar, objetivo. Si el modulo esta limpio, findings vacio.`
}

function refutePrompt(f, i) {
  return `Sos un esceptico independiente (revisor ${i + 1}). Intenta REFUTAR este hallazgo de seguridad mirando el codigo real (abri el endpoint y lo que lo rodea).

Hallazgo: ${f.file}:${f.line || '?'} [${f.severity}] ${f.issue}
Hoy: ${f.current || 'n/a'} / Esperado: ${f.expected || 'n/a'}

Es un agujero REAL, o falso positivo? Casos de falso positivo tipicos: el endpoint es genuinamente publico (catalogo, sign-in), el gating esta un nivel mas arriba (en un grupo o middleware), el SQL "interpolado" en realidad es un nombre de columna constante y no input del user. Default a real=false si no estas convencido de que es un agujero explotable. Devolve real (bool) + reason (una frase con evidencia del codigo).`
}

async function verifyFinding(f) {
  const N = 2
  const votes = (
    await parallel(
      Array.from({ length: N }, (_, i) => () =>
        agent(refutePrompt(f, i), {
          label: `verify:${f.module}:${f.file}#${i + 1}`,
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

log(`Auditando seguridad de ${MODULES.length} modulos...`)

const perModule = await pipeline(
  MODULES,
  (m) =>
    agent(auditPrompt(m), {
      label: `audit:${m}`,
      phase: 'Audit',
      schema: FINDINGS_SCHEMA,
      agentType: 'general-purpose',
      model: 'opus',
      effort: 'high',
    }),
  (review, m) =>
    parallel(
      ((review && review.findings) || []).map((f) => () =>
        verifyFinding({ ...f, module: m }).then((verdict) => ({ ...f, module: m, verdict }))
      )
    )
)

const all = perModule.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict && f.verdict.survives)

const seen = new Set()
const deduped = []
for (const f of confirmed) {
  const key = `${f.file}:${f.line || ''}:${(f.issue || '').slice(0, 40).toLowerCase()}`
  if (seen.has(key)) continue
  seen.add(key)
  deduped.push(f)
}

const order = { high: 0, medium: 1, low: 2 }
deduped.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))

log(`${all.length} hallazgos crudos, ${confirmed.length} confirmados, ${deduped.length} tras dedup.`)

return {
  confirmed: deduped,
  stats: { modules: MODULES.length, raw: all.length, confirmed: confirmed.length, deduped: deduped.length },
}
