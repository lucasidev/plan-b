# ADR-0049: CareerPlan versiona con year + status, no con rango de vigencia

- **Estado**: aceptado
- **Fecha**: 2026-07-19

## Contexto

[ADR-0002](0002-versionado-de-planes-de-estudio.md) decidió que `CareerPlan` versione con `version_label` ("Plan 2024"), `effective_from` y `effective_to` (rango de fechas), más un domain service que retira automáticamente el plan vigente anterior al crear uno nuevo (invariante cross-aggregate "solo un plan vigente por Career").

Ese modelo nunca tuvo un caller real. Lo primero que se implementó fue el crowdsourcing (US-088: el alumno importa su historial en el onboarding y el sistema crea `Career`/`CareerPlan` a partir de lo que carga), que no necesitaba fechas de vigencia: alcanzaba con saber el año del plan. El backoffice de carreras y planes (US-061, admin) se construyó sobre ese mismo modelo simplificado en vez de migrar al de ADR-0002, formalizando de facto el cambio (ver la nota de modelo del 2026-07-18 en [US-061](../domain/user-stories/US-061.md)).

El código real (`backend/modules/academic/src/Planb.Academic.Domain/CareerPlans/CareerPlan.cs`) expone:

- `Year` (int): año del plan, no un rango de fechas.
- `Status` (enum `CareerPlanStatus`: `Active` / `Deprecated`): reemplaza `effective_from`/`effective_to`.
- `Label` (string?, opcional): identificador editorial (ej. "plan-2023", el alumno ve "Plan 2023"); no participa de la unicidad.
- `IsOfficial`, `CreatedAt`, `UpdatedAt`.

No existen `version_label`, `effective_from`, `effective_to`, `duration_terms`, `default_term_kind` ni `notes`. La unicidad es `UNIQUE(career_id, year)`, no `UNIQUE(career_id, version_label)`. Las transiciones de estado (`Deprecate`/`Reactivate`) son explícitas: las dispara el admin, no un domain service que las infiere al crear un plan nuevo.

## Decisión

Formalizar el modelo ya implementado como la decisión vigente:

- `CareerPlan` versiona por `(career_id, year)`, no por `version_label` más rango de fechas.
- El estado del plan es `Status` (`Active`/`Deprecated`), seteado explícitamente por el admin (acciones `Deprecate`, `Reactivate`), no inferido de un rango de fechas ni de un domain service de overlap.
- "**Plan vigente**" pasa a significar `Status == Active`. Ya no existe la noción de `effective_to IS NULL`.
- `Label` es un campo editorial opcional, sin peso en la unicidad ni en el lifecycle.
- El caso que motivó ADR-0002 (planes paralelos: los alumnos viejos siguen en el plan que cursaron, los nuevos entran al plan actualizado) se sigue cubriendo: un plan `Deprecated` conserva sus `StudentProfile` asociados y convive con el plan `Active` nuevo. No hace falta un rango de fechas para eso, alcanza con el estado.

## Alternativas consideradas

- **A. Migrar al modelo de rangos de ADR-0002** (`version_label` + `effective_from`/`effective_to` + domain service de overlap). Descartada: agrega invariantes de fechas (`effective_to >= effective_from`, exclusión de solapamiento) y un domain service cross-aggregate que retira automáticamente el plan anterior, sin que ningún caller real lo haya necesitado. La complejidad no se paga sola.
- **B. `year` + `status` (elegida)**. Cubre el mismo caso de negocio (planes paralelos vigente/histórico) con menos superficie: un enum de dos valores y transiciones explícitas en vez de un rango de fechas y un efecto automático al crear.

## Consecuencias

**Positivas:**

- Menos invariantes: no hay que validar rangos de fechas ni excluir solapamientos.
- El admin decide explícitamente cuándo un plan pasa a `Deprecated` (acción `Deprecate`); no es un side-effect oculto de crear un plan nuevo.
- El año ya es una clave temporal natural y suficiente para el caso de uso real (un plan por año calendario).
- El mismo modelo sirve tanto a planes oficiales (backoffice) como no oficiales (crowdsourcing, `IsOfficial = false`), que es justamente el caso que lo estabilizó.

**Negativas:**

- Se pierde precisión temporal: no hay una fecha exacta de corte entre "vigente" e "histórico", solo el estado. Si en el futuro aparece un caller real que necesite saber "qué plan era el vigente en tal fecha exacta", se agrega esa fecha puntualmente (no se rearma todo el rango).
- Dos planes `Active` simultáneos para la misma Career no están prohibidos por una invariante del aggregate, a diferencia del domain service de overlap que se descarta acá. Si aparece esa necesidad, se agrega como invariante puntual.

**Este ADR supersede a [ADR-0002](0002-versionado-de-planes-de-estudio.md)**, que queda como registro histórico de la decisión original (no se implementó tal cual). `StudentProfile.career_id` sigue apuntando al `CareerPlan`, eso no cambió.

## Refs

- Código: `backend/modules/academic/src/Planb.Academic.Domain/CareerPlans/CareerPlan.cs`, `CareerPlanStatus.cs`, `CareerPlanConfiguration.cs`.
- User Stories: [US-088](../domain/user-stories/US-088.md) (origen de facto, crowdsourcing), [US-061](../domain/user-stories/US-061.md) (formalización, backoffice admin).
- ADR superado: [ADR-0002](0002-versionado-de-planes-de-estudio.md).
