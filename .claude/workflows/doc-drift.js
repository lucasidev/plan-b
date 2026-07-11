export const meta = {
  name: 'doc-drift',
  description: 'Auditoria de drift entre docs y codigo: fan-out por documento, cada agente compara la prosa del doc contra el codigo real y marca contradicciones verificables, y un esceptico confirma cada drift. Para cuando sospechas que los docs (CLAUDE.md, ADRs, ubiquitous-language, data-model) quedaron atras del codigo.',
  phases: [
    { title: 'Check', detail: 'un doc por agente vs el codigo real' },
    { title: 'Verify', detail: 'esceptico confirma que el drift es real' },
  ],
}

// Cada unidad: un doc + contra que codigo se compara. Los agentes leen ambos en runtime.
const DOCS = [
  {
    doc: 'docs/domain/ubiquitous-language.md',
    against:
      'las clases de dominio reales (Entity, Value Object, Error codes) en backend/modules/*/src/Planb.*.Domain/. Un termino del glosario que ya no existe como clase, o una clase de dominio central que el glosario define distinto de como se comporta el codigo.',
  },
  {
    doc: 'docs/architecture/data-model.md',
    against:
      'las entidades EF y su configuracion (tablas, columnas, schemas, relaciones) en backend/modules/*/src/Planb.*.Infrastructure/. Una tabla/columna/relacion que el ERD describe distinto de como esta en el codigo.',
  },
  {
    doc: 'docs/domain/review-lifecycle.md',
    against:
      'el aggregate Review y sus transiciones de estado reales. Un estado o transicion que el doc describe y el codigo no tiene, o al reves.',
  },
  {
    doc: 'docs/domain/enrollment-lifecycle.md',
    against: 'el aggregate EnrollmentRecord y sus estados/transiciones reales.',
  },
  {
    doc: 'CLAUDE.md',
    against:
      'la estructura real del repo: los modulos que lista, el stack, y los comandos del Justfile. Un comando o modulo que el CLAUDE.md menciona y no existe, o existe distinto.',
  },
  {
    doc: 'frontend/CLAUDE.md',
    against:
      'el frontend real: rutas y route groups en frontend/src/app/, estructura de features/, scripts de package.json, y los workflows de CI (.github/workflows/). Un claim operativo que el codigo o el CI contradice (ej. cuando corre el E2E).',
  },
  {
    doc: 'backend/CLAUDE.md',
    against:
      'el backend real: modulos y su estructura, el patron de slice, los comandos. Un claim que el codigo contradice.',
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
          claim: { type: 'string' },
          reality: { type: 'string' },
          codeRef: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['claim', 'reality', 'severity'],
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

function checkPrompt(u) {
  return `Compara la prosa de \`${u.doc}\` contra el codigo real: ${u.against}

Reporta SOLO drift OBJETIVO Y VERIFICABLE: afirmaciones del doc que el codigo contradice (el doc dice que algo existe o funciona de una forma, y el codigo muestra otra cosa o no lo tiene). Por cada uno: claim (lo que dice el doc), reality (lo que muestra el codigo), codeRef (file:line del codigo), severity.

NO reportes que el doc este "incompleto", ni sugerencias de mejora, ni estilo: solo contradicciones doc-vs-codigo que alguien pueda verificar abriendo el archivo. Si el doc espeja el codigo, devolve findings vacio.`
}

function refutePrompt(f, i) {
  return `Sos un esceptico independiente (revisor ${i + 1}). Intenta REFUTAR este drift mirando el codigo real (abri el doc y el archivo de codigo).

Drift: el doc dice "${f.claim}". Supuestamente el codigo muestra "${f.reality}" en ${f.codeRef || '?'}.

Es drift REAL (el doc contradice al codigo hoy), o el agente malinterpreto (el doc en realidad esta bien, o describe algo de otro nivel)? Default a real=false si no estas convencido de que el doc contradice al codigo. Devolve real (bool) + reason (una frase con evidencia).`
}

async function verifyFinding(f) {
  const N = 2
  const votes = (
    await parallel(
      Array.from({ length: N }, (_, i) => () =>
        agent(refutePrompt(f, i), {
          label: `verify:${f.doc}#${i + 1}`,
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

log(`Chequeando drift en ${DOCS.length} documentos...`)

const perDoc = await pipeline(
  DOCS,
  (u) =>
    agent(checkPrompt(u), {
      label: `check:${u.doc}`,
      phase: 'Check',
      schema: FINDINGS_SCHEMA,
      agentType: 'general-purpose',
      model: 'opus',
      effort: 'high',
    }),
  (review, u) =>
    parallel(
      ((review && review.findings) || []).map((f) => () =>
        verifyFinding({ ...f, doc: u.doc }).then((verdict) => ({ ...f, doc: u.doc, verdict }))
      )
    )
)

const all = perDoc.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict && f.verdict.survives)

const seen = new Set()
const deduped = []
for (const f of confirmed) {
  const key = `${f.doc}:${(f.claim || '').slice(0, 50).toLowerCase()}`
  if (seen.has(key)) continue
  seen.add(key)
  deduped.push(f)
}

const order = { high: 0, medium: 1, low: 2 }
deduped.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))

log(`${all.length} drifts crudos, ${confirmed.length} confirmados, ${deduped.length} tras dedup.`)

return {
  confirmed: deduped,
  stats: { docs: DOCS.length, raw: all.length, confirmed: confirmed.length, deduped: deduped.length },
}
