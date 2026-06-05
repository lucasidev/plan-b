import { Button } from '@/components/ui/button';

/**
 * Plan global empty state (US-046, `v2-empty.jsx::V2PlanificarVacio`). Shown when the
 * student has neither an active period nor any drafts. Centered card with eyebrow,
 * heading, body and primary CTA "Crear primer borrador".
 */
export function PlanEmpty({ onCreateDraft }: { onCreateDraft: () => void }) {
  return (
    <div
      className="bg-bg-card border border-line rounded-lg"
      style={{
        minHeight: 440,
        display: 'grid',
        placeItems: 'center',
        borderStyle: 'dashed',
      }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center', padding: 24 }}>
        <div
          className="text-accent"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Planificar
        </div>
        <h2
          className="text-ink-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 600,
            lineHeight: 1.2,
            margin: '0 0 12px',
          }}
        >
          Probá un cuatrimestre antes de inscribirte
        </h2>
        <p className="text-ink-2" style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 24px' }}>
          Armá un borrador con materias, docentes y comisiones. Plan-b te avisa de choques de
          horario, carga estimada y reseñas relevantes. Después decidís.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={onCreateDraft}>Crear primer borrador</Button>
          <Button variant="ghost" type="button">
            Cómo funciona
          </Button>
        </div>
      </div>
    </div>
  );
}
