/**
 * Toda ruta pública es superficie Boletín (ADR-0071): el layout envuelve una sola vez para que
 * ninguna quede en la paleta del chasis anterior. Las páginas que ya traen su propio wrapper
 * (fichas de cátedra, materia, carrera, método) anidan el mismo atributo sin cambiar nada: la
 * variable resuelve igual estando una o dos veces en el árbol.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="bulletin" className="min-h-screen w-full">
      {children}
    </div>
  );
}
