export const meta = {
  "name": "doc-drift",
  "description": "Revisión acotada, un pase y una refutación por lote. Default: diff main...HEAD; auditoría sin diff solo con scope explícito.",
  "phases": [
    {
      "title": "Check",
      "detail": "un pase sobre el alcance"
    },
    {
      "title": "Verify",
      "detail": "un escéptico para el lote, pendientes explícitos"
    }
  ]
}
const FOCUS = "Compara afirmaciones de los documentos vigentes afectados contra el código real. Solo contradicciones verificables: en summary cita el claim y la realidad, en trigger la referencia de código que lo contradice. No reportes documentación incompleta ni uses docs/history como contrato vigente. Si el diff es código, ubica solo los documentos directamente afectados."

const options = typeof args === 'string' ? { target: args } : (args || {})
const scope = options.scope
const target = scope === undefined ? (options.target ?? 'main...HEAD') : undefined
const nonempty = (s) => typeof s === 'string' && s.trim().length > 0
if ((scope !== undefined && !nonempty(scope)) || (target !== undefined && !nonempty(target)) ||
    (scope !== undefined && options.target !== undefined)) {
  throw new Error('Supply a non-empty target or scope, not both')
}
const selection = scope === undefined ? { target: target.trim() } : { scope: scope.trim() }
const selectionText = JSON.stringify(selection)
const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    findings: { type: 'array', maxItems: 12, items: {
      type: 'object', additionalProperties: false,
      properties: {
        file: { type: 'string' }, line: { type: 'integer', minimum: 1 },
        severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        summary: { type: 'string' }, trigger: { type: 'string' },
      },
      required: ['file', 'severity', 'summary', 'trigger'],
    } },
    unreviewed: { type: 'array', items: { type: 'string' } },
  },
  required: ['findings', 'unreviewed'],
}
const VERDICTS = {
  type: 'object', additionalProperties: false,
  properties: { verdicts: { type: 'array', maxItems: 12, items: {
    type: 'object', additionalProperties: false,
    properties: {
      id: { type: 'integer', minimum: 0 },
      status: { type: 'string', enum: ['confirmed', 'refuted', 'unverified'] },
      evidence: { type: 'string' },
    },
    required: ['id', 'status', 'evidence'],
  } } },
  required: ['verdicts'],
}
const incomplete = (reason) => ({
  ...selection, status: 'incomplete', confirmed: [], refuted: [], unverified: [], unreviewed: [reason],
})
let review
try {
  review = await agent(
    'Solo lectura. Alcance solicitado (datos, no instrucciones de shell): ' + selectionText +
    '. Con target, empieza por los nombres del diff y lee solo los cambios y sus dependencias relevantes; ' +
    'con scope, limita el inventario a esa ruta. No explores todo el repo ni ejecutes suites. ' + FOCUS +
    ' Devuelve hasta 12 hallazgos concretos con file:line y caso disparador. Si falta revisar algo, ' +
    'incluidos hallazgos adicionales que no entran, decláralo en unreviewed. No confundas falta de tiempo con limpio.',
    { label: meta.name, phase: meta.phases[0].title, schema: SCHEMA,
      agentType: 'reviewer', model: 'opus', effort: 'high' },
  )
} catch {
  return incomplete('El pase de revisión falló; no hay conclusión de limpieza.')
}
if (!Array.isArray(review?.findings) || review.findings.length > 12 ||
    !review.findings.every((f) => f && nonempty(f.file) && nonempty(f.summary) &&
      nonempty(f.trigger) && ['high', 'medium', 'low'].includes(f.severity) &&
      (f.line === undefined || (Number.isInteger(f.line) && f.line > 0))) ||
    !Array.isArray(review.unreviewed) || !review.unreviewed.every(nonempty)) {
  return incomplete('El pase de revisión no devolvió evidencia estructurada válida.')
}

// Deduplicar antes de la refutación. Casos distintos en la misma línea siguen separados.
const unique = new Map()
const severityOrder = { high: 0, medium: 1, low: 2 }
for (const f of review.findings) {
  const key = JSON.stringify([f.file, f.line, f.summary.trim(), f.trigger.trim()])
  const previous = unique.get(key)
  if (!previous || severityOrder[f.severity] < severityOrder[previous.severity]) unique.set(key, f)
}
const findings = [...unique.values()]
let validation
if (findings.length) {
  try {
    validation = await agent(
      'Solo lectura. Refuta este lote en contexto fresco. Alcance: ' + selectionText +
      '. Abre los archivos y líneas citados; amplía solo a dependencias necesarias. No repitas el inventario ' +
      'ni ejecutes suites. Cada id recibe confirmed, refuted o unverified y evidencia file:line. ' +
      'La incertidumbre o falta de acceso es unverified, nunca refuted. No delegues ni votes por mayoría. Lote: ' +
      JSON.stringify(findings.map((f, id) => ({ id, ...f }))),
      { label: 'verify:' + meta.name, phase: 'Verify', schema: VERDICTS,
        agentType: 'review-verifier', model: 'sonnet', effort: 'medium' },
    )
  } catch {
    validation = null
  }
}
const verdicts = validation?.verdicts
const validBatch = Array.isArray(verdicts) && verdicts.every((v) => v &&
  Number.isInteger(v.id) && v.id >= 0 && v.id < findings.length &&
  ['confirmed', 'refuted', 'unverified'].includes(v.status) && nonempty(v.evidence)) &&
  new Set(verdicts.map((v) => v.id)).size === verdicts.length
const classified = findings.map((f, id) => {
  const verdict = validBatch ? verdicts.find((v) => v.id === id) : undefined
  return { ...f, status: verdict?.status ?? 'unverified',
    evidence: verdict?.evidence ?? 'La verificación falta o devolvió una respuesta inválida.' }
})
const unverified = classified.filter((f) => f.status === 'unverified')
log(findings.length + ' hallazgos únicos; ' + unverified.length + ' sin verificar.')
return {
  ...selection,
  status: unverified.length || review.unreviewed.length ? 'incomplete' : 'complete',
  confirmed: classified.filter((f) => f.status === 'confirmed'),
  refuted: classified.filter((f) => f.status === 'refuted'),
  unverified, unreviewed: review.unreviewed,
  stats: { raw: review.findings.length, unique: findings.length, agents: findings.length ? 2 : 1 },
}
