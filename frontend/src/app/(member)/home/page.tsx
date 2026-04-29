import { CoursingNow } from '@/features/home/components/coursing-now';
import { DecisionCard } from '@/features/home/components/decision-card';
import { homeDecisions } from '@/features/home/data/mock-decisions';
import { getSession } from '@/lib/session';

/**
 * Home del área autenticada (US-043-f). Port literal del mockup
 * `screens.jsx::HomeView`.
 *
 * Greeting + display heading + lede + grid de 4 DecisionCards + sección
 * "Cursando ahora". Toda la data de las decisiones y de las materias en
 * curso es hardcoded (`features/home/data/mock-*.ts`), per la regla
 * design-first: la interfaz se entrega como la referencia, los datos
 * reales aterrizan progresivamente con las US correspondientes (planning,
 * historial, simulador).
 *
 * Cuando aterrice US-013 (cargar historial) la sección "Cursando ahora"
 * lee de `EnrollmentRecord` filtrando `status='cursando'`. Cuando US-016
 * aterrice (simulador) las DecisionCards se generan a partir del estado
 * del alumno y métricas cross-cohort.
 */
export default async function HomePage() {
  const session = await getSession();
  const firstName = session ? greetingNameFromEmail(session.email) : 'alumno';

  return (
    <div style={{ padding: '36px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <p
        className="text-ink-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Hola, {firstName}
      </p>
      <h1
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 56,
          margin: 0,
          letterSpacing: '-0.02em',
          fontWeight: 500,
          lineHeight: 1.05,
          marginBottom: 14,
        }}
      >
        Cinco decisiones <em style={{ fontStyle: 'italic' }}>esta semana</em>
      </h1>
      <p
        className="text-ink-2"
        style={{
          fontSize: 15,
          maxWidth: 540,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Inscripción para 2026·1c abre el lunes 4 de mayo. Esto es lo que tu cuatrimestre actual te
        está pidiendo decidir.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
          marginTop: 32,
        }}
      >
        {homeDecisions.map((d) => (
          <DecisionCard key={d.num} decision={d} />
        ))}
      </div>

      <CoursingNow />
    </div>
  );
}

/**
 * "lucia.mansilla@gmail.com" → "Lucia". Capitaliza la primera parte del
 * local antes del primer punto. Cuando aterrice US-012 (StudentProfile)
 * la session lleva `firstName` y este helper se reemplaza por leerlo
 * directo.
 *
 * Nota: el mockup tiene "Lucía" con tilde. Si el local del email no la
 * lleva (porque el dato vino de un teclado sin acentos), el display sale
 * "Lucia". Ese matching pertenece al display name del User, no acá.
 */
function greetingNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const first = local.split('.')[0] ?? local;
  if (!first) return email;
  return first.charAt(0).toUpperCase() + first.slice(1);
}
