# Avisos: el flujo

> Reemplaza a la fila 08 (Los avisos, lo que cierra el circuito) de la tabla de flujos del [mapa](../map.md). Personas: todos los que reciben un mail. Disparador: cerró el período, se cargó lo que alguien pidió, la ficha de un reseñado juntó reseñas nuevas, o una cuenta inactiva nunca dijo si se recibió. Stories que cubre: US-142, US-149, US-156, US-193, US-169; el disparador del aviso al reseñado queda como hueco declarado (ver el README de la épica).

```mermaid
flowchart TD
  A([Cerró el período]) --> A1[Nombra una materia concreta → Reseñar, US-149]
  A1 --> P([Todos se apagan en Mi perfil])

  B([Cargamos lo que pediste]) --> B1[Link a la ficha, se lee sin cuenta, US-142, US-193]
  B1 -->|se registra| B2[Institución y carrera precargadas:<br/>no se preguntan de nuevo, US-169]
  B1 --> P
  B2 --> P

  C([Tu ficha juntó reseñas nuevas]) --> C1[Sin fecha ni hora por reseña:<br/>ningún aviso permite inferir cuándo aportó alguien → Responder]
  C1 --> P

  E([Reenganche anual: cuenta inactiva]) --> E1[Una sola pregunta, respondible desde el mail<br/>sin entrar a la app, US-156]
  E1 -->|responde| E2([Se apaga para siempre, US-169])
  E1 -->|no responde| E3([Vuelve a preguntarse el año que viene])
  E2 --> P
```

## Salidas y errores

- **No responder el reenganche anual no cierra nada**: la pregunta vuelve a mandarse el año que viene (US-156); solo responderla la apaga para siempre (US-169).
- **El aviso al reseñado nunca dice cuándo se publicó cada reseña**: sin fecha ni hora por reseña; ningún aviso permite reconstruir el momento de un aporte.
- **Registrarse desde el link de "cargamos lo que pediste" precarga institución y carrera**: no se vuelven a preguntar (US-142, US-169).
- **Ningún hecho ya declarado se vuelve a preguntar** por otro camino de aviso (US-169).

## Pantallas

Este flujo no dibuja pantallas del sitio: los caminos son el contenido de mails distintos, y todos viven en [Avisos](screens/SC-034-mail/README.md). Dónde se apaga cada uno es [Mi perfil](../student/undo/screens/SC-019-my-profile/README.md), de la épica Deshacer.

## Lo que el flujo no dibuja y la ficha de la pantalla decide

El copy exacto de cada mail; qué evento o cadencia dispara el aviso al reseñado (hueco declarado en el README de la épica); cómo se ve en Mi perfil el lugar donde se apaga cada aviso.
