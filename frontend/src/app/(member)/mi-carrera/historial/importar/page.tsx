import Link from 'next/link';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';

/**
 * Stub de importar PDF del historial. Destino del CTA "Importar PDF" del
 * tab Historial (US-045-e). Cuando aterrice US-014 (importar PDF SIU),
 * esta ruta se convierte en el flujo real.
 */
export default function ImportarHistorialStub() {
  return (
    <div className="px-6 py-9 max-w-[800px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Importar</Eyebrow>
      <DisplayHeading size={32} className="mt-2 mb-4">
        Próximamente: importar PDF del SIU.
      </DisplayHeading>
      <p className="text-ink-2 mb-6">
        Vas a poder subir el PDF del historial académico que descargás del SIU y plan-b lo va a
        parsear automáticamente. Por ahora aterriza con US-014. Mientras tanto, cargá las materias
        desde "+ Materia rendida".
      </p>
      <Link
        href="/mi-carrera?tab=historial"
        className="inline-flex items-center text-accent-ink hover:text-accent-hover"
      >
        ← Volver al historial
      </Link>
    </div>
  );
}
