# Avisos: el flujo

> Reemplaza a la fila 08 (Los avisos, lo que cierra el circuito) de la tabla de flujos del [mapa](../../design/product-map.md). Personas: todos los que reciben un mail. Disparador: cerró el período, se cargó lo que alguien pidió, hay un resumen para el docente, va a salir una réplica sobre un testimonio propio, o una cuenta inactiva nunca dijo si se recibió. Stories que cubre: O2-4, O4-5, O4-12, O7-5, BO1-3, T2-2, O6-2.

```mermaid
flowchart TD
  A([Cerró el período]) --> A1[Nombra una materia concreta → Reseñar, O4-5]
  A1 --> P([Todos se apagan en Mi perfil])

  B([Cargamos lo que pediste]) --> B1[Link a la ficha, se lee sin cuenta, O2-4, BO1-3]
  B1 -->|se registra| B2[Institución y carrera precargadas:<br/>no se preguntan de nuevo, O6-2]
  B1 --> P
  B2 --> P

  C([Resumen al docente verificado]) --> C1[Sin fecha ni hora por reseña:<br/>ningún aviso permite inferir cuándo aportó alguien → Responder, O7-5]
  C1 --> P

  D([Va a salir una réplica sobre tu testimonio]) --> D1{En el plazo desde el aviso, ¿qué hacés?}
  D1 -->|editás| D2[Vuelve al chequeo previo → Reseñar]
  D1 -->|borrás| D3([La réplica no sale, T2-2])
  D1 -->|pedís revisión| D4([Alguien la mira antes de que salga:<br/>qué decide ahí no está escrito])
  D2 --> P

  E([Reenganche anual: cuenta inactiva]) --> E1[Una sola pregunta, respondible desde el mail<br/>sin entrar a la app, O4-12]
  E1 -->|responde| E2([Se apaga para siempre, O6-2])
  E1 -->|no responde| E3([Vuelve a preguntarse el año que viene])
  E2 --> P
```

## Salidas y errores

- **No responder el reenganche anual no cierra nada**: la pregunta vuelve a mandarse el año que viene (O4-12); solo responderla la apaga para siempre (O6-2).
- **El resumen al docente nunca dice cuándo se publicó cada reseña**: es periódico, sin fecha ni hora por reseña (O7-5); ningún aviso permite reconstruir el momento de un aporte.
- **Registrarse desde el link de "cargamos lo que pediste" precarga institución y carrera**: no se vuelven a preguntar (O2-4, O6-2).
- **Ningún hecho ya declarado se vuelve a preguntar** por otro camino de aviso (O6-2).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

El copy exacto de cada mail; qué pasa si el plazo de T2-2 vence sin que el autor edite, borre o pida revisión, y qué resuelve la revisión pedida; la cadencia del resumen al docente; cómo se ve en Mi perfil el lugar donde se apaga cada aviso.
