import { FileText, Pencil, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OnboardingShell } from './onboarding-shell';

/**
 * Paso 03 del onboarding (US-037-f). Tres opciones para cargar historial:
 *
 *   1. Cargar PDF / captura del SIU — diferido a US-014, deshabilitada con
 *      label "Disponible pronto".
 *   2. Cargarlo manualmente — diferido a US-013, deshabilitada igual.
 *   3. Lo cargo después — único path activo. Avanza a `/onboarding/done`.
 *
 * Server component (no usa state): la única opción funcional es un
 * `<Link href="/onboarding/done">` plano. Cuando aterricen US-013 / US-014,
 * las dos opciones de arriba se transforman en links navegables a sus flows.
 */
export function HistoryOptions() {
  return (
    <OnboardingShell
      step={3}
      heading="¿Cargás tu historial ahora?"
      subheading="Tu historial sirve para recomendarte materias cursables y filtrar reseñas relevantes. Podés saltearlo y cargarlo después desde Mi carrera."
    >
      <div className="flex flex-col" style={{ gap: 12 }}>
        <DisabledOption
          icon={<FileText size={18} aria-hidden />}
          title="Subir PDF o captura del SIU"
          subtitle="Lo procesamos automáticamente."
          tag="Disponible pronto"
        />
        <DisabledOption
          icon={<Pencil size={18} aria-hidden />}
          title="Cargarlo manualmente"
          subtitle="Una materia a la vez, con su nota y cuatri."
          tag="Disponible pronto"
        />
        <ActiveOption
          icon={<SkipForward size={18} aria-hidden />}
          title="Lo cargo después"
          subtitle="Te llevamos a Inicio. Vas a poder cargarlo desde Mi carrera cuando quieras."
          href="/onboarding/done"
        />
      </div>
    </OnboardingShell>
  );
}

type OptionProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

function DisabledOption({ icon, title, subtitle, tag }: OptionProps & { tag: string }) {
  return (
    <div
      aria-disabled="true"
      className={cn(
        'flex items-start gap-3 bg-bg-elev border border-line rounded',
        'opacity-60 cursor-not-allowed',
      )}
      style={{ padding: 14 }}
    >
      <span className="text-ink-3" style={{ marginTop: 2 }}>
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-center" style={{ gap: 8 }}>
          <b className="text-ink" style={{ fontSize: 14, fontWeight: 500 }}>
            {title}
          </b>
          <span
            className="text-ink-4 bg-bg-card border border-line"
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {tag}
          </span>
        </div>
        <p className="text-ink-3" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ActiveOption({ icon, title, subtitle, href }: OptionProps & { href: string }) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'flex items-start gap-3 bg-bg-card border border-line rounded',
        'hover:bg-accent-soft transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: 14, textDecoration: 'none' }}
    >
      <span className="text-accent-ink" style={{ marginTop: 2 }}>
        {icon}
      </span>
      <div className="flex-1">
        <b className="block text-ink" style={{ fontSize: 14, fontWeight: 500 }}>
          {title}
        </b>
        <p className="text-ink-3" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
