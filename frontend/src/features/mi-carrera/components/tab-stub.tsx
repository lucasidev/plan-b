type Props = {
  /** Label del tab a mostrar en el copy "Próximamente: {label}". */
  label: string;
  /** US futura que va a traer el contenido real (display only). */
  futureUs: string;
};

/**
 * Stub `Próximamente` parametrizable para los 5 tabs del shell `/mi-carrera`
 * mientras los slices US-045-b/c/d/e aterrizan. Cuando un slice mergea,
 * el switch de la página `mi-carrera/page.tsx` reemplaza este componente
 * por el real (ej. `<PlanGrid />`).
 *
 * Mantiene el espíritu de "honesto sobre el estado" del rediseño: no
 * escondemos el tab, decimos qué falta y cuándo aterriza.
 */
export function TabStub({ label, futureUs }: Props) {
  return (
    <div className="bg-bg-card border border-line rounded p-10 text-center">
      <h2 className="font-display font-semibold text-xl text-ink mb-2">Próximamente: {label}</h2>
      <p className="text-sm text-ink-3 max-w-md mx-auto">
        Esta vista llega con {futureUs}. Mientras tanto, el resto de los tabs ya tienen contenido o
        están por aterrizar también.
      </p>
    </div>
  );
}
