# Cortar los accesos

> Épica del grupo **BO3 · Cortar los accesos (que el anonimato sea mecanismo)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README, [flujo](flow.md) y su pantalla propia con ficha y boceto mid-fi: Equipo); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Que el anonimato sea un mecanismo y no una promesa depende de que ningún rol del equipo pueda ver más de lo que su cola necesita ([THESIS.md](../../../THESIS.md), "Posición"). Esta épica es la de Admin: dar de alta a alguien del equipo, asignarle un rol, y que ese rol lo corte del resto del sistema por construcción, no por buena voluntad. La regla dura es una sola: verificación y moderación no pueden convivir en la misma persona. Alguien que vio un nombre real en una constancia y después abre la cola de reportes de esa misma carrera no necesita que la pantalla le abra un camino: el cruce ya está en su cabeza.

De esa regla sale el número: el equipo mínimo es de cuatro personas (D09), las cuatro del equipo en las [personas](../../personas.md): quien carga el catálogo, quien modera, quien verifica (nunca la misma que modera) y quien administra los accesos sin operar ninguna cola.

Y lo que le pedimos a las instituciones se lo aplicamos al equipo: el registro de quién hizo qué se arma para que ningún rol, actuando solo, pueda reconstruir un cruce, y se revisa. Dos capas (US-218): la primera, construible, es el registro del equipo publicado en agregado (cuántas notas editoriales se publicaron y se retiraron, cuántas frases destiladas se aprobaron y se descartaron, y cuántos reclamos de instituciones se resolvieron, por categoría, sin contenido); la segunda, una persona externa con lectura del registro ya disociado, es una decisión de gobierno y no un requisito que el equipo resuelva solo. Cuando alguien deja el equipo, el acceso se corta en el momento y lo que hizo mientras lo tuvo no desaparece con ella (US-219).

## Para quién

**Admin** (accesos: roles cortados por lo que no ven, y registro de quién hizo qué; la baja del que se va). **El lector externo** (la segunda capa de US-218: no es un rol que el producto asigna, es una decisión de gobierno) y **quien lee** el registro público en agregado. Sofía, Nahuel y Camila son los roles que asigna: catálogo ([Sostener el catálogo](../sustain-the-catalog/README.md)), moderación y verificación ([Moderar sin romper el producto](../moderate-without-breaking-the-product/README.md)).

## Stories

Las 5 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-215](stories/US-215-each-role-sees-only-its-queues/README.md) | Cada rol ve solo sus colas |
| [US-216](stories/US-216-log-author-and-date-per-action/README.md) | Registrar quién hizo cada cosa |
| [US-217](stories/US-217-make-verification-and-moderation-exclusive/README.md) | Verificación y moderación son roles excluyentes |
| [US-218](stories/US-218-make-the-teams-actions-reviewable/README.md) | Revisar lo que hizo el equipo |
| [US-219](stories/US-219-revoke-access-and-keep-the-log/README.md) | Dar de baja a alguien del equipo |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (BO6 · Y quién nos mira a nosotros): son temas, no actividades, y cada uno de sus requisitos vive en la única épica que lo implementa. El índice del [catálogo](../../README.md) conserva el tema como lista.


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

D09 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): verificación y moderación son roles excluyentes, el Admin no se auto-asigna roles operativos, equipo mínimo de cuatro), [THESIS.md](../../../THESIS.md) ("Posición": el anonimato es mecanismo, no declaración), [ADR-0050](../../../decisions/0050-backoffice-is-a-cross-cutting-slice-not-a-module.md) (el backoffice es un corte transversal sobre los módulos existentes; el gating es por rol en cada endpoint, no por estar en un módulo aparte: es la base técnica de que cada rol vea solo sus colas), [ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre no se publica y lo lee la curaduría: por eso lo que se audita del equipo son sus notas, sus frases destiladas y los reclamos que resolvió, y por eso la cola de curaduría y la de verificación son distintas).

## Pantallas

La única que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Equipo**](screens/SC-033-team/README.md) (backoffice, rol Admin): altas, roles con la exclusión imposible en la propia pantalla, el registro con autor y fecha, la baja que corta el acceso en el momento; [boceto mid-fi](screens/SC-033-team/sketch.html).

Las colas que cada rol ve, y que no puede cruzar, viven en su épica: [Pedidos, Catálogo, Correcciones y Frases](../sustain-the-catalog/README.md) (catálogo y curaduría); [Reportes y Verificaciones](../moderate-without-breaking-the-product/README.md) (moderación y verificación).

## Lo que esta épica todavía no resuelve

- **Si curar las frases es un rol aparte o parte de catálogo**: el catálogo de requisitos nombra "quien cura las frases" como un rol distinto del de Sofía, y BO3 no lo lista entre los que se asignan.
- **Cómo se cubre la cola de verificación si Camila está de vacaciones** sin violar US-217: hace falta un segundo verificador, nunca un moderador supliendo.
- **Si el Admin puede leer las colas sin operar**: US-215 dice que cada rol ve solo sus colas, y no dice qué ve el Admin.
- **Qué pasa cuando alguien deja el equipo y vuelve más tarde**: si el alta reactiva la cuenta vieja con su historial de acciones o crea una entidad nueva en el registro.
- **Quién es el lector externo y cómo se elige**: decisión de gobierno, fuera de lo que el producto resuelve (US-218).
- **Cada cuánto se revisa el registro**: "cada tanto" no es una cadencia (US-218).
- **Si el agregado público se publica en Método o en Anonimato**: las dos declaran política pública y ninguna fuente dice cuál.
- **Si "equipo mínimo de cuatro" lo fuerza el sistema** (bloquear la baja del único moderador, por ejemplo) o es una expectativa operativa que nada en el producto impone (D09).
