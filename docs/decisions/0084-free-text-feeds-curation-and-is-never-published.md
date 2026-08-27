# ADR-0084: Free text feeds curation and is never published

- **Estado**: aceptado (2026-08-25)
- **Fecha**: 2026-08-25

## Contexto

El texto libre publicado era el único lugar del producto donde alguien podía escribir el nombre de una persona y una acusación. Tres problemas, de menor a mayor:

1. No es agregable: no alimenta ningún indicador; vive aparte de toda la maquinaria de conteos.
2. Moderación: leer todo antes de publicar no escala, y automatizarlo con un modelo falla justo en el caso borde, que es el que importa.
3. El legal, que es el grave: en Argentina la crítica sobre asuntos de interés público está despenalizada desde la reforma de 2009, pero la vía civil por daños sigue abierta, y la plataforma responde una vez notificada. El riesgo es del proyecto, no del que escribió. (Consultar con un abogado sigue pendiente; esta decisión es la prudente incluso antes de esa consulta.)

## Decisión

**El texto libre se recolecta y no se publica nunca.**

- Un solo campo, al final de la reseña: "¿Algo que no te preguntamos y deberíamos?". La pantalla dice explícitamente que no se publica y para qué sirve.
- Es **insumo interno de la curaduría**, con dos salidas:
  1. **Destilar ítems nuevos**: si trescientas personas escriben variaciones de lo mismo, eso se convierte en un ítem cerrado en la versión siguiente del instrumento (con su código nuevo y su corte de serie). El instrumento evoluciona desde lo cualitativo; la ficha publica solo lo cuantitativo.
  2. **Notas editoriales sin nombres**: el equipo puede publicar una síntesis a nivel carrera o institución (nunca cátedra: ahí el docente es identificable), con procedencia declarada ("nota del equipo, leída de comentarios que no se publican") y fecha.

Toda la señal, nada del riesgo.

## Alternativas consideradas

**Testimonio publicado con chequeo previo** (lo decidido antes). Mantiene el riesgo legal completo sobre el proyecto y un costo de moderación que no escala; el chequeo automático falla en el caso que importa.

**No recolectar texto.** Pierde la única fuente de evolución del instrumento y la señal más rica.

**Publicar con moderación automática.** El modelo acierta en lo fácil y falla en el borde: exactamente donde está el riesgo.

## Consecuencias

- Muere el testimonio público: la tesis y el glosario se reescriben (la voz del estudiante llega como número agregado y como ítem destilado, no como cita).
- El módulo de moderación se achica a casi nada: sin texto publicado no hay reportes de contenido que arbitrar.
- El backoffice gana la función de curaduría de texto: lectura, destilación de ítems, redacción de notas.
- Las notas editoriales son un artefacto nuevo con reglas propias: sin nombres, nivel carrera o institución, fechadas, con procedencia dicha en la propia ficha.
