'use server';

import { z } from 'zod';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import {
  academicUnitSchema,
  institutionFactSchema,
  institutionProfileSchema,
} from './profile-schema';
import type { CatalogFormState } from './profile-types';

const text = (data: FormData, key: string) => data.get(key)?.toString() ?? '';
const fields = (data: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, text(data, key)]));
const validId = (value: string) => z.string().uuid().safeParse(value).success;
const failure = (message: string): CatalogFormState => ({ status: 'error', message });

async function write(
  path: string,
  method: string,
  body: unknown,
  invalidMessage = 'Revisá los datos ingresados.',
): Promise<CatalogFormState> {
  if ((await getSession())?.role !== 'admin')
    return failure('Tu sesión expiró o no tenés permisos.');
  try {
    const response = await apiFetchAuthenticated(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return { status: 'success', message: 'Guardado.' };
    if (response.status === 400) return failure(invalidMessage);
    if (response.status === 413) return failure('El logo supera el tamaño permitido.');
    if (response.status === 409) return failure('Ese slug ya está en uso.');
    if (response.status === 401 || response.status === 403)
      return failure('Tu sesión expiró o no tenés permisos.');
    if (response.status === 404) return failure('No encontramos el registro.');
    return failure('No pudimos guardar. Probá de nuevo.');
  } catch {
    return failure('No pudimos conectarnos al servidor. Probá de nuevo.');
  }
}

export async function saveInstitutionProfile(
  _state: CatalogFormState,
  data: FormData,
): Promise<CatalogFormState> {
  const id = text(data, 'universityId');
  if (!validId(id)) return failure('Falta la institución.');
  const parsed = institutionProfileSchema.safeParse(
    fields(data, ['websiteUrl', 'address', 'province', 'localityText']),
  );
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  return write(`/api/academic/universities/${id}/profile`, 'PUT', parsed.data);
}

export async function saveAcademicUnit(
  _state: CatalogFormState,
  data: FormData,
): Promise<CatalogFormState> {
  const id = text(data, 'universityId');
  const unitId = text(data, 'unitId');
  if (!validId(id) || (unitId && !validId(unitId)))
    return failure('Falta la institución o unidad.');
  const parsed = academicUnitSchema.safeParse(
    fields(data, ['name', 'slug', 'address', 'province', 'localityText']),
  );
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  return write(
    `/api/academic/universities/${id}/units${unitId ? `/${unitId}` : ''}`,
    unitId ? 'PUT' : 'POST',
    parsed.data,
  );
}

export async function saveInstitutionLogo(
  _state: CatalogFormState,
  data: FormData,
): Promise<CatalogFormState> {
  if ((await getSession())?.role !== 'admin')
    return failure('Tu sesión expiró o no tenés permisos.');
  const id = text(data, 'universityId');
  const file = data.get('logo');
  if (!validId(id) || !(file instanceof File) || file.size === 0)
    return failure('Elegí un archivo PNG.');
  if (file.size > 256 * 1024) return failure('El logo puede pesar hasta 256 KiB.');
  if (file.type !== 'image/png') return failure('El logo debe ser PNG.');
  return write(
    `/api/academic/universities/${id}/logo`,
    'PUT',
    {
      pngBase64: Buffer.from(await file.arrayBuffer()).toString('base64'),
    },
    'El archivo debe ser un PNG válido de hasta 1024 píxeles por lado.',
  );
}

export async function linkCareerUnit(
  _state: CatalogFormState,
  data: FormData,
): Promise<CatalogFormState> {
  const careerId = text(data, 'careerId');
  const unitId = text(data, 'academicUnitId');
  if (!validId(careerId) || (unitId && !validId(unitId)))
    return failure('Elegí la carrera y su unidad.');
  return write(`/api/academic/careers/${careerId}/academic-unit`, 'PUT', {
    academicUnitId: unitId || null,
  });
}

export async function saveInstitutionFact(
  _state: CatalogFormState,
  data: FormData,
): Promise<CatalogFormState> {
  const id = text(data, 'universityId');
  if (!validId(id)) return failure('Falta la institución.');
  const parsed = institutionFactSchema.safeParse(
    fields(data, [
      'field',
      'status',
      'value',
      'unit',
      'period',
      'sourceName',
      'sourceUrl',
      'sourceRetrievedAt',
      'note',
    ]),
  );
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  return write('/api/academic/official-facts', 'POST', {
    ...parsed.data,
    subjectType: 'Institution',
    subjectId: id,
    value: parsed.data.status === 'Published' ? parsed.data.value : null,
    sourceRetrievedAt: `${parsed.data.sourceRetrievedAt}T12:00:00Z`,
    relievedAt: new Date().toISOString(),
    sourceDocument: null,
    derivationRuleId: null,
  });
}
