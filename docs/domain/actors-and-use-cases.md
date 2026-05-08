# Actors and Use Cases (planb)

Catálogo completo de UCs del MVP. Cada UC vive en su propio archivo dentro de [use-cases/](use-cases/) y tiene un ID estable que se referencia desde la API, desde diagramas de secuencia futuros y desde user stories.

La lista representa la **superficie funcional completa del MVP**. Cada UC mapea 1:1 a un application service (Clean Architecture) y a un endpoint de la API.

## Legend de actores

| Actor | Requisitos |
|---|---|
| **Visitante** | Sin sesión. Acceso de solo lectura a contenido público. |
| **Alumno** | `User.role='member'` + `StudentProfile` activo. |
| **Docente verificado** | `User.role='member'` + `TeacherProfile.verified_at NOT NULL`. |
| **Moderador** | `User.role='moderator'`. |
| **Admin** | `User.role='admin'`. |
| **University staff** | `User.role='university_staff'`, vinculado a una `University`. |

## Convenciones

- **Short form** para CRUDs y flujos triviales: actor + precondiciones + flujo + postcondiciones.
- **Full form** para flujos con ramas significativas: agrega flujos alternativos, motivación de producto y ADRs referenciados.
- **IDs son estables**. No renumerar. Al agregar UCs nuevos, usar el próximo número libre dentro del rango del actor.

## Ranges de IDs

| Actor | Range |
|---|---|
| Visitante | UC-001 a UC-009 |
| Alumno | UC-010 a UC-029 |
| Claim de identidad docente | UC-030 a UC-039 |
| Docente verificado | UC-040 a UC-049 |
| Moderador | UC-050 a UC-059 |
| Admin | UC-060 a UC-079 |
| University staff | UC-080 a UC-089 |

---

## Por actor

### Visitante (4 UCs)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-001](use-cases/UC-001.md) | Explorar catálogo de universidades y carreras | [US-001](user-stories/US-001.md) | [EPIC-01](epics/EPIC-01.md) |
| [UC-002](use-cases/UC-002.md) | Ver página de una materia con reseñas | [US-002](user-stories/US-002.md) | [EPIC-01](epics/EPIC-01.md) |
| [UC-003](use-cases/UC-003.md) | Ver página de un docente con reseñas | [US-003](user-stories/US-003.md) | [EPIC-01](epics/EPIC-01.md) |
| [UC-004](use-cases/UC-004.md) | Buscar materia o docente por texto libre | [US-004](user-stories/US-004.md) | [EPIC-01](epics/EPIC-01.md) |

### Alumno (18 UCs)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-010](use-cases/UC-010.md) | Registrarse | [US-010-b](user-stories/US-010-b.md), [US-010-f](user-stories/US-010-f.md) | [EPIC-02](epics/EPIC-02.md) |
| [UC-011](use-cases/UC-011.md) | Verificar email | [US-011-b](user-stories/US-011-b.md), [US-011-f](user-stories/US-011-f.md) | [EPIC-02](epics/EPIC-02.md) |
| [UC-012](use-cases/UC-012.md) | Crear StudentProfile eligiendo CareerPlan | [US-012-b](user-stories/US-012-b.md) | [EPIC-02](epics/EPIC-02.md) |
| [UC-013](use-cases/UC-013.md) | Cargar historial manualmente | [US-013](user-stories/US-013.md) | [EPIC-03](epics/EPIC-03.md) |
| [UC-014](use-cases/UC-014.md) | Importar historial desde PDF/texto | [US-014](user-stories/US-014.md) | [EPIC-03](epics/EPIC-03.md) |
| [UC-015](use-cases/UC-015.md) | Editar una entrada del historial | [US-015](user-stories/US-015.md) | [EPIC-03](epics/EPIC-03.md) |
| [UC-016](use-cases/UC-016.md) | Simular inscripción | [US-016](user-stories/US-016.md) | [EPIC-04](epics/EPIC-04.md) |
| [UC-017](use-cases/UC-017.md) | Publicar reseña de una cursada | [US-017](user-stories/US-017.md) | [EPIC-05](epics/EPIC-05.md) |
| [UC-018](use-cases/UC-018.md) | Editar reseña propia | [US-018](user-stories/US-018.md) | [EPIC-05](epics/EPIC-05.md) |
| [UC-019](use-cases/UC-019.md) | Reportar una reseña | [US-019](user-stories/US-019.md) | [EPIC-05](epics/EPIC-05.md) |
| [UC-020](use-cases/UC-020.md) | Ver el estado de sus reports | [US-020](user-stories/US-020.md) | [EPIC-05](epics/EPIC-05.md) |
| [UC-021](use-cases/UC-021.md) | Reenviar email de verificación | [US-021-b](user-stories/US-021-b.md) + [US-021-f](user-stories/US-021-f.md) | [EPIC-02](epics/EPIC-02.md) |
| [UC-022](use-cases/UC-022.md) | Expirar registro no verificado (system) | [US-022-b](user-stories/US-022-b.md) + [US-022-i](user-stories/US-022-i.md) | [EPIC-02](epics/EPIC-02.md) |
| [UC-023](use-cases/UC-023.md) | Guardar simulación como draft (premium) | [US-023](user-stories/US-023.md) | [EPIC-04](epics/EPIC-04.md) |
| [UC-024](use-cases/UC-024.md) | Editar simulación draft (premium) | [US-024](user-stories/US-024.md) | [EPIC-04](epics/EPIC-04.md) |
| [UC-025](use-cases/UC-025.md) | Borrar simulación draft (premium) | [US-025](user-stories/US-025.md) | [EPIC-04](epics/EPIC-04.md) |
| [UC-026](use-cases/UC-026.md) | Compartir simulación al corpus público (premium) | [US-026](user-stories/US-026.md) | [EPIC-04](epics/EPIC-04.md) |
| [UC-027](use-cases/UC-027.md) | Ver simulaciones públicas de otros (premium) | [US-027](user-stories/US-027.md) | [EPIC-04](epics/EPIC-04.md) |
| [UC-028](use-cases/UC-028.md) | Login | [US-028-b](user-stories/US-028-b.md), [US-028-f](user-stories/US-028-f.md) | [EPIC-02](epics/EPIC-02.md) |
| [UC-029](use-cases/UC-029.md) | Sign-out | [US-029-i](user-stories/US-029-i.md) | [EPIC-02](epics/EPIC-02.md) |

### Claim de identidad docente (3 UCs)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-030](use-cases/UC-030.md) | Iniciar claim de TeacherProfile | [US-030](user-stories/US-030.md) | [EPIC-06](epics/EPIC-06.md) |
| [UC-031](use-cases/UC-031.md) | Verificar por email institucional | [US-031](user-stories/US-031.md) | [EPIC-06](epics/EPIC-06.md) |
| [UC-032](use-cases/UC-032.md) | Solicitar verificación manual | [US-032](user-stories/US-032.md) | [EPIC-06](epics/EPIC-06.md) |

### Docente verificado (2 UCs)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-040](use-cases/UC-040.md) | Responder reseña sobre sí mismo | [US-040](user-stories/US-040.md) | [EPIC-06](epics/EPIC-06.md) |
| [UC-041](use-cases/UC-041.md) | Editar respuesta propia | [US-041](user-stories/US-041.md) | [EPIC-06](epics/EPIC-06.md) |

### Moderador (4 UCs)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-050](use-cases/UC-050.md) | Ver cola de reseñas under_review | [US-050](user-stories/US-050.md) | [EPIC-07](epics/EPIC-07.md) |
| [UC-051](use-cases/UC-051.md) | Resolver un report | [US-051](user-stories/US-051.md) | [EPIC-07](epics/EPIC-07.md) |
| [UC-052](use-cases/UC-052.md) | Restaurar reseña removida | [US-052](user-stories/US-052.md) | [EPIC-07](epics/EPIC-07.md) |
| [UC-053](use-cases/UC-053.md) | Ver audit log de una reseña | [US-053](user-stories/US-053.md) | [EPIC-07](epics/EPIC-07.md) |

### Admin (9 UCs)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-060](use-cases/UC-060.md) | Gestionar University | [US-060](user-stories/US-060.md) | [EPIC-08](epics/EPIC-08.md) |
| [UC-061](use-cases/UC-061.md) | Gestionar Career + CareerPlan | [US-061](user-stories/US-061.md) | [EPIC-08](epics/EPIC-08.md) |
| [UC-062](use-cases/UC-062.md) | Gestionar Subject + Prerequisite | [US-062](user-stories/US-062.md) | [EPIC-08](epics/EPIC-08.md) |
| [UC-063](use-cases/UC-063.md) | Gestionar Teacher | [US-063](user-stories/US-063.md) | [EPIC-08](epics/EPIC-08.md) |
| [UC-064](use-cases/UC-064.md) | Gestionar AcademicTerm | [US-064](user-stories/US-064.md) | [EPIC-08](epics/EPIC-08.md) |
| [UC-065](use-cases/UC-065.md) | Gestionar Commission + CommissionTeacher | [US-065](user-stories/US-065.md) | [EPIC-08](epics/EPIC-08.md) |
| [UC-066](use-cases/UC-066.md) | Verificar TeacherProfile manualmente | [US-066](user-stories/US-066.md) | [EPIC-06](epics/EPIC-06.md) |
| [UC-067](use-cases/UC-067.md) | Crear/deshabilitar cuentas staff | [US-067](user-stories/US-067.md) | [EPIC-09](epics/EPIC-09.md) |
| [UC-068](use-cases/UC-068.md) | Deshabilitar cuenta member | [US-068](user-stories/US-068.md) | [EPIC-02](epics/EPIC-02.md), [EPIC-09](epics/EPIC-09.md) |

### University staff (1 UC)

| UC | Título | User Story | Epic |
|---|---|---|---|
| [UC-080](use-cases/UC-080.md) | Ver dashboard institucional | [US-080](user-stories/US-080.md) | [EPIC-10](epics/EPIC-10.md) |

---

## Totales

- **43 casos de uso** cubren el MVP completo (34 originales + 9 nuevos: UC-021 a UC-029).
- **7 en full form** (flujos con ramas significativas): UC-014, UC-016, UC-017, UC-019, UC-031, UC-051, UC-066.
- **34 en short form** (CRUDs y flujos triviales).

**UCs nuevos del discovery DDD** (ver `eventstorming.md` para captura del proceso):

- UC-021 Reenviar email de verificación.
- UC-022 Expirar registro no verificado (system).
- UC-023 Guardar simulación como draft (premium).
- UC-024 Editar simulación draft (premium).
- UC-025 Borrar simulación draft (premium).
- UC-026 Compartir simulación al corpus público (premium).
- UC-027 Ver simulaciones públicas de otros (premium).
- UC-028 Login.
- UC-029 Sign-out.

Cada UC se traduce a un application service en la capa `Application/` de Clean Architecture y a un endpoint en `Api/`. La API puede organizarse en controllers por actor o por recurso: ese es el tema del próximo doc (`architecture/api-design.md`).
