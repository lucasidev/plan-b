# Revisión adversarial: las trece épicas y sus pantallas (2026-08-19)

> Registro de revisión ([índice](README.md)). **Alcance**: las trece épicas de `docs/epics/` (README, flujo y sus 19 pantallas propias con ficha y boceto), la Ficha de cátedra, y la coherencia de los cuatro índices (épicas, catálogo, inventario de pantallas, mapa). **Método**: tres revisores en contexto fresco, cada uno con un lote y las mismas fuentes (tesis, ADR-0063 a 0070, D01-D10, glosario, catálogo de frases, personas); solo hallazgos verificables contra una fuente, con cita de los dos textos. **Aplicado** el 2026-08-19 (commit `docs(epics): the adversarial review of the thirteen epics lands; forty-six findings, forty fixed`). Las 14 pantallas compartidas escritas el mismo día **no entran en este alcance**: su revisión es el [registro de compartidas](2026-08-19-shared-screens.md), del mismo día.

Estados: **corregido** (el arreglo está aplicado, se dice cuál), **abierto** (real, registrado como pregunta abierta en la ficha o la épica que corresponde), **descartado** (no era un hallazgo, se dice por qué).

## R1 · Elegir dónde estudiar, Pedir una carrera, Mi carrera, Reseñar

| ID | Hallazgo | Estado |
|---|---|---|
| R1-01 | Dónde estudiarla publicaba proporciones de frase peladas (sin voces, período ni encogimiento), contra ADR-0066 §5 y O1-5 | Corregido: cada fila es "k de N voces · encogido X% · en M materias", con el período de sustento al pie |
| R1-02 | Las tres proporciones de la cohorte sumaban 100: eran crudas, sin Wilson (la alternativa D que ADR-0064 descartó) | Corregido: cada proporción con su encogido calculado; la nota dice por qué no suman 100 |
| R1-03 | La cohorte cerrada de UTN usaba la ventana de UNSTA: con nominal 5,5 el corte es 2017, no 2018 (ADR-0067) | Corregido: el corte depende de la nominal de cada oferta, y lo dice |
| R1-04 | La trayectoria no declaraba "de los que se recibieron y reseñaron acá" (O1-1 crit. 3, O1-7, Silvia) | Corregido: la leyenda va en duración y cohorte |
| R1-05 | Las listas por eje de las dos ofertas mostraban frases distintas: no había fila comparable ("dato por dato", ADR-0067 §6) | Corregido: las mismas frases fila contra fila; la que falta dice "sin voces todavía" |
| R1-06 | La cabecera perdía el predicado ("5 de cada 10" pelado bajo la etiqueta del eje: el número que ADR-0064 vigila) | Corregido: "dicen que es dura" / "marcaron alguien fallando" |
| R1-07 | El estado sin cabecera titulaba con el nombre local, no el canónico; el conteo de ofertas no cerraba | Corregido: título canónico con el nombre local en nota; conteo alineado |
| R1-08 | "Sin cátedra, las frases de cátedra cuentan en la materia" contradice ADR-0065 (el sujeto decide la ficha); y las clases sin dar quedaban sin ficha donde ir | Corregido: sin cátedra no se ofrecen las frases de cátedra ni la pregunta de clases sin dar; queda abierta la "cátedra sin identificar" (G2 superada) |
| R1-09 | Dentro de una cursada no había dónde marcar frases de administración/institución, contra ADR-0064 §1 ("un solo acto cubre las tres") y ADR-0066 §2 | Corregido: el paso 5 gana "¿Y alrededor de la cursada?" con las frases de administración e institución; `phrases.md` alineado |
| R1-10 | El resumen final de Reseñar no coincidía con lo marcado (decía 2 frases de cátedra, listaba una no marcada y del sentido opuesto, denominador compartido materia/cátedra) | Corregido: el cierre lista lo marcado, cada frase con su sujeto y su denominador |
| R1-11 | El evento institucional no preguntaba cuándo pasó (ADR-0067 §5 pide la fecha del evento) y pasaba por "¿Cátedra?" | Corregido: el flujo pregunta cuándo pasó y salta la cátedra; la ficha lo dice |
| R1-12 | Períodos codificados en la UI ("2025 1C"), contra ADR-0051 y el glosario | Corregido: "2025 · 1er cuatrimestre" en todo el boceto de Reseñar |
| R1-13 | El filtro de co-cursada de Mi carrera incluía una materia sin marcar y sin correlativa cumplida | Corregido: el filtro y los pares usan solo lo que el plan de arriba sostiene |
| R1-14 | La cola publicaba una capacidad cuatro veces menor que la declarada (dos por semana, BO4-1/Sofía) y una espera implausible | Corregido: hasta ocho por mes, corte coherente, espera plausible, paginación que cierra |

## R2 · Deshacer, Que no me molesten, Replicar, Llevarse el dato, Cuidar lo publicado, Ficha de cátedra

| ID | Hallazgo | Estado |
|---|---|---|
| R2-01 | Editar declaraba "entré no se borra: es el dato que ata todo lo demás": excepción que ninguna fuente crea (ADR-0067: se borra de a uno) | Corregido: se borra como todo hecho |
| R2-02 | La Ficha de cátedra encogía mal: 56%→49% y 76%→68% cuando Wilson con n=41 da 41% y 61%; las listas publicaban proporciones ambiguas | Corregido: cabecera y listas con "k de 41 · encogido X%" calculados con la fórmula publicada |
| R2-03 | La serie sin voces por barra y con valores aritméticamente imposibles contra la cabecera | Corregido: cada barra con sus voces, crudo y encogido; los conteos suman 41 |
| R2-04 | Responder prometía "no sabemos quién es esa persona": falso (ADR-0009: la identidad se retiene, no se publica) | Corregido: "no te decimos quién es" |
| R2-05 | "Toman lo que no dieron" (destilada) aparecía sin la marca de síntesis en dos testimonios (BO1-9 crit. 3, O8-8) | Corregido: marca "· síntesis" en los dos |
| R2-06 | Editar no decía qué pasa con las clases sin dar al destildar la frase que las sostiene (O4-6, D02) | Corregido: destildar la frase retira el número declarado |
| R2-07 | Que no me molesten decía "la Ficha de cátedra, la única escrita": había veinte; y la verificación O6 de las fichas nuevas no está hecha | Corregido el texto; la verificación O6 queda como parte de la revisión adversarial pendiente de cada ficha |
| R2-08 | La confirmación de borrado de Editar contaba frases que sus propios chips no mostraban | Corregido: cuenta lo que los chips muestran |
| R2-09 | Método publicaba "Pedidas, sin confirmar · 214": lo que D03 descartó (solo cuentan mails confirmados) | Corregido: pedidas con mail confirmado |
| R2-10 | Baja justificaba el no-borrado-en-bloque con dos razones inventadas que ADR-0067 y el registro del 17 contradicen | Corregido: la razón real (cada aporte es una decisión; lo no borrado queda exacto y anónimo; los agregados se recalculan) |
| R2-11 | Baja decía "la misma lista de Mis aportes" excluyendo dos tipos de aporte del glosario, y daba botón Editar a un voto (retirarlo es pregunta abierta) | Corregido: lista lo que la baja preserva; el voto sale; el pedido va con el mail, no con la cuenta |
| R2-12 | La ficha de Baja prometía "tu mail deja de existir" cuando ADR-0044 lo convierte en hash | Corregido: el nombre se borra, el mail se hashea irreversible |
| R2-13 | Editar: el contexto fijo y la pregunta abierta se contradecían sobre "cómo terminó" | Corregido: contexto fijo (materia, período, cómo terminó, cátedra); la pregunta abierta los nombra a todos |
| R2-14 | El flujo de Replicar colgaba "docente sin identidad verificada" del resumen que solo le llega al verificado (O7-5, D06) | Corregido: dos terminales separadas |
| R2-15 | Una reseña sin comentario no tiene superficie donde recibir el voto (T1-1: el voto va sobre la reseña entera; sin comentario no es testimonio) | Abierto: registrado en Cuidar lo publicado |

## R3 · Sostener el catálogo, Moderar, Cortar los accesos, Avisos, los índices

| ID | Hallazgo | Estado |
|---|---|---|
| R3-01 | BO2-3, BO2-4 y BO4-4 escritas con el rol "quien modera" cuando su trabajo es de verificación (D09, la lista cerrada de roles, la propia ficha de Verificaciones) | Corregido: las tres filas dicen "quien verifica" |
| R3-02 | El aviso de la réplica (T2-2, P1) era apagable como cualquier otro: apagado, el plazo nunca arranca o la protección muere en silencio | Corregido: ese aviso no se apaga; los otros cuatro sí |
| R3-03 | Avisos declaraba cinco caminos y dejaba huérfanos los mails de BO2-2 (criterio al reportante) y BO4-2 (qué cambió) | Corregido: registrados como mails del mismo canal, no apagables ni de cuenta; los índices los nombran |
| R3-04 | El panel "Resolver un reporte" de Reportes aplicaba a un retenido la regla del reportado (mail a un reportante que no existe; "dejar publicado" sobre lo no publicado) | Corregido: el ejemplo es un reportado; el retenido se libera o se baja, y el autor ve por qué |
| R3-05 | El flujo de Moderar inventaba una tercera salida del retenido ("vuelve al autor") que BO2-5 no concede | Corregido: dos salidas |
| R3-06 | El aviso de reproceso de Frases contaba solo fichas de cátedra: corregir un eje reprocesa todos los niveles (ADR-0066) | Corregido: cuenta cátedras, materias, carreras e institución |
| R3-07 | La ficha de Frases hacía que la destilación leyera solo lo publicado, contra ADR-0068 §7 ("alimenta la destilación siempre") | Corregido: lee todas, publicadas o no |
| R3-08 | Pedidos avisaba a "34 cuentas": el pedido no tiene cuenta (O2-2, D03) | Corregido: 34 mails confirmados |
| R3-09 | La ficha de Pedidos decía que Pedir y La cola no tenían ficha: la tienen | Corregido: linkeadas |
| R3-10 | Tres filas del inventario no listaban épicas que las fichas sí citan (Reportes y Frases → Llevarse el dato; Avisos → Que no me molesten) | Corregido: filas completadas |
| R3-11 | Verificaciones mostraba un "legajo" que ninguna fuente hace declarar a la cuenta (Registro pide rol, institución y carrera; BO2-3 pide lo mínimo) | Corregido: sin legajo |
| R3-12 | Equipo inventaba "cada fila, un rol, nunca dos a la vez": lo único imposible es el par moderación+verificación y la autoasignación del Admin (BO3-3) | Corregido |
| R3-13 | Datos de ejemplo contradictorios entre bocetos (cátedras con materias distintas, dos titulares para Pérez, la misma correlativa con dos valores) | Corregido: canon unificado (Gómez da Análisis Matemático II; Ibáñez, Física II; la titular de Pérez es Claudia Fernández) |
| R3-14 | Números de boceto que no cierran (mails deduplicados, paginación, "los cinco sujetos" con cuatro) | Corregido en Reportes, La cola y Frases |
| R3-15 | La baja de ejemplo de Equipo era de alguien que no estaba en el equipo listado | Corregido: la baja es de Camila, con la pregunta abierta de cómo se cubre verificación a la vista |
| R3-16 | ADR-0070 decía que las doce épicas restantes tienen flujo: Que no me molesten es garantía y no tiene | Corregido en el ADR |
| R3-17 | Avisos se declaraba "la pantalla que más stories sostiene" (Reseñar resuelve 16) y citaba una fuente equivocada | Corregido: sostiene seis stories de cuatro épicas, con la fuente real (M05, ADR-0040) |

## Lo que los revisores chequearon y pasó limpio

Conteos y unicidad (93 stories, cada una en una sola épica; los índices cierran entre sí y contra el disco); todas las citas de ID verificadas contra la letra en la épica dueña; las frases de los bocetos textuales del catálogo con el eje correcto; ningún puntaje, escala, ranking, compuesto ni destacado en ningún boceto; ningún nombre de autor ni "cómo terminó" publicado; el anonimato como mecanismo (gates, colas separadas, "nada baja solo") aplicado en todos los flujos; D03 y D05 idénticos en story, flujo, ficha y boceto; los tres estados del vacío y el gate de cobertura bien aplicados.

## Deuda que este registro deja explícita

- **Las 14 pantallas compartidas** (`docs/design/screens/`) se escribieron el mismo día y no pasaron esta revisión: las revisó el [registro siguiente](2026-08-19-shared-screens.md).
- **La verificación O6 por ficha** (las cuatro preguntas de la garantía) está hecha solo para la Ficha de cátedra; para el resto es parte de su revisión pendiente.
- "Oferta" se usa en Sostener el catálogo sin entrada en el glosario (el glosario ya lo usa así en "Carrera canónica"): deuda de glosario anterior a este trabajo.
