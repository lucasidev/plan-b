import { FileText, Pencil, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OnboardingShell } from './onboarding-shell';

/**
 * Onboarding step 03 (US-037-f). Three options to load the transcript:
 *
 *   1. Upload a SIU PDF / screenshot (US-014): routes to `/my-career/transcript/import`.
 *   2. Load it manually (US-013): routes to `/my-career/transcript/add`.
 *   3. Skip for now: advances to `/onboarding/done`.
 *
 * Server component (no state). All three paths are non-destructive: the user can come
 * back to the transcript at any time.
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
          href="/my-career/transcript/import"
        />
        <ActiveOption
          icon={<Pencil size={18} aria-hidden />}
          title="Cargarlo manualmente"
          subtitle="Una materia a la vez, con su nota y cuatri."
          href="/my-career/transcript/add"
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
