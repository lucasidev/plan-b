# Propagación de la tesis cerrada al catálogo (2026-08-17)

> Registro de revisión ([índice](README.md)). **Alcance**: las 75 stories, los 22 flujos y las 12 personas, contra la tesis cerrada ([ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md) a [0068](../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)) y el glosario. **Método**: tres revisores en contexto fresco, uno por porción (O1 a O4 con flujos 01 a 08 y sus personas; O5 a O8 más T1 a T4 con flujos 09 a 15; BO1 a BO6 con los flujos de backoffice y las personas del equipo), con la misma lista de control (R1 a R7, P1 a P14) y el mismo formato de salida. **Aplicado** en el commit `1aa98b6` (`docs(domain): the catalog reads against the closed thesis`).

## Qué se aplicó

- **39 criterios reescritos** por vocabulario viejo ("n", "el valor de cada frase", "1.9 y 3.8", "el rol"), por prometer menos de lo decidido, o porque una decisión los volvió imposibles tal como estaban: O1-1, O1-2, O1-3, O1-4, O1-5, O1-6, O1-7, O2-1, O2-4, O4-4, O4-5, O4-8, O4-9, O5-1, O5-2, O6-2, O7-1, O7-2, O7-3, O7-5, O8-1, O8-2, O8-3, O8-4, O8-6, T1-1, T1-3, T2-3, T3-5, T3-6, T4-1, BO1-1, BO2-1, BO2-2, BO2-4, BO5-1, BO5-2, BO5-3, BO6-1. O5 dejó de ser garantía: deshacer se construye.
- **19 stories nuevas** que una decisión pedía y nadie construía: O1-8, O4-10, O4-11, O4-12, O4-13, O7-8, O8-7, O8-8, T1-4, T3-7 (después fusionada en O1-8), BO1-5, BO1-6, BO1-7, BO1-8, BO1-9, BO2-5, BO2-6, BO3-3, BO4-6. Las tres que más faltaban: el evento institucional (ninguna story lo mencionaba), el catálogo de frases como pantalla con dueño, y el testimonio en sí.
- **El mapa y las personas** dicen lo mismo que la tesis: `abandono` como la pregunta de trayectoria, `baja` que anonimiza y preserva, `votar` como "a mí también me pasó", `reportar` con mail confirmado, `bo/frases`, dos colas de moderación y dos de verificación, los flujos BO-8 y BO-9.
- **Una contradicción mía**, resuelta en el mismo commit: 0065 y la tesis decían "proporciones de personas" y 0066 suma voces sin deduplicar; la letra es "voces" (personas en la ficha de una cursada, una por cursada arriba).
- **"No juzga lo que mide"** ya no dice "publicamos el número, no el veredicto".

## Lo que no arregla ninguna story: decisiones pendientes

Las diez se cerraron entre el 2026-08-18 (D01 por [ADR-0069](../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md); D02 a D10 como se recomendaron, aplicadas en su story, el mapa, el glosario, las personas y los ADRs que tocaban). El estado de cada una dice dónde quedó.

| ID | Decisión | Recomendación | Estado |
|---|---|---|---|
| D01 | **Qué recaba "marcar el plan"** (O3-2, `micarrera`): el filtro "lo que todavía puedo cursar" necesita saber qué aprobaste en todo el plan, y la tesis no lo pide. | La primera recomendación (el hecho suelto "la cursé, cómo terminó" desde el plan) se retiró: diluye los conteos si cuenta como reseña y es un tercer tipo de dato si no; y es el inventario con otro nombre. Lo que se recomendó y decidió: lo que marcás en el plan es **preferencia privada, no dato**; lo reseñado con cómo terminó viene marcado como hecho; O3-2 filtra con las dos cosas. | **Cerrado** el 2026-08-18: [ADR-0069](../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md); O3-2 y O3-3 reescritas, `micarrera` definida en el mapa, término en el glosario. |
| D02 | **"Clases sin dar" es un escalar** (O4-6) y no tiene unidad de publicación. | Mediana y rango con sus voces ("clases sin dar: 4, entre 2 y 8, 12 voces"), sin piso. Era F6 de la [revisión del 16](2026-08-16-catalog.md). | **Cerrado** el 2026-08-18: mediana y rango con voces, sin piso (O4-6, glosario "Clases sin dar", tesis punto 1). |
| D03 | **El pedido de carrera** (O2-2): ¿confirma el mail por link como el reporte? | Sí: misma regla que D3 del 16; la cola pública cuenta confirmados. Era E3. | **Cerrado** el 2026-08-18: confirma el mail por link; la cola cuenta confirmados (O2-2, O2-3, `pedir` y `cola` en el mapa). |
| D04 | **El denominador del gate de cobertura cuando coexisten dos planes** (BO5-1 contra ADR-0066). | Materias canónicas de la carrera (la unión de planes): es la consecuencia de haber decidido materia canónica (G6). | **Cerrado** el 2026-08-18: materias canónicas de la carrera, sobre todos sus planes (ADR-0066 §4, tesis punto 8, glosario, O1-8, mapa). |
| D05 | **BO5-3 después de D3**: agrupar por mail confirmado no agrupa "doce de la misma facultad" con mails distintos. | Agrupar además por objetivo y ventana (misma cátedra o institución en 72 horas); el mail deduplica. | **Cerrado** el 2026-08-18: por objetivo y ventana de 72 horas; el mail deduplica (BO5-3, flujo BO-6). |
| D06 | **El docente nunca notificado** (O7-6, Paredes): "todavía no respondió" presupone una pregunta que solo se le hace al verificado. | Declarar el estado del canal: "sin réplica" y, si aplica, "docente sin identidad verificada"; nunca "no quiso". Era F4. | **Cerrado** el 2026-08-18: estado del canal, "sin réplica" y "docente sin identidad verificada"; nunca "no quiso" (O7-6, Paredes, glosario "Réplica"). |
| D07 | **Corregir un dato** (T1-2): ¿pide aporte previo o solo cuenta? | Cuenta. Era H. | **Cerrado** el 2026-08-18: cuenta alcanza (T1-2, rol "quien vuelve"). |
| D08 | **La materia pendiente de vincular** (T3-1): ¿cuenta en alguna ficha antes de vincularse? ¿entra a la cobertura? | No cuenta ni entra hasta vincularse; el autor la ve como pendiente en Mis aportes. Era G7. | **Cerrado** el 2026-08-18: no cuenta ni entra a la cobertura hasta vincularse; visible como pendiente (T3-1, glosario "Pendiente de vincular", flujo 14). |
| D09 | **Verificación y moderación como roles excluyentes** (BO3-3; era D4 del 16). Implica cuatro personas de equipo mínimo y parte a Nahuel en dos. | Sí. | **Cerrado** el 2026-08-18: sí; equipo mínimo de cuatro; Nahuel (moderación) y Camila (verificación) (BO3-3, BO6-1, `bo/equipo`, personas, roles del catálogo). |
| D10 | **Los hechos de trayectoria al dar de baja la cuenta**: G5 decía "el año de ingreso se generaliza a rango"; 0067 recalcula cohortes desde los hechos. | Los hechos quedan exactos y ya anónimos (la cuenta se anonimizó); quien quiera sacar algo lo borra antes. | **Cerrado** el 2026-08-18: exactos y anónimos (O5-2, ADR-0067). |

Un aviso que no es decisión: si alguien borra un aporte, la serie y los agregados cambian hacia atrás. 0064 ya dice que la lista se reprocesa y O8-8 publica la fecha de lectura; no se proponen "cortes con fecha" (vinieron del grupo A del 16 y se descartaron).

## Lo que los revisores señalaron y quedó fuera de este alcance

- La duración nominal vive en `Career`, nullable, y ADR-0067 la usa "del plan"; con dos planes de distinta duración no hay dónde guardar la segunda. Es del modelo de datos nuevo (BO1-1 la exige como hueco bloqueante).
- `bo/verificaciones` se apoya en un mecanismo docente que no existe: BO2-6 lo construye; el modelo todavía tiene `institutional_email_domains`.
- La segunda capa de BO6-1 (una persona externa con lectura del registro) se resolvió con D09: lee el registro ya disociado, como manda BO3-3.
