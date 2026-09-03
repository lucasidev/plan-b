# Deshacer: el flujo

> Reemplaza a la fila 09 de la tabla de flujos del [mapa](../../map.md) (Deshacer, lo que hace que se animen), y dibuja también el reporte sin cuenta, que el mapa tiene como acción inline sobre la ficha. Personas: quien ya aportó (Matías, Lucía, Diego); quien lee, incluido el que una reseña difama, para reportar sin cuenta (US-167). Disparador: entra a Mis aportes para modificar algo que reseñó, o lee algo publicado que lo daña. Stories que cubre: US-165, US-166, US-167, US-205, US-206.

```mermaid
flowchart TD
  A([Mis aportes: entra a modificar algo que reseñó]) --> B{Editar}
  B -->|edita una respuesta| B1[Se actualiza esa respuesta:<br/>los conteos de la frase se recalculan, US-165]
  B -->|edita el campo libre| B1b[Se guarda directo, sin chequeo:<br/>nunca se publica, ADR-0084]
  B -->|borra la reseña entera| B2[La reseña deja de contar en todos los conteos:<br/>es tuyo, se borra de a uno]
  B1 --> C[Mis aportes se actualiza]
  B1b --> C
  B2 --> C
  C --> D{Quiere irse: Baja}
  D -->|antes, si quiere sacar algo puntual| B
  D -->|confirma| E([La identidad se anonimiza<br/>las reseñas quedan, exactas, US-166])

  F([Lee algo publicado que lo daña]) --> G[Reportar: modal sobre la ficha, sin cuenta<br/>motivo y mail, US-167]
  G --> H{Confirma el mail por link}
  H -->|no confirma| H1([No entra a la cola])
  H -->|confirma| I[Entra a la cola: sigue publicado hasta que alguien resuelve, US-205]
  I --> J([Le llega el criterio aplicado al mail, US-206])
```

## Pantallas

- [Mis aportes](screens/SC-018-my-contributions/README.md): la entrada a modificar algo publicado, y donde se actualiza después de editar o borrar (nodos A, C).
- [Editar](screens/SC-017-edit/README.md): modificar una respuesta o el campo libre, o borrar la reseña entera, de a uno (nodos B, B1, B1b, B2).
- [Mi perfil](screens/SC-019-my-profile/README.md): de donde se abre la puerta a Baja; el diagrama no la dibuja como paso propio, "Quiere irse" (nodo D) pasa por ahí.
- [Baja](screens/SC-016-delete-account/README.md): confirmar la baja, que anonimiza la identidad y preserva las reseñas (nodos D, E).
- [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md) y [Ficha de materia](../choose-where-to-study/screens/SC-007-subject/README.md): donde vive la acción "Reportar", inline y sin cuenta (nodos F, G).
- [Reportes](../../team/moderate-without-breaking-the-product/screens/SC-031-reports/README.md): la cola donde una persona resuelve el reporte ya confirmado (nodos I, J).

## Salidas y errores

- **Respuesta editada**: se actualiza al instante, sin ningún chequeo; los conteos de la frase se recalculan hacia atrás.
- **Campo libre editado**: se guarda directo, sin chequeo, porque nunca se publica (ADR-0084).
- **Reseña borrada**: deja de contar en cualquier agregado, de una vez: no hay borrado parcial de la cursada disfrazado de borrado total.
- **Baja de cuenta**: irreversible en la identidad (se anonimiza) y preserva las reseñas exactas (US-166); lo que se quiera sacar puntual, antes por Editar.
- **Reporte sin mail confirmado**: no entra a la cola.
- **Mientras el reporte espera**: sigue publicado (US-205); nada baja solo por cantidad de reportes.

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Qué campos de una reseña publicada admite Editar (período, cátedra, o solo respuestas y campo libre); el copy exacto de Baja; el motivo desplegable de Reportar y cuánto tiempo se guarda un aporte a medias antes de retomarlo o perderlo.
