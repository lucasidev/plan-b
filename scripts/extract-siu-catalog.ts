import { createHash } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => { window: { document: Document; close(): void } };
};

export const siuOrigin = 'https://guiadecarreras.siu.edu.ar';
export const levels = ['undergraduate', 'postgraduate'] as const;
export type Level = (typeof levels)[number];
export type Province = { code: string; name: string };
export type Offering = {
  provinceCode: string;
  province: string;
  level: Level;
  institution: string;
  academicUnit: string;
  title: string;
  degreeType: string;
  duration: string;
  admission: string;
  address: string;
  telephone: string;
  website: string;
  email: string;
};
const columns = [
  'Universidad',
  'Facultad',
  'Título',
  'Tipo de Título',
  'Duración',
  'Condiciones de Ingreso',
  'Domicilio',
  'Teléfono',
  'Web',
  'Mail',
];
const provinceCodes = 'B K H U C X W E P Y L F M N Q R A J D Z S G V T'.split(' ');
const clean = (value: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();

export function parseForm(html: string, level: Level) {
  const dom = new JSDOM(html);
  try {
    const provinces = [...dom.window.document.querySelectorAll('select[name$="provincia"] option')]
      .map((option) => ({
        code: option.getAttribute('value') ?? '',
        name: clean(option.textContent),
      }))
      .filter((province) => provinceCodes.includes(province.code));
    if (provinces.length !== 24 || new Set(provinces.map((p) => p.code)).size !== 24) {
      throw new Error('SIU form does not contain all 24 jurisdictions');
    }
    const link = html.match(/vinculador\.agregar_vinculo\('0',\{'url': '([^']+)'/);
    if (!link) throw new Error('SIU result link missing');
    const url = new URL(link[1], siuOrigin);
    if (url.origin !== siuOrigin || url.pathname !== formPath(level)) {
      throw new Error('Unexpected SIU result origin or path');
    }
    return { provinces, url };
  } finally {
    dom.window.close();
  }
}

export function resultUrl(form: URL, province: Province, level: Level): URL {
  const url = new URL(form);
  const filters = {
    titulo: '',
    idtitulopresencial: 'nopar',
    rama: 'nopar',
    disciplina: '',
    regimen: '0',
    institucion: 'nopar',
    provincia: province.code,
    localidad: '',
    nivel: level === 'undergraduate' ? '1' : '2',
  };
  for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
  return url;
}

export function parseOfferings(html: string, province: Province, level: Level): Offering[] {
  const dom = new JSDOM(html);
  try {
    const tables = dom.window.document.querySelectorAll('table.tabla-0');
    if (tables.length !== 1) throw new Error('SIU results table missing or ambiguous');
    const rows = [...tables[0].querySelectorAll('tr')];
    const headers = [...(rows.shift()?.querySelectorAll('td,th') ?? [])].map((c) =>
      clean(c.textContent),
    );
    if (JSON.stringify(headers) !== JSON.stringify(columns)) {
      throw new Error(`SIU columns changed: ${JSON.stringify(headers)}`);
    }
    return rows.map((row, index) => {
      const cells = [...row.querySelectorAll('td')].map((c) => clean(c.textContent));
      if (cells.length !== 10) {
        throw new Error(
          `Invalid SIU row ${index + 1}: expected ten cells: ${JSON.stringify(cells)}`,
        );
      }
      return {
        provinceCode: province.code,
        province: province.name,
        level,
        institution: cells[0],
        academicUnit: cells[1],
        title: cells[2],
        degreeType: cells[3],
        duration: cells[4],
        admission: cells[5],
        address: cells[6],
        telephone: cells[7],
        website: cells[8],
        email: cells[9],
      };
    });
  } finally {
    dom.window.close();
  }
}

function formPath(level: Level) {
  return `/ciie_ofertas/2.0/guia_${level === 'undergraduate' ? 'grado' : 'postgrado'}.php`;
}

async function getHtml(url: URL) {
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000), redirect: 'error' });
  if (!response.ok) throw new Error(`SIU HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const charset = response.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1];
  // La Guía sirve Latin-1; text() lo interpreta como UTF-8 y corrompe los nombres.
  const html = new TextDecoder(charset ?? 'iso-8859-1').decode(bytes);
  return { html, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function extract(output: string) {
  const retrievedAt = new Date().toISOString();
  const offerings: Offering[] = [];
  const coverage: {
    provinceCode: string;
    level: Level;
    url: string;
    sha256: string;
    count: number;
  }[] = [];
  // Una consulta a la vez: la fuente pública no ofrece un servicio de descarga masiva.
  for (const level of levels) {
    const form = parseForm((await getHtml(new URL(formPath(level), siuOrigin))).html, level);
    for (const province of form.provinces) {
      const url = resultUrl(form.url, province, level);
      const result = await getHtml(url);
      const rows = parseOfferings(result.html, province, level);
      offerings.push(...rows);
      coverage.push({
        provinceCode: province.code,
        level,
        url: url.href,
        sha256: result.sha256,
        count: rows.length,
      });
      console.log(`${province.code} ${level}: ${rows.length}`);
    }
  }
  const snapshot = { schemaVersion: 1, sourceUrl: siuOrigin, retrievedAt, coverage, offerings };
  if (offerings.length === 0) throw new Error('The national SIU capture cannot be empty');
  await mkdir(resolve(output, '..'), { recursive: true });
  // Un fallo deja intacta la captura anterior: jamás publicar medio país como completo.
  await writeFile(`${output}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(`${output}.tmp`, output);
  console.log(`SIU: ${coverage.length} queries, ${offerings.length} offerings -> ${output}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length !== 1) throw new Error('Usage: bun scripts/extract-siu-catalog.ts <output.json>');
  await extract(resolve(args[0]));
}
