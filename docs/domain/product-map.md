# Product map

La estructura del producto nuevo, portada del canvas `plan-b mapa` (2026-08-16). Este doc es la copia versionada de lo que el canvas define: rutas, flujos, planos y reglas. Las user stories viven en [`user-stories.md`](user-stories.md) (catálogo vigente) y las personas en [`user-personas.md`](user-personas.md). La tesis que gobierna todo: [`THESIS.md`](../THESIS.md).

**Estado**: orientativo. Es la estructura que el mapa propone (rutas, flujos, planos), útil para entender qué vistas podría necesitar el producto; **no fija el diseño final ni la UX/UI**. Lo vinculante son las stories de [`user-stories.md`](user-stories.md) y las personas. Nada de esto está construido; el cruce contra el código real está al final.

## Los tres planos

1. **El catálogo.** Instituciones, carreras, planes, correlativas. Lo cargamos nosotros, a mano y completo: la calidad del dato base no se crowdsourcea. Una carrera está cargada entera o no está. Sin cobertura no hay nada: si la institución no está cargada no hay ficha, ni plan, ni materias. No inventamos una ficha vacía.
2. **Lo que publicamos.** Las frases con sus voces por eje, la atribución (que es la lectura de los ejes), la serie, los testimonios. Todo derivado del corpus, nada declarado a mano. La ausencia no es un juicio: decimos "no la cargamos todavía", no "no hay datos", y muchísimo menos un cero.
3. **Lo que hacemos.** Publicar, atribuir y exigir respuesta. Es el único plano donde alguien sin cobertura tiene lugar: el pedido es un dato público. Cuánta gente reclama que se cargue algo dice dónde la comunidad quiere que se mire y no llegamos.

## Las rutas

### Públicas (12) · leer el escrutinio, sin login

| Ruta | Qué es |
|---|---|
| `inicio` | La vitrina (landing). |
| `explorar` | El home real: dos lentes, carreras y universidades. |
| `donde` | Comparar: las ofertas de una carrera, lado a lado. |
| `carrera` | Ficha de carrera en una institución. Los dos ejes con sus frases y la atribución juntas, derivados de sus cursadas con la cobertura a la vista. |
| `institucion` | El sujeto evaluado: gestión, serie, respuesta oficial y cómo se compara. |
| `materia` | Ficha de materia. Correlativas: qué pide y qué abre. |
| `catedra` | Ficha de cátedra, por docente, comparada con las otras. |
| `metodo` | Cómo lo calculamos: fórmula, qué no hacemos, el corpus de frases y la descarga del crudo. |
| `pedir` | Pedir una carrera, sin cuenta: solo el mail para avisarte. |
| `cola` | Qué falta cargar: la cola de pedidos, pública, cuántos piden cada carrera y cuáles ya están. |
| `anonimato` | Cómo te cubrimos: la posición de anonimato explicada. |
| `error` | Se rompió. |

### El umbral (3)

| Ruta | Qué es |
|---|---|
| `ingresar` | Con el motivo a la vista y vuelta a donde ibas. |
| `registro` | Rol, institución y carrera. Es declarar dónde estás, no elegir. |
| `recuperar` | Recuperar contraseña. |

### Con cuenta (6) · producir y lo tuyo

| Ruta | Qué es |
|---|---|
| `empezar` | Onboarding: marcás por dónde vas. Shell de foco, sin nav. Saltable y retomable. |
| `micarrera` | Tu plan (el corral), con la pestaña de combinaciones. |
| `reseñar` | El acto de reseñar: elegir una materia y marcar frases. Gateada por tener cuenta, nada más (marcar el plan es opcional: O4-7, O6-3, y Diego no va a marcar ninguno). |
| `aportes` | Lo que diste. |
| `perfil` | Tu cuenta y por dónde vas. |
| `verificar` | Constancia. Opcional y tardío: es señal, no permiso. |

### Diseñadas, sin construir (6)

El mapa las dibuja en flujos pero no tienen pantalla propia todavía:

| Ruta | Por qué importa |
|---|---|
| `responder` | La respuesta del docente/institución. La dibujan los flujos 06, 08 y 10, y `metodo` la promete; hoy las respuestas de ejemplo están cargadas a mano. |
| `buscar` | Resultados de búsqueda. El topbar tiene buscador y todavía no lleva a ninguna pantalla; el flujo 11 la dibuja. |
| `editar` | Editar o borrar un aporte. Sin esto, contar algo incómodo es irreversible. |
| `abandono` | Marcar en qué año dejaste, sobre la pantalla del plan. Sin esto no sabemos dónde se cae la mayoría. |
| `baja` | Borrar la cuenta y lo aportado. Prometemos que es tuyo; poder sacarlo es parte de eso. |
| `avisos` | Notificaciones. Sin ellas, el que pidió una carrera no se entera de que la cargamos. Es la ruta que más stories sostiene (O2-4, O4-5, O7-5, BO1-3 y T2-2), y T2-2 es P1 de la promesa central: "quien aportó se entera antes de que se publique la réplica" no se puede cumplir sin un canal de aviso. **Decisión 2026-08-16**: deja de ser diferida y es infraestructura del primer bloque, aunque arranque solo por mail (SMTP ya está en el stack; el BC de ADR-0040 se revisa a favor). El panel en la app puede esperar. |

### Acciones inline (3)

No son rutas: pasan adentro de la ficha, sin cambiar de pantalla.

- `reportar`: denunciar algo publicado. Modal sobre la ficha. **Sin cuenta**: el difamado no tiene por qué registrarse en el sitio que lo difama.
- `corregir`: un dato duro está mal. La fila se vuelve editable ahí mismo. Pide cuenta.
- `votar`: "esto me sirvió". Ordena qué se lee primero. Pide cuenta.

### Backoffice (6) · el equipo

| Ruta | Qué es |
|---|---|
| `bo/pedidos` | La cola de carga, ordenada por cuántos lo pidieron, no por orden de llegada. |
| `bo/catalogo` | Cargar un plan. Abre por huecos: no se publica hasta terminar. |
| `bo/correcciones` | Datos duros que alguien corrigió. Se contrastan contra la fuente antes de aplicar. |
| `bo/reportes` | Moderación. Se baja lo que expone a una persona; la queja dura no es causal. |
| `bo/verificaciones` | Constancias. El único lugar con nombres reales, y sin camino a los aportes. |
| `bo/equipo` | Accesos. Cada rol ve solo sus colas: el anonimato es mecanismo, no declaración. |

## Los flujos

### Del producto (15)

| # | Flujo | Recorrido |
|---|---|---|
| 01 | Valentina tiene que elegir en dos meses | `inicio`/`buscar` → `explorar` → `carrera` → `materia`/`catedra` → `metodo` (opcional) → `donde` |
| 02 | Ana busca la suya y no está | `explorar` → vacío explicado → `pedir` → `cola` → `avisos` |
| 03 | Matías vuelve, y esta vez completa | `catedra` → lee → (tres semanas después) → `carrera` → `ingresar`/`registro` → `empezar` |
| 04 | Lucía no quiere repetir el error | `carrera` (combinaciones) → cuántos dejaron → `micarrera` → filtrado a lo que puede cursar → papel → `empezar` |
| 05 | Lucía reseña, y le lleva cinco minutos | `avisos` → `reseñar` (elige materia) → frases → cátedra (opcional) → clases sin dar (opcional) → cuándo cursó |
| 06 | Claudia contesta, con nombre porque es público | la nombran → `responder` → la respuesta queda al lado → actúa o no → se ve en la serie |
| 07 | Rocío se lleva el dato | `explorar`/`carrera` → `metodo` → qué no cubrimos → descarga el crudo → lo discute afuera → corrige un dato al volver |
| 08 | Los avisos, lo que cierra el circuito | `avisos` (cerró el período, o cargamos lo pedido) → `reseñar`/`empezar`/`responder` → `perfil` (se apagan) |
| 09 | Deshacer, la garantía que hace que se animen | `aportes` → `editar` (edita o borra) → `baja` (se va) → decide qué pasa con lo aportado |
| 10 | Los evaluados, responder y abandonar | te nombran en `catedra` → `responder` · del otro lado: `abandono` (marca el año) → `reseñar` (cuenta por qué, opcional) |
| 11 | Buscar, cuando te recomiendan una persona | busca un nombre → `buscar` → `catedra` → si no está, `buscar` explica por qué → `pedir` (opcional) |
| 12 | El texto que te delata sin nombrar a nadie | escribe en `reseñar` → se marca lo que identifica por contexto → decide el autor → la réplica no puede citar esa parte |
| 13 | La ficha vacía y el primero que aporta | ficha vacía en `carrera` → dice por qué está vacía y que la primera voz ya se publica → reseña en `reseñar` → lo ve reflejado |
| 14 | Cuando el dato no me alcanza | la materia no está / recursó con otra cátedra → se acepta igual → queda pendiente de vincular → ve qué cambió en `aportes` |
| 15 | Cuando el número no se sostiene solo | testimonios viejos declarados en la ficha → cátedra y carrera se contradicen → explica que uno no promedia al otro → aporta lo contrario |

### Del backoffice (7)

| # | Flujo | Qué resuelve |
|---|---|---|
| BO-1 | Cargar lo que piden, por prioridad | la cola ordenada por pedidos; no se publica hasta terminar; se avisa a los que esperaban |
| BO-2 | Contrastar una corrección contra la fuente | valor viejo y nuevo a la vista; aplicar queda registrado; la ficha cambia para todos sin votación |
| BO-3 | Moderar sin bajar la queja incómoda | ¿expone a alguien? sí: se baja / no: queda; quien reportó recibe el criterio, no un acuse |
| BO-4 | Ver un nombre una sola vez | la constancia se compara con lo declarado; el documento se destruye al resolver; nunca hay camino de la verificación a los aportes |
| BO-5 | Cuando la facultad reforma el plan | los dos planes coexisten con su año; la valoración queda pegada al plan en que se cursó |
| BO-6 | Cuando alguien intenta inflar el corpus | picos por cátedra y período; reportes agrupados por origen; congelar conteos sin borrar nada; la ficha declara "período bajo revisión" |
| BO-7 | Cuando la cola nos gana, y quién nos mira | se dice cuánto se tarda sin fingir que se resuelve todo; registro interno de qué se bajó y por qué; quien se va pierde acceso |

## Reglas del corpus

**Desbloqueos por volumen**: el mapa encendía la ficha por escalones ("con uno aparece la primera frase; con cinco, los dos números; con quince, la atribución"). **Cerrado el 2026-08-16** ([ADR-0066](../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)): no hay escalera ni piso. Todo se publica desde la primera voz, como "X de N voces" con su encogimiento; lo único que espera es la cabecera derivada de carrera e institución, por cobertura (más de la mitad de las materias del plan con voces), y mientras tanto la ficha lo dice.

**Las frases**: `metodo` promete el corpus completo publicado ("las 32 frases"). El mapa no las lista en un solo lugar; muestra ejemplos por familia en las pantallas de `reseñar`, `catedra` e `institucion`:

- De materia: "Es dura de verdad", "Se aprueba yendo a clase", "El final es otro nivel", "El contenido está al día", "Contenido de hace diez años", "Es muchísimo contenido".
- De cátedra: "Explican bien", "Están para las consultas", "Te la estudiás solo", "Hay clases que no se dan", "El cronograma se cumple".
- De institución: "Cada trámite es una pelea", "El título tardó meses".

La lista canónica completa, con el sujeto y el eje de cada frase (la atribución sale del eje: [ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)), es un entregable del diseño del sistema de frases (ver auditoría abajo): hoy no existe ni en el mapa ni en el repo, y se publica entera en `metodo`.

## Estado contra el código (cruce 2026-08-16)

Lo que el repo ya tiene, mapeado contra las rutas. "Existe" significa que el chasis existe; donde el contenido cambia (fichas con escrutinio en vez de reseñas texto-libre), el chasis se conserva y el contenido se rehace.

| Carril | Existe (chasis) | Adaptar | Nuevo de cero |
|---|---|---|---|
| Públicas | `inicio`, `donde`, `institucion`, `carrera`, `materia`, `catedra` (fichas públicas del catálogo actual) | `explorar` (hoy el browse rico es member-only), `metodo` (hoy sección de la landing), `anonimato` (about existe, habla de otra cosa), `pedir` (existe gateado al onboarding) | `cola`, `error` |
| Umbral | `ingresar`, `registro`, `recuperar` (auth completo) | | |
| Con cuenta | `empezar`, `micarrera`, `aportes`, `perfil` (chasis del onboarding, mi carrera y mis reseñas) | `reseñar` (existe el editor texto-libre; el acto de frases es otro modelo), `verificar` (existe solo para docentes) | |
| Backoffice | `bo/catalogo` (ABM completo), `bo/reportes` (cola de moderación) | `bo/pedidos` (el endpoint de cola existe; la pantalla no) | `bo/correcciones`, `bo/verificaciones`, `bo/equipo` |

Lo que no existe en ningún módulo del backend y es el corazón del build: el sistema de frases (modelo, conteos, sujeto y eje), las proporciones de voces con encogimiento, la cola pública de pedidos, la verificación de alumno por constancia, y las seis rutas diseñadas sin construir (`responder`, `buscar`, `editar`, `abandono`, `baja`, `avisos`).

## Auditoría del mapa (2026-08-16)

Hallazgos de revisar el mapa contra sí mismo, contra la tesis y contra el repo. Son insumo para iterar el canvas, no para resolver acá.

1. **Los conteos de faltantes no cierran entre sí.** La portada dice "cuatro rutas no se recorren"; la sección "lo que falta" lista seis diseñadas sin construir; el reagrupamiento dice "diez ya tienen flujo y todavía no tienen ruta" y "diecisiete no tienen ni flujo ni ruta". Cuatro cifras distintas para el mismo concepto: unificar en una sola verdad antes de planificar contra el mapa.
2. **"Las 32 frases" no existen como lista.** `metodo` las promete publicadas y el mapa muestra ~13 ejemplos dispersos. El corpus curado es EL contenido del producto: su lista canónica (frase, eje, atribución, familia) es un entregable que hoy no tiene dueño ni lugar.
3. **La atribución del mapa es ternaria; la de la tesis, binaria.** THESIS.md decía "propio de la materia o de la institución"; el mapa opera con tres familias (materia, cátedra, institución). **Cerrado el 2026-08-16** ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)): no competían. La ternaria es el **sujeto** (a qué ficha va la frase, y quién); la binaria es el **eje** (de qué lado cae). Las familias del mapa quedan como sujetos; la atribución la decide el eje.
4. **Los 17 escenarios sin flujo ni ruta son los de riesgo.** El propio mapa lo dice: "es el estado más urgente, porque no hay ni un recorrido contra el que discutirlos". Incluyen los tres P1 que tocan la promesa central (el texto que te delata, la réplica que te señala, la ficha vacía sin razones para el primero). Dibujarlos antes de construir nada que los pise.
5. **`avisos` es el cuello estructural.** Sostiene cinco stories en cinco grupos y no está construida ni diseñada como pantalla. En el repo, Notifications (ADR-0040, US-077) quedó "diferido a revisión" en ADR-0063: el mapa lo revalida como bloqueante temprano, no como diferible.
6. **El grupo "que no me molesten" es el contrapeso del mapa** (cuatro stories que piden menos producto). Usarlo como gate de revisión de cada pantalla nueva, que es exactamente el rol que el reagrupamiento le da: sin él, "el mapa solo suma funciones".
7. **Consistencias verificadas** (no hallazgos, confirmaciones): `verificar` como "señal, no permiso" coincide con la decisión de verificación registrada en THESIS.md; debajo del gate de cobertura la ficha dice "todavía no derivamos", nunca un cero (ADR-0054); `reportar` sin cuenta es coherente con la posición de moderación; el flujo 05 pregunta el período de cursada, que es lo que BO-5 necesita para pegar la valoración al plan.
