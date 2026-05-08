# Value Objects (planb)

Inventario cross-cutting de Value Objects del modelo. Cada VO vive descrito en el archivo del aggregate que lo usa primario (ver [aggregates/](aggregates/)). Los VOs shared del kernel viven en [shared-kernel.md](shared-kernel.md).

Un VO no tiene identidad: su igualdad se define por sus atributos. En .NET 10 / C# 14 los modelamos como `readonly record struct` cuando son simples (un solo valor wrapped) o `readonly record class` cuando contienen colecciones o son más pesados.

**Regla de oro**: si la pregunta "dos instancias con los mismos atributos son la misma cosa?" es **sí**, es VO. Si es "no, cada una tiene historia propia", es Entity.

## Por aggregate

| Aggregate | VOs propios |
|---|---|
| [User](aggregates/User.md) | `EmailAddress`, `UserRole`, `TokenPurpose`, `PasswordHash` |
| [StudentProfile](aggregates/StudentProfile.md) | ninguno propio (usa enums simples como columna) |
| [TeacherProfile](aggregates/TeacherProfile.md) | ninguno propio hoy |
| [University](aggregates/University.md) | `Slug` |
| [Career](aggregates/Career.md) | ninguno propio |
| [CareerPlan](aggregates/CareerPlan.md) | ninguno propio |
| [Subject](aggregates/Subject.md) | ninguno propio |
| [Teacher](aggregates/Teacher.md) | ninguno propio |
| [AcademicTerm](aggregates/AcademicTerm.md) | `TermKind` |
| [Commission](aggregates/Commission.md) | ninguno propio |
| [HistorialImport](aggregates/HistorialImport.md) | ninguno propio |
| [EnrollmentRecord](aggregates/EnrollmentRecord.md) | `EnrollmentStatus`, `ApprovalMethod`, `Grade` (candidato post-MVP) |
| [Review](aggregates/Review.md) | `Difficulty`, `ReviewStatus`, `FilterVerdict` |
| [ReviewReport](aggregates/ReviewReport.md) | `ReportReason`, `ReportStatus` |
| [SimulationDraft](aggregates/SimulationDraft.md) | `SimulationVisibility` |

## Strongly-typed IDs

Todos los IDs son VO. Ningún aggregate ni entity usa `Guid` directamente. Ver [shared-kernel.md](shared-kernel.md#strongly-typed-ids-patrón) para el patrón completo y la tabla con todos los IDs del modelo.

## Anti-patterns que evitamos

- **Primitive obsession**: NO usar `Guid` sin wrapper, NO usar `string` para emails, NO usar `int` para difficulty/grade donde el rango importa.
- **Setters públicos en VOs**: ningún VO permite cambiar sus atributos después de construido. Toda mutación es "crear un nuevo VO con los nuevos valores".
- **Fallar silenciosamente**: factories devuelven `Result<T>` para representar fallas de validación. Los ctors lanzan `ArgumentException` solo cuando es responsabilidad del caller (typed IDs internos).
- **Over-engineering**: si un valor es realmente un primitive (ej. `IsActive` boolean), no lo wrappeamos. La regla es: hay validación, normalización, o invariante? Si no, primitive sirve.

## Cómo agregar un VO nuevo

1. Crear `readonly record struct` (o `record class` si tiene colecciones).
2. Constructor privado + factory `Create(...)` que devuelve `Result<T>` si tiene validación.
3. Si lo persiste EF Core: agregar `HasConversion` en la configuration del aggregate que lo contiene.
4. Tests unitarios cubriendo: validación, equality, normalization (si aplica).
5. Si lo usan ≥ 2 BCs, considerar promoverlo a `Planb.SharedKernel` y documentarlo en [shared-kernel.md](shared-kernel.md).
6. Documentar el VO en el archivo del aggregate primario que lo usa.

## Refs

- Aggregates: [aggregates/](aggregates/)
- Shared kernel: [shared-kernel.md](shared-kernel.md)
