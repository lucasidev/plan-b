import { FileText, Pencil, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OnboardingShell } from './onboarding-shell';

/**
 * Paso 03 del onboarding (US-037-f). Tres opciones para cargar historial:
 *
 *   1. Cargar PDF / captura del SIU (US-014): lleva a `/mi-carrera/historial/importar`.
 *   2. Cargarlo manualmente (US-013): lleva a `/mi-carrera/historial/agregar`.
 *   3. Lo cargo después: avanza a `/onboarding/done`.
 *
 * Server component (no usa state). Los tres caminos son no-destructivos: el
 * user puede volver al historial cuando quiera.
 */
export function HistoryOptions() {
  return (
    <OnboardingShell
      step={3}
      heading="¿Cargás tu historial ahora?"
      subheading="Tu historial sirve para recomendarte materias cursables y filtrar reseñas relevantes. Podés saltearlo y cargarlo después desde Mi carrera."
    >
      <div className="flex flex-col" style={{ gap: 12 }}>
        <ActiveOption
          icon={<FileText size={18} aria-hidden />}
          title="Subir PDF o captura del SIU"
          subtitle="Lo procesamos automáticamente."
          href="/mi-carrera/historial/importar"
        />
        <ActiveOption
          icon={<Pencil size={18} aria-hidden />}
          title="Cargarlo manualmente"
          subtitle="Una materia a la vez, con su nota y cuatri."
          href="/mi-carrera/historial/agregar"
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
