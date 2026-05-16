'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { historialImportQueries } from '../api';
import { PreviewTable } from './preview-table';
import { UploadHistorialForm } from './upload-form';

/**
 * Container del flow completo: upload → polling → preview → confirm.
 *
 * <list type="number">
 *   <item>Si no hay <c>importId</c>, mostrar form de upload.</item>
 *   <item>Si hay id pero status es Pending/Parsing, mostrar spinner + poll.</item>
 *   <item>Si Parsed, mostrar tabla editable + botón confirmar.</item>
 *   <item>Si Failed, mostrar error + opción de reintentar (limpia el id).</item>
 *   <item>Si Confirmed, el action redirige al historial, así que este branch es raro.</item>
 * </list>
 */
export function ImportHistorialFlow() {
  const [importId, setImportId] = useState<string | null>(null);

  const query = useQuery(historialImportQueries.byId(importId));

  if (!importId) {
    return <UploadHistorialForm onUploaded={setImportId} />;
  }

  if (query.isLoading || !query.data) {
    return <Polling label="Cargando estado del import..." />;
  }

  const data = query.data;

  if (data.status === 'Pending' || data.status === 'Parsing') {
    return <Polling label="Procesando el historial. Esto puede tardar unos segundos..." />;
  }

  if (data.status === 'Failed') {
    return (
      <FailedState
        error={data.error ?? 'No pudimos procesar el archivo.'}
        onRetry={() => setImportId(null)}
      />
    );
  }

  if (data.status === 'Confirmed') {
    return (
      <p className="text-ink-2" style={{ fontSize: 14 }}>
        Este import ya fue confirmado. Volvé al historial para verlo.
      </p>
    );
  }

  // Parsed
  if (!data.payload) {
    return (
      <FailedState error="No encontramos resultados parseados." onRetry={() => setImportId(null)} />
    );
  }

  return <PreviewTable importId={data.id} payload={data.payload} />;
}

function Polling({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex items-center gap-2 text-ink-3 border border-line rounded bg-bg-card"
      style={{ padding: 16, fontSize: 14 }}
    >
      <Loader2 size={18} className="animate-spin" aria-hidden />
      {label}
    </div>
  );
}

function FailedState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="border border-line rounded bg-bg-card text-ink-2"
      style={{ padding: 16, fontSize: 14, lineHeight: 1.55 }}
    >
      <div className="flex items-start gap-2" style={{ marginBottom: 12 }}>
        <AlertCircle size={18} className="text-st-failed-fg" aria-hidden />
        <p className="text-st-failed-fg" style={{ fontWeight: 500 }}>
          No pudimos procesar el archivo
        </p>
      </div>
      <p style={{ marginBottom: 12 }}>{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center bg-bg-card text-accent-ink border border-line rounded-pill hover:bg-accent-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
        style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }}
      >
        Subir otro archivo
      </button>
    </div>
  );
}
