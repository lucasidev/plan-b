/**
 * Cómo se nombra una materia que puede no tener código cargado (contrato de academic: `code` es
 * opcional). Con código, "código · nombre"; sin código, solo el nombre, nunca un " · " colgando
 * ni un placeholder en su lugar.
 */
export function subjectLabel(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}
