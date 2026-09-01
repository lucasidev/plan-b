# Personas de testing (fixtures del seeder)

> No confundir con [`user-personas.md`](../product/personas.md), que son las personas de **producto**. Esto son identidades fijas de desarrollo.

Tres identidades fijas que el `DevSeedHostedService` deja seteadas al levantar el host en Development. Cada una cubre un camino concreto del flujo de auth (login happy path, login con cuenta deshabilitada, login con email no verificado). Sirven para:

- Probar manualmente el flujo en `/sign-in` sin tener que registrar + verificar a mano cada vez.
- Tests de integración que necesitan un user "ya existente" sin pasar por el ciclo completo.
- Demos: la app se ve poblada apenas se levanta.

Las personas son **idempotentes**. Si ya existen en la DB, el seeder las saltea. Si la DB se reinicia (`just db-reset`), el seeder las recrea idénticas.

Las personas son **no commiteables a producción**. El hosted service que las crea está gateado por `IsDevelopment()`. En staging / prod nunca se ejecuta.

## Member personas: Sprint S1 (auth slice)

### Lucía Mansilla

| | |
|---|---|
| Email | `lucia.mansilla@gmail.com` |
| Password | `lucia.mansilla.12` |
| Estado | verified, member |
| Rol | `member` |

Alumna avanzada de 3° año Sistemas, con historial cargado. Es la persona con la que se recorre el camino feliz de un alumno que ya tiene datos.

**La usamos para**: login happy path y cualquier flujo post-login que necesite un alumno con perfil e historial.

**Hubo también un alumno recién entrando (Mateo Giménez), y se fue el 2026-08-30** con el onboarding que cubría. Existía solo para probar "usuario sin profile va a onboarding"; con [ADR-0086](../decisions/0086-the-product-informs-it-does-not-track-your-degree.md) esa pantalla se retiró (la cuenta se crea en el Registro y desde ahí se lee y se reseña, sin paso intermedio), así que la persona se quedó sin camino que cubrir. Vuelve si aparece un caso de uso real para un alumno recién registrado sin nada más declarado.

### Paula Suárez (suspendida)

| | |
|---|---|
| Email | `paula.suspendida@planb.local` |
| Password | `paula.suspendida.12` |
| Estado | verified, **disabled** |
| Rol | `member` |

Cuenta moderada por reseña abusiva. `User.Disable(...)` aplicado al seed.

**La usamos para**: probar el 403 que devuelve el endpoint de login cuando el user está deshabilitado. Probar también que verify-email no la "reactiva" silenciosamente.

### Martín Acosta (sin verificar)

| | |
|---|---|
| Email | `martin.pendiente@planb.local` |
| Password | `martin.pendiente.12` |
| Estado | registrado, **email no verificado** |
| Rol | `member` |

Se registró pero nunca clickeó el link del mail. Tiene un `VerificationToken` activo.

**La usamos para**: probar el 403 con `title: identity.account.email_not_verified`. También para probar el flow de "pedir reenvío" cuando exista, y `verify-email` consumiendo su token.

## Personas docentes: F3+ (cuando exista TeacherProfile)

Placeholder. Cuando aterrice el aggregate `TeacherProfile` y la verificación institucional de docentes (UC-031), seedeamos las tres figuras del mockup como teachers verificados:

- **Lic. Brandt**: el docente que responde reseñas, perfil empático.
- **Lic. Castro**: POO, bien valorado, didáctico.
- **Dr. Iturralde**: Probabilidad, exigente, reseñas mixtas.

Cada uno con su email institucional fake (`brandt@unsta.edu.ar` style), su `TeacherProfile` verificado, y las cátedras que integran. Los detalles cuando llegue la fase.

## Personas staff

### Lautaro Maza (admin)

| | |
|---|---|
| Email | `admin@planb.local` |
| Password | `admin.planb.local.12` |
| Estado | verified, **admin** |
| Rol | `admin` |

**La usamos para**: entrar al backoffice y cargar catálogo (universidades, carreras, planes, materias, docentes, cátedras). Es el único rol que hoy tiene backoffice.

**Hubo también un moderador (Elena Ferro), y se fue el 2026-08-30** con su rol. Moderación se retiró en R2 y el rol quedó sin una sola pantalla; el frontend dejó de reconocerlo, así que la cuenta sembrada se habría logueado bien y ningún guard la habría reconocido después, en silencio. Vuelve cuando vuelva la feature, con su pantalla (ver la revisión de [ADR-0019](../decisions/0019-single-nextjs-app-with-route-groups-per-actor.md)).

## Cómo viven en código

```
backend/modules/identity/src/Planb.Identity.Application/Seeding/
├── IdentitySeeder.cs              factory: list<Persona> → User aggregates
├── DevSeedHostedService.cs        IHostedService gateado por IsDevelopment()
└── Personas.cs                    catálogo de las personas (constantes)
```

El hosted service corre en `StartAsync` *después* de `DevMigrationsHostedService` (orden por registro en Program.cs). Verifica si las personas ya existen vía `IUserRepository.ExistsByEmailAsync`; si sí, salta. Si no, crea cada una llamando al mismo `User.Register(...)` que el endpoint público, después aplica las transiciones específicas (`MarkVerified`, `Disable`) según corresponda.

## Cuándo este doc se actualiza

- Aterriza un aggregate nuevo (StudentProfile, TeacherProfile, ModeratorProfile, etc.) → cada persona gana una sección con su data específica.
- Aparece un caso de uso de auth nuevo (ej. password reset) que requiere otro estado de user → agregamos persona.
- Una persona deja de ser usada en tests → la borramos del seeder y de acá.

Refs: [ADR-0008](../decisions/0008-exclusive-roles-with-profiles-as-capability-unlockers.md), [ADR-0033](../decisions/0033-verification-token-as-a-child-entity.md).
