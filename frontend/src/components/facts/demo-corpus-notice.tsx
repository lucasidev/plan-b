/**
 * Aviso de que las voces que la ficha cuenta hoy vienen del corpus de demostración sembrado
 * (`CorpusSeedData`, backend), no de alguien que reseñó de verdad. Vive acá y no en una sola
 * feature porque lo muestran la ficha de cátedra y la muestra de la entrada, las dos pantallas que
 * hoy publican esas voces (ADR-0083).
 *
 * `hasDemoCorpusVoices` lo recalcula el backend en cada pedido contra el id de cada reseña contada
 * (`IChairTallyQueryService.HasDemoCorpusVoicesAsync`): el día que una cátedra publique solo con
 * reseñas reales, el campo llega en false y este aviso deja de aparecer solo, sin que quede una
 * bandera que alguien tenga que acordarse de sacar.
 */
export function DemoCorpusNotice() {
  return (
    <p className="mb-4 rounded-sm bg-bg-elev px-3 py-2 text-[12px] leading-relaxed text-ink-2">
      Estas reseñas son de prueba. Las cargamos nosotros para mostrar cómo funciona la ficha:
      todavía no hay reseñas reales.
    </p>
  );
}
