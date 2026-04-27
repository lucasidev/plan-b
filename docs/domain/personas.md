# Personas de testing

Cuatro identidades fijas que el `DevSeedHostedService` deja seteadas al levantar el host en Development. Cada una cubre un camino concreto del flujo de auth (login happy path, login con cuenta deshabilitada, login con email no verificado, alumno entrando por primera vez). Sirven para:

- Probar manualmente el flujo en `/sign-in` sin tener que registrar + verificar a mano cada vez.
- Tests de integración que necesitan un user "ya existente" sin pasar por el ciclo completo.
- Demos: la app se ve poblada apenas se levanta.

Las personas son **idempotentes**. Si ya existen en la DB, el seeder las saltea. Si la DB se reinicia (`just db-reset`), el seeder las recrea idénticas.

Las personas son **no commiteables a producción**. El hosted service que las crea está gateado por `IsDevelopment()`. En staging / prod nunca se ejecuta.

## Member personas — Sprint S1 (auth slice)

### Lucía Mansilla

| | |
|---|---|
| Email | `lucia.mansilla@gmail.com` |
| Password | `lucia.mansilla.12` |
| Estado | verified, member |
| Rol | `member` |

Es la protagonista del mockup. Alumna avanzada de 3° año Sistemas, ~124 créditos cursados, recursando MAT201, planeando 2026·1c. Cuando estén `StudentProfile` + historial, su data espejea `USER_STATES.advanced` de [`docs/design/reference/components/data.jsx`](../design/reference/) (no commiteado todavía).

**La usamos para**: login happy path, futuros flows post-login (plan view, simulador, escribir reseñas).

### Mateo Giménez

| | |
|---|---|
| Email | `mateo.gimenez@hotmail.com` |
| Password | `mateo.gimenez.12` |
| Estado | verified, member |
| Rol | `member` |

Alumno recién entrando: 1° año, 0 créditos, sin historial. Su valor es probar la app desde cero.

**La usamos para**: onboarding (cuando exista), creación de StudentProfile, primera planificación de cuatri sin historial previo.

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

## Personas docentes — F3+ (cuando exista TeacherProfile)

Placeholder. Cuando aterrice el aggregate `TeacherProfile` y la verificación institucional de docentes (UC-031), seedeamos las tres figuras del mockup como teachers verificados:

- **Lic. Brandt** — el docente que responde reseñas, perfil empático.
- **Lic. Castro** — POO, bien valorado, didáctico.
- **Dr. Iturralde** — Probabilidad, exigente, reseñas mixtas.

Cada uno con su email institucional fake (`brandt@unsta.edu.ar` style), su `TeacherProfile` verificado, y un set de comisiones asignadas. Los detalles cuando llegue la fase.

## Personas staff — más adelante

Cuando aparezca el flujo de moderación (F4+) seedeamos un moderador y un admin para probar el panel staff. No urgentes hasta entonces.

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

Refs: [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md), [ADR-0033](../decisions/0033-verification-token-como-child-entity.md).
