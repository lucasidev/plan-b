'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useId, useState, useTransition } from 'react';
import type { OfficialFact } from '@/components/facts/types';
import { Button } from '@/components/ui/button';
import type { AdminCareerRow } from '@/features/manage-careers/types';
import { useHydrated } from '@/lib/use-hydrated';
import {
  linkCareerUnit,
  saveAcademicUnit,
  saveInstitutionFact,
  saveInstitutionLogo,
  saveInstitutionProfile,
} from '../profile-actions';
import { institutionFactFields } from '../profile-schema';
import {
  type AcademicUnit,
  type CatalogFormState,
  type InstitutionProfile,
  initialCatalogState,
} from '../profile-types';

const inputClass = 'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-sm text-ink';

export function InstitutionProfileEditor({
  profile,
  facts,
  careers,
  slug,
}: {
  profile: InstitutionProfile;
  facts: OfficialFact[];
  careers: AdminCareerRow[];
  slug: string;
}) {
  const id = profile.universityId;
  return (
    <div className="mt-10 flex flex-col gap-10">
      <div className="border-y border-line py-4 text-sm text-ink-2">
        <p>
          {profile.academicUnitCount} unidades académicas · {profile.careerCount} carreras ·{' '}
          {profile.planCount} planes
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href={`/universities/${slug}/careers`}>
            Ver ficha pública
          </Link>
          <Link className="underline" href={`/admin/universities/${id}/careers`}>
            Cargar carreras y planes
          </Link>
        </div>
      </div>
      <section aria-labelledby="institution-location">
        <h2 id="institution-location" className="mb-4 font-serif text-2xl">
          Sitio y ubicación
        </h2>
        <CatalogForm action={saveInstitutionProfile} universityId={id}>
          <Input
            label="URL oficial"
            name="websiteUrl"
            value={profile.websiteUrl}
            type="url"
            maxLength={500}
          />
          <LocationFields
            address={profile.address}
            province={profile.province}
            locality={profile.localityName}
          />
          <p className="text-xs text-ink-3">
            La localidad se verifica al guardar. Para quitarla, vaciá localidad y provincia.
          </p>
        </CatalogForm>
      </section>
      <section aria-labelledby="institution-logo">
        <h2 id="institution-logo" className="mb-4 font-serif text-2xl">
          Logo
        </h2>
        {!!profile.logoVersion && (
          // biome-ignore lint/performance/noImgElement: la vista previa usa el PNG same-origin ya validado por el backend.
          <img
            src={`/api/academic/universities/${id}/logo?v=${profile.logoVersion}`}
            alt="Logo actual"
            width={96}
            height={96}
            className="mb-4 h-24 w-24 object-contain"
          />
        )}
        <CatalogForm action={saveInstitutionLogo} universityId={id}>
          <Input label="Archivo PNG" name="logo" type="file" accept="image/png" required />
          <p className="text-xs text-ink-3">
            Hasta 256 KiB y 1024 píxeles por lado. La carga reemplaza el logo actual.
          </p>
        </CatalogForm>
      </section>
      <section aria-labelledby="institution-units">
        <h2 id="institution-units" className="mb-4 font-serif text-2xl">
          Unidades académicas
        </h2>
        {profile.units.length === 0 && (
          <p className="text-sm text-ink-3">Todavía no hay unidades académicas cargadas.</p>
        )}
        {profile.units.map((unit) => (
          <details key={unit.id} className="border-b border-line py-3">
            <summary className="cursor-pointer text-sm">
              {unit.name} · {unit.careerCount} carreras
            </summary>
            <div className="pt-4">
              <UnitForm universityId={id} unit={unit} />
            </div>
          </details>
        ))}
        <details className="mt-4">
          <summary className="cursor-pointer font-medium">Agregar unidad académica</summary>
          <div className="pt-4">
            <UnitForm universityId={id} />
          </div>
        </details>
        {careers.some((career) => career.isActive) && (
          <div className="mt-6">
            <h3 className="mb-3 font-medium">Vincular una carrera a su unidad</h3>
            <CatalogForm action={linkCareerUnit} universityId={id}>
              <Select label="Carrera" name="careerId" required>
                <option value="">Elegí una carrera</option>
                {careers
                  .filter((career) => career.isActive)
                  .map((career) => (
                    <option key={career.id} value={career.id}>
                      {career.name}
                    </option>
                  ))}
              </Select>
              <Select label="Unidad académica" name="academicUnitId">
                <option value="">Sin unidad académica</option>
                {profile.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </CatalogForm>
          </div>
        )}
      </section>
      <section aria-labelledby="institution-facts">
        <h2 id="institution-facts" className="mb-4 font-serif text-2xl">
          Datos oficiales
        </h2>
        <p className="mb-4 text-sm text-ink-3">
          Corregir guarda una nueva afirmación con su fuente. La anterior se conserva.
        </p>
        {Object.entries(institutionFactFields).map(([field, label]) => {
          const fact = facts.find((entry) => entry.field === field);
          return (
            <details key={field} className="border-b border-line py-3">
              <summary className="cursor-pointer text-sm">
                {label}: {fact?.value ?? factStatusLabel(fact?.status)}
              </summary>
              <div className="pt-4">
                <FactForm universityId={id} field={field} fact={fact} />
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function factStatusLabel(status?: string) {
  return (
    (
      {
        NotPublished: 'No publicado',
        Requested: 'Pedido',
        NotApplicable: 'No aplica',
        Derived: 'Calculado',
      } as Record<string, string>
    )[status ?? ''] ?? 'Sin cargar'
  );
}

function UnitForm({ universityId, unit }: { universityId: string; unit?: AcademicUnit }) {
  return (
    <CatalogForm action={saveAcademicUnit} universityId={universityId} resetOnSuccess={!unit}>
      {unit && <input type="hidden" name="unitId" value={unit.id} />}
      <Input label="Nombre de la unidad" name="name" value={unit?.name} required maxLength={200} />
      <Input label="Slug de la unidad" name="slug" value={unit?.slug} required maxLength={120} />
      <LocationFields
        address={unit?.address}
        province={unit?.province}
        locality={unit?.localityName}
        required
      />
    </CatalogForm>
  );
}

function FactForm({
  universityId,
  field,
  fact,
}: {
  universityId: string;
  field: string;
  fact?: OfficialFact;
}) {
  return (
    <CatalogForm action={saveInstitutionFact} universityId={universityId}>
      <input type="hidden" name="field" value={field} />
      <Select
        label="Estado"
        name="status"
        value={fact?.status === 'Derived' ? 'Published' : (fact?.status ?? 'Published')}
      >
        <option value="Published">Publicado</option>
        <option value="NotPublished">No publicado</option>
        <option value="Requested">Pedido</option>
        <option value="NotApplicable">No aplica</option>
      </Select>
      <Input label="Valor" name="value" value={fact?.value} maxLength={2000} />
      <Input label="Unidad del valor" name="unit" value={fact?.unit} maxLength={20} />
      <Input label="Período del dato" name="period" value={fact?.period} maxLength={120} />
      <Input
        label="Nombre de la fuente"
        name="sourceName"
        value={fact?.sourceName}
        required
        maxLength={200}
      />
      <Input
        label="URL de la fuente"
        name="sourceUrl"
        value={fact?.sourceUrl}
        required
        type="url"
        maxLength={2000}
      />
      <Input label="Fecha de consulta de la fuente" name="sourceRetrievedAt" type="date" required />
      <Input
        label="Nota o motivo por el que no aplica"
        name="note"
        value={fact?.note}
        maxLength={1000}
      />
    </CatalogForm>
  );
}

function LocationFields({
  address,
  province,
  locality,
  required = false,
}: {
  address?: string | null;
  province?: string | null;
  locality?: string | null;
  required?: boolean;
}) {
  return (
    <>
      <Input label="Dirección" name="address" value={address} maxLength={300} required={required} />
      <Input
        label="Provincia"
        name="province"
        value={province}
        maxLength={80}
        required={required}
      />
      <Input
        label="Localidad"
        name="localityText"
        value={locality}
        maxLength={80}
        required={required}
      />
    </>
  );
}

function CatalogForm({
  action,
  universityId,
  children,
  resetOnSuccess = false,
}: {
  action: (state: CatalogFormState, data: FormData) => Promise<CatalogFormState>;
  universityId: string;
  children: ReactNode;
  resetOnSuccess?: boolean;
}) {
  const [state, setState] = useState(initialCatalogState);
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const router = useRouter();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const result = await action(state, data);
          setState(result);
          if (result.status === 'success') {
            if (resetOnSuccess) form.reset();
            router.refresh();
          }
        });
      }}
    >
      <input type="hidden" name="universityId" value={universityId} />
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
        {children}
      </fieldset>
      {state.message && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="text-sm text-ink-2">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={!hydrated || pending} className="self-start">
        {pending ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  );
}

function Input({
  label,
  value,
  ...props
}: { label: string; value?: string | null } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value'
>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-2">
        {label}
      </label>
      <input id={id} defaultValue={value ?? undefined} className={inputClass} {...props} />
    </div>
  );
}

function Select({
  label,
  value,
  children,
  ...props
}: { label: string; value?: string; children: ReactNode } & Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'value'
>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-2">
        {label}
      </label>
      <select id={id} defaultValue={value} className={inputClass} {...props}>
        {children}
      </select>
    </div>
  );
}
