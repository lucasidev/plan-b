'use client';

import { FileUp, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { uploadHistorialAction } from '../actions';
import { initialUploadHistorialState, type UploadHistorialState } from '../types';

type Props = {
  /** Callback al éxito del upload. Permite al parent arrancar el polling. */
  onUploaded: (importId: string) => void;
};

/**
 * Form de upload del historial. Dos modos mutuamente excluyentes:
 *  - PDF: file input que envía multipart al backend.
 *  - Texto: textarea que envía JSON.
 *
 * El user elige uno con un toggle. El action discrimina por la presencia del
 * file o el rawText.
 */
export function UploadHistorialForm({ onUploaded }: Props) {
  const [state, formAction] = useActionState<UploadHistorialState, FormData>(
    handleUploadAction(onUploaded),
    initialUploadHistorialState,
  );
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');

  const error = state.status === 'error' ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <div
        className="flex items-center gap-2 border-b border-line"
        style={{ marginBottom: 16, paddingBottom: 8 }}
      >
        <ModeButton active={mode === 'pdf'} onClick={() => setMode('pdf')}>
          Subir PDF del SIU
        </ModeButton>
        <ModeButton active={mode === 'text'} onClick={() => setMode('text')}>
          Pegar texto
        </ModeButton>
      </div>

      {mode === 'pdf' && (
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="file"
            className="text-ink-2"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}
          >
            Archivo PDF
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required={mode === 'pdf'}
            className="text-ink"
            style={{ fontSize: 13 }}
          />
          <p className="text-ink-3" style={{ fontSize: 12, marginTop: 6 }}>
            Hasta 5 MB. Descargá el historial desde el SIU sin contraseña.
          </p>
        </div>
      )}

      {mode === 'text' && (
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="rawText"
            className="text-ink-2"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}
          >
            Pegá el texto del historial
          </label>
          <textarea
            id="rawText"
            name="rawText"
            rows={10}
            required={mode === 'text'}
            placeholder="Copiá las líneas del historial (código, materia, nota, periodo)..."
            className={cn(
              'w-full bg-bg-card text-ink border border-line rounded',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
            )}
            style={{ padding: 12, fontSize: 13, fontFamily: 'inherit', lineHeight: 1.55 }}
          />
          <p className="text-ink-3" style={{ fontSize: 12, marginTop: 6 }}>
            Útil si el PDF no parsea. Una materia por línea.
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
        >
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

/**
 * El action ya devuelve el nuevo state; este wrapper dispara el callback al
 * parent cuando vemos status=success por primera vez.
 */
function handleUploadAction(
  onUploaded: (importId: string) => void,
): (prev: UploadHistorialState, formData: FormData) => Promise<UploadHistorialState> {
  return async (prev, formData) => {
    const next = await uploadHistorialAction(prev, formData);
    if (next.status === 'success') {
      // Defer al microtask para no setState durante el render del parent.
      queueMicrotask(() => onUploaded(next.importId));
    }
    return next;
  };
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-pill border transition-colors',
        active
          ? 'bg-accent-soft border-accent text-accent-ink'
          : 'bg-bg-card border-line text-ink-3 hover:text-ink-2',
      )}
      style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 500 }}
    >
      {children}
    </button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2',
        'bg-accent text-white border border-accent rounded-pill shadow-card',
        'transition-colors hover:bg-accent-hover',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 12 }}
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <FileUp size={16} aria-hidden />
      )}
      {pending ? 'Subiendo...' : 'Procesar'}
    </button>
  );
}
