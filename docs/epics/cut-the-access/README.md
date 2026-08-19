# Cortar los accesos

> Épica del grupo **BO3 · Cortar los accesos (que el anonimato sea mecanismo)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README, [flujo](flow.md) y su pantalla propia con ficha y boceto mid-fi: Equipo); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Que el anonimato sea un mecanismo y no una promesa depende de que ningún rol del equipo pueda ver más de lo que su cola necesita ([THESIS.md](../../THESIS.md), "Posición"). Esta épica es la de Admin: dar de alta a alguien del equipo, asignarle un rol, y que ese rol lo corte del resto del sistema por construcción, no por buena voluntad. La regla dura es una sola: verificación y moderación no pueden convivir en la misma persona. Alguien que vio un nombre real en una constancia y después abre la cola de reportes de esa misma carrera no necesita que la pantalla le abra un camino: el cruce ya está en su cabeza.

De esa regla sale el número: el equipo mínimo es de cuatro personas (D09), las cuatro del equipo en las [personas](../../domain/user-personas.md): quien carga el catálogo, quien modera, quien verifica (nunca la misma que modera) y quien administra los accesos sin operar ninguna cola.

Y lo que le pedimos a las instituciones se lo aplicamos al equipo: el registro de quién hizo qué se arma para que ningún rol, actuando solo, pueda reconstruir un cruce, y se revisa. Dos capas (BO6-1): la primera, construible, es el registro de moderación publicado en agregado (cuántos textos se bajaron, cuántos quedaron retenidos, en qué categoría, sin contenido); la segunda, una persona externa con lectura del registro ya disociado, es una decisión de gobierno y no una story que el equipo resuelva solo. Cuando alguien deja el equipo, el acceso se corta en el momento y lo que hizo mientras lo tuvo no desaparece con ella (BO6-2).

## Para quién

**Admin** (accesos: roles cortados por lo que no ven, y registro de quién hizo qué; la baja del que se va). **El lector externo** (la segunda capa de BO6-1: no es un rol que el producto asigna, es una decisión de gobierno) y **quien lee** el registro público en agregado. Sofía, Nahuel y Camila son los roles que asigna: catálogo ([Sostener el catálogo](../sustain-the-catalog/README.md)), moderación y verificación ([Moderar sin romper el producto](../moderate-without-breaking-the-product/README.md)).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| BO3-1 | Como quien administra, quiero que cada rol vea solo sus colas, porque catálogo no necesita ver una constancia con nombre, y si puede algún día la mira. | El rol de catálogo no llega a reportes ni verificaciones, ni por acceso directo. |  |
| BO3-2 | Como quien administra, quiero saber quién hizo cada cosa, porque el equipo toca datos que los usuarios nos confiaron. | Cada acción sobre una cola queda con autor y fecha. |  |
| BO3-3 | Como quien administra, quiero que verificación y moderación no puedan vivir en la misma persona, porque quien ve un nombre real a las 14:32 y la cola de reportes filtrada por esa carrera a las 14:40 no necesita ningún camino en la pantalla para cruzarlos. | 1. Asignar el rol de verificación a quien tiene el de moderación (o al revés) es imposible, no auditado.<br>2. El registro guarda referencias que un solo rol no puede unir, y el Admin no se puede auto-asignar roles operativos. | equipo mínimo de cuatro (D09, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)) |
| BO6-1 | Como quien administra, quiero que alguien revise lo que hizo el equipo, porque todo el producto se sostiene en que lo publicado necesita a alguien de afuera mirando, y adentro no lo aplicamos. | 1. El registro de acciones se puede leer y se revisa cada tanto; quedan contables por categoría las bajas de testimonios y lo que el chequeo previo retuvo y no se publicó.<br>2. Primera capa, construible: el registro de moderación es público en agregado (cuántos se bajaron, cuántos quedaron retenidos, por qué categoría, sin contenido).<br>3. Segunda capa, decisión de gobierno y no story: una persona externa con acceso de lectura al registro, ya disociado como manda BO3-3. | P1; tema del mapa: BO6 · Y quién nos mira a nosotros |
| BO6-2 | Como quien administra, quiero dar de baja a alguien del equipo, porque el acceso a nombres reales no puede sobrevivir a la persona que se fue. | Quitar a alguien le corta el acceso en el momento y su registro de acciones queda. | P2; tema del mapa: BO6 · Y quién nos mira a nosotros |

Las filas con "tema del mapa" vienen de los grupos transversales del mapa (BO6 · Y quién nos mira a nosotros): son temas, no actividades, y cada una de sus stories vive en la única épica que la implementa. El índice del [catálogo](../../domain/user-stories.md) conserva el tema como lista.

## Decisiones que aplica

D09 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): verificación y moderación son roles excluyentes, el Admin no se auto-asigna roles operativos, equipo mínimo de cuatro), [THESIS.md](../../THESIS.md) ("Posición": el anonimato es mecanismo, no declaración), [ADR-0050](../../decisions/0050-backoffice-como-corte-transversal.md) (el backoffice es un corte transversal sobre los módulos existentes; el gating es por rol en cada endpoint, no por estar en un módulo aparte: es la base técnica de que cada rol vea solo sus colas), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (separa qué se modera, lo retenido y lo reportado, de qué habilita una réplica, la identidad verificada: por qué Reportes y Verificaciones son colas distintas).

## Pantallas

La única que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Equipo**](screens/team/README.md) (backoffice, rol Admin): altas, roles con la exclusión imposible en la propia pantalla, el registro con autor y fecha, la baja que corta el acceso en el momento; [boceto mid-fi](screens/team/sketch.html).

Las colas que cada rol ve, y que no puede cruzar, viven en su épica: [Pedidos, Catálogo, Correcciones y Frases](../sustain-the-catalog/README.md) (catálogo y curaduría); [Reportes y Verificaciones](../moderate-without-breaking-the-product/README.md) (moderación y verificación).

## Lo que esta épica todavía no resuelve

- **Si curar las frases es un rol aparte o parte de catálogo**: el catálogo de stories nombra "quien cura las frases" como un rol distinto del de Sofía, y BO3 no lo lista entre los que se asignan.
- **Cómo se cubre la cola de verificación si Camila está de vacaciones** sin violar BO3-3: hace falta un segundo verificador, nunca un moderador supliendo.
- **Si el Admin puede leer las colas sin operar**: BO3-1 dice que cada rol ve solo sus colas, y no dice qué ve el Admin.
- **Qué pasa cuando alguien deja el equipo y vuelve más tarde**: si el alta reactiva la cuenta vieja con su historial de acciones o crea una entidad nueva en el registro.
- **Quién es el lector externo y cómo se elige**: decisión de gobierno, fuera de lo que el producto resuelve (BO6-1).
- **Cada cuánto se revisa el registro**: "cada tanto" no es una cadencia (BO6-1).
- **Si el agregado público se publica en Método o en Anonimato**: las dos declaran política pública y ninguna fuente dice cuál.
- **Si "equipo mínimo de cuatro" lo fuerza el sistema** (bloquear la baja del único moderador, por ejemplo) o es una expectativa operativa que nada en el producto impone (D09).
