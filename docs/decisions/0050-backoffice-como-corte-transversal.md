# ADR-0050: El backoffice es un corte transversal, no un módulo

- **Estado**: aceptado
- **Fecha**: 2026-07-20

## Contexto

El canvas del backoffice (2026-05-12) presentó el área de administración como una unidad visual: un shell propio, su sidenav y cuatro secciones (catálogo, docentes, moderación, ops). Esa unidad **visual** se filtró a los docs como si fuera una unidad **arquitectónica**, y quedaron dos afirmaciones que el código nunca respaldó:

1. Que existe un "módulo admin" (`STATUS.md` lo llama así en seis lugares, uno de ellos "bloqueante de todo el resto del módulo admin").
2. Que existe un namespace de API `/api/admin/...`, declarado en los criterios de aceptación de unas veinte user stories.

Ninguna de las dos es cierta:

- Los bounded contexts son cinco: `identity`, `academic`, `enrollments`, `reviews`, `moderation` (`backend/modules/`). No hay ni hubo un módulo `admin`.
- `/api/admin` no aparece en una sola línea de código (`grep -rn "/api/admin" backend/ frontend/src/` devuelve cero). Las features de backoffice ya implementadas exponen la API de su módulo: `Planb.Academic.Application/Features/AdminCareers/CreateCareerEndpoint.cs` mapea `/api/academic/universities/{universityId}/careers`, no `/api/admin/...`.

Lo grave es que **quince de esas US ya están Done**: se implementaron contra la ruta real y el AC quedó describiendo una ruta ficticia. El doc no quedó viejo, quedó falso, y sobrevivió así varios sprints porque nadie lo contrastó contra el código.

La causa de fondo es un hueco en el lenguaje: [`ubiquitous-language.md`](../domain/ubiquitous-language.md) define **admin** como rol (`role = 'admin'`), que es correcto, pero nunca definió **backoffice**. Sin esa definición, "admin" se deslizó de rol a módulo sin que nada lo frenara. Los epics sí lo tenían bien ([EPIC-08](../domain/epics/EPIC-08.md) dice "BC: Academic primario", [EPIC-09](../domain/epics/EPIC-09.md) dice "Identity primario"), pero un epic no alcanza para frenar la deriva si el glosario calla.

## Decisión

**El backoffice es la unión de las features no-públicas de cada agregado, no un bounded context ni un namespace de API.**

Cada agregado tiene features que consume cualquiera (el catálogo público) y features que solo consume el staff (el CRUD que lo mantiene). Las segundas son "el backoffice". Es un corte transversal sobre los módulos existentes, no un lugar aparte.

De eso se desprenden cuatro reglas operativas:

1. **La ruta la manda el módulo dueño del agregado, nunca el rol de quien llama**: `/api/academic/...` para University, Career, CareerPlan, Subject, Prerequisite, Teacher, Commission, AcademicTerm; `/api/moderation/...` para ReviewReport; `/api/identity/...` para las cuentas. **Nunca `/api/admin/...`.**
2. **El prefijo `Admin` en la carpeta de la feature marca que es de backoffice**, y vive dentro de su módulo: `Planb.Academic.Application/Features/AdminCareers/`. Es una marca de audiencia, no de módulo.
3. **La agrupación es de UI**: el frontend junta esas features bajo `src/app/(staff)/admin/` con un shell compartido. Ahí sí "admin" nombra algo real, porque es una sección de navegación.
4. **El gating es por rol en cada endpoint** (`RequireRole`), no por estar en un módulo aparte. La autorización es una propiedad de la feature, no de su ubicación.

## Alternativas consideradas

### A. Un módulo `admin` como bounded context propio

Descartada, y es la que hay que argumentar porque es la que los docs asumían.

**Un bounded context se define por el lenguaje del dominio, no por quién lo usa.** `Career` significa lo mismo cuando la lee un visitante que cuando la edita un admin: mismo aggregate, mismas invariantes, mismo ubiquitous language. Partir por actor en vez de por dominio es el error clásico de confundir un rol con un contexto.

Además rompe cosas concretas del proyecto: un módulo `admin` necesitaría mutar aggregates de `academic`, `identity` y `moderation`, o sea acceso a los tres `DbContext`, lo que contradice [ADR-0017](0017-persistence-ignorance.md) (un módulo por schema, sin navegación cross-module) y obligaría a duplicar las invariantes del dominio fuera del aggregate que las posee.

### B. Mantener los módulos, pero exponer un namespace `/api/admin/...` como fachada

Descartada. Sería lo único que rescata la letra de los docs viejos, pero implica una capa de ruteo que reenvía a los módulos sin agregar comportamiento: superficie nueva para mantener, dos rutas por feature, y la pregunta permanente de cuál es la canónica. El gating por rol ya se resuelve por endpoint, que es donde vive la autorización real.

### C. Corte transversal (elegida)

Es lo que el código viene haciendo desde US-060 sin que nadie lo hubiera escrito. Este ADR lo formaliza en vez de migrar el código hacia un modelo que nunca se pidió.

## Consecuencias

**Positivas:**

- Las reglas de negocio se quedan con su aggregate: el CRUD de backoffice de `Career` usa `Career.Update()`, las mismas invariantes que cualquier otro caller.
- Hay una regla mecánica para decidir la ruta de una feature admin nueva (la del módulo dueño), que es exactamente lo que faltaba cuando se escribieron los AC ficticios.
- No hay una capa de fachada que mantener ni dos rutas por feature.

**Negativas:**

- El backoffice no tiene un único lugar en el backend donde mirar: sus features están repartidas por módulo. Se compensa con la convención de carpeta (`Features/Admin*/`), que las hace grepeables.
- La coherencia visual del backoffice queda como responsabilidad del frontend (el shell compartido), sin nada en el backend que la garantice.

**Deuda que este ADR salda**: los AC de las US afectadas se corrigen a la ruta real (las Done) o a la ruta del módulo dueño (las de backlog), y `ubiquitous-language.md` suma la entrada **backoffice** para cerrar el hueco que originó la deriva.

## Refs

- Código: `backend/modules/academic/src/Planb.Academic.Application/Features/AdminCareers/`, `AdminAcademicTerms/`, `frontend/src/app/(staff)/admin/`.
- Glosario: [`ubiquitous-language.md`](../domain/ubiquitous-language.md), entradas **admin** (rol) y **backoffice**.
- Epics que ya lo modelaban bien: [EPIC-08](../domain/epics/EPIC-08.md), [EPIC-09](../domain/epics/EPIC-09.md).
- Boundaries de módulo: [ADR-0017](0017-persistence-ignorance.md).
