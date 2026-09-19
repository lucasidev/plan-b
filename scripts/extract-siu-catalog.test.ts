import assert from 'node:assert/strict';
import test from 'node:test';
import { parseForm, parseOfferings, resultUrl } from './extract-siu-catalog.ts';

const headers = [
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
const row = (cells: string[]) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
const table = (cells: string[]) => `<table class="tabla-0">${row(headers)}${row(cells)}</table>`;
const province = { code: 'X', name: 'Córdoba' };

test('preserva acentos, sede, duración fraccionaria y texto fuente del enlace', () => {
  const data = parseOfferings(
    table([
      'Universidad de C&oacute;rdoba',
      'Sede Centro',
      'T&eacute;cnico',
      'Final',
      '2,5 Años',
      'Ingreso Directo',
      'calle - Centro - Córdoba',
      '',
      '<a href="https://http://example.org">http://example.org</a>',
      '',
    ]),
    province,
    'undergraduate',
  );
  assert.equal(data[0].institution, 'Universidad de Córdoba');
  assert.equal(data[0].duration, '2,5 Años');
  assert.equal(data[0].website, 'http://example.org');
  assert.equal(data[0].provinceCode, 'X');
});

test('rechaza errores HTTP disfrazados de HTML, columnas nuevas y filas truncadas', () => {
  assert.throws(() => parseOfferings('<h1>Error</h1>', province, 'undergraduate'), /table/);
  assert.throws(
    () =>
      parseOfferings(
        table(['U', 'F', 'T']).replace('Duración', 'Horas'),
        province,
        'undergraduate',
      ),
    /columns/,
  );
  assert.throws(() => parseOfferings(table(['U', 'F', 'T']), province, 'undergraduate'), /row/);
});

test('no mezcla ofertas homónimas dictadas en domicilios diferentes', () => {
  const cells = ['U', 'F', 'T', 'Final', '4 años', '', 'A - Centro - Córdoba', '', '', ''];
  const html = `<table class="tabla-0">${row(headers)}${row(cells)}${row(cells.with(6, 'B - Norte - Córdoba'))}</table>`;
  assert.equal(parseOfferings(html, province, 'undergraduate').length, 2);
});

test('un formulario incompleto no se acepta como país entero', () => {
  assert.throws(
    () =>
      parseForm(
        '<select name="provincia"><option value="X">Córdoba</option></select>',
        'undergraduate',
      ),
    /24/,
  );
});

test('consulta el token vivo y el nivel de posgrado sin filtrar por modalidad', () => {
  const url = resultUrl(
    new URL('https://guiadecarreras.siu.edu.ar/ciie_ofertas/2.0/guia_postgrado.php?ah=live'),
    province,
    'postgraduate',
  );
  assert.equal(url.searchParams.get('ah'), 'live');
  assert.equal(url.searchParams.get('nivel'), '2');
  assert.equal(url.searchParams.get('provincia'), 'X');
  assert.equal(url.searchParams.get('idtitulopresencial'), 'nopar');
});
