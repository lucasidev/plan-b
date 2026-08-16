# planb

Instrumento de presión estudiantil sobre las universidades argentinas: convierte lo que los alumnos saben por haberlo vivido (hoy disperso en grupos de WhatsApp y en pasillos) en datos agregados que aguantan una discusión. No es un buscador de carreras, ni un ranking, ni una app de gestión académica.

Se apoya en cinco decisiones que gobiernan todo el producto: dos números por materia que nunca se promedian (exigencia y gestión), atribución de cada señal (propio de la materia o la institución fallando), testimonio por frases curadas en vez de texto libre, lectura sin pedir cuenta, y un catálogo completo cargado por el equipo.

Tesis completa, que gobierna todo lo demás: [`docs/THESIS.md`](docs/THESIS.md). El código de este repo contiene además la versión anterior del producto (el planificador de cuatrimestre) en retiro: el viraje está registrado en [ADR-0063](docs/decisions/0063-the-product-is-a-pressure-instrument.md).

## Contexto académico

- **Asignatura**: Proyecto Final
- **Carrera**: Tecnicatura Universitaria en Desarrollo y Calidad de Software
- **Universidad**: Universidad del Norte Santo Tomás de Aquino (UNSTA)
- **Docente**: Ing. Elio Copas
- **Alumno**: Lucas Daniel Iriarte

## Problema

Los alumnos sostienen la universidad y no tienen forma de incidir en ella: la institución decide, evalúa, demora y define, y el alumno acepta. Es una asimetría de poder, no de información.

La información es la arista más accionable, porque ya está en manos de los alumnos. Pero vive dispersa en grupos de WhatsApp y en pasillos: un alumno diciendo "no dieron las clases" es una anécdota, cuarenta diciéndolo es un hecho. El único obstáculo entre esas dos cosas es que están dispersos y en silencio.

## Solución

Un instrumento de presión: el lugar donde ese reclamo disperso y desmentible se vuelve un dato que aguanta una discusión. No planifica tu cuatrimestre: eso ya se resuelve con una lapicera en quince minutos.

Sirve al que elige, para no decidir con un folleto. Al que está adentro, para saber si lo que le pasa es la materia o la cátedra, y para no reclamar solo. Al docente que da bien su materia, que por primera vez tiene dónde que se vea. Al que investiga, porque el crudo se descarga sin registro.

## Actores

| Actor                               | Descripción                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Alumno (member)**                 | Usuario principal. Gestiona historial, simula inscripciones, escribe/consulta reseñas.         |
| **Docente verificado**              | Responde públicamente a reseñas sobre él. Verificación por email institucional o manual.       |
| **Moderador (staff)**               | Resuelve reports, mantiene la calidad del contenido. Cuenta separada, sin identidad académica. |
| **Universidad**                     | Destinataria de la presión, no cliente: sin convenios ni suscripciones ("no podríamos publicar estos números y a la vez depender de quien evaluamos"). El mismo dato que la expone es el que le dice dónde arreglar. |

> **Versión anterior (en retiro)**: las dos secciones que siguen (funcionalidades y fases) describen el alcance construido del producto planificador, registrado en retiro por [ADR-0063](docs/decisions/0063-the-product-is-a-pressure-instrument.md). Se conservan como historia del desarrollo; el alcance vigente se define contra [docs/THESIS.md](docs/THESIS.md).

## Funcionalidades del MVP

1. Precarga manual de planes de estudio (UNSTA como primer caso; el modelo soporta múltiples universidades).
2. Registro abierto de alumnos.
3. Carga gradual del historial académico: manual o parseo de PDF/texto.
4. Visualización del plan como grafo interactivo con estados por color.
5. Simulador de inscripción: editor, no recomendador.
6. Sistema de reseñas con filtro automático básico y moderación reactiva.
7. Respuesta pública de docentes verificados.
8. Dashboard institucional con reseñas agregadas, tasas de recursada y combinaciones que más fallan.

Fuera de MVP: firma opcional de reseñas con identidad, modelos predictivos de aprobación, estimación de fecha de recepción, análisis de temas recurrentes con clustering semántico (diseñado, con la infraestructura diferida hasta tener un consumidor real: ver revisión de ADR-0007).

## Stack técnico

| Capa                          | Tecnología               | Notas                                              |
| ----------------------------- | ------------------------ | -------------------------------------------------- |
| **Frontend**                  | Next.js                  | SSR para indexar reseñas y materias                |
| **Backend**                   | .NET                     | API REST con Clean Architecture                    |
| **Base de datos**             | PostgreSQL               | JSONB, CTEs recursivos, full-text search           |
| **Cache / ephemeral state**   | Redis                    | Refresh tokens, rate limiting, hot reads (ADR-0034) |
| **Autenticación**             | JWT + email verification | Verificación manual para docentes en MVP           |
| **Reverse proxy**             | Traefik                  | Ruteo y SSL automático                             |
| **Deploy**                    | Dokploy sobre VPS        | Self-hosted, sin dependencias cloud pagas          |
| **Dependencia externa única** | SMTP                     | Para emails de verificación                        |

## Fases del desarrollo

1. **Diseño y modelado de datos** — esquema de base de datos, modelo de dominio, diseño de API.
2. **Backend y autenticación** — API REST, JWT, verificación por email, gestión de usuarios.
3. **Precarga de planes de estudio y frontend base** — carga manual de carreras, visualización del grafo, interfaz de historial.
4. **Simulador y sistema de reseñas** — lógica de combinaciones, métricas de viabilidad, publicación y moderación.
5. **Dashboard institucional y verificación de docentes** — métricas agregadas, respuesta pública.
6. **Focus group cerrado y ajustes** — prueba con grupo reducido, feedback, iteración.
7. **Lanzamiento público** — sincronizado con período de inscripción cuatrimestral.

## Estado actual

**Fase 2 en curso.** El dominio está modelado, las decisiones formalizadas (34 ADRs) y el monorepo está scaffoldeado. La implementación concreta de features arranca en Fase 3.

## Cómo correr local

**Prerequisitos**: .NET 10 SDK, [bun](https://bun.sh), Docker, [just](https://just.systems), [lefthook](https://lefthook.dev).

```bash
# Primera vez: crea .env, levanta Postgres + Mailpit, instala deps, corre hooks
just setup

# Backend + frontend en paralelo (Ctrl+C frena ambos)
just dev

# Solo uno
just dev-backend
just dev-frontend

# Tests
just test

# Lint (y fix)
just lint
just lint-fix

# Base de datos
just migrate          # aplica todas las migrations pendientes
just db-reset         # borra volume y re-migra
```

**Servicios locales:**

| Servicio    | URL                   | Notas                         |
| ----------- | --------------------- | ----------------------------- |
| Backend API | http://localhost:5000 | .NET 10 + Wolverine + Carter  |
| Frontend    | http://localhost:3000 | Next.js 15 App Router         |
| Postgres    | localhost:5432        | pgvector/pgvector:pg17        |
| Redis       | localhost:6379        | redis:7-alpine, AUTH required |
| Mailpit UI  | http://localhost:8025 | emails de verificación de dev |

## Estructura del repo

```
plan-b/
├── backend/              .NET 10 modular monolith (6 módulos; planning en retiro: ADR-0063)
│   ├── libs/shared-kernel/
│   ├── host/Planb.Api/
│   ├── modules/
│   │   ├── identity/
│   │   ├── academic/
│   │   ├── enrollments/
│   │   ├── reviews/
│   │   └── moderation/
│   └── tests/Planb.IntegrationTests/
├── frontend/             Next.js 15 App Router + TanStack Query + shadcn
│   └── src/
│       ├── app/          rutas por route group ((public), (auth), (member), (teacher), (staff))
│       ├── features/     1:1 con módulos del backend
│       └── lib/          api-client, session, env
├── docs/                 34 ADRs + domain + architecture
├── scripts/
├── Justfile              task runner
├── lefthook.yml          pre-commit hooks
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Documentación

Ver [`docs/`](docs/) para el índice completo. Entradas principales:

- [`docs/decisions/`](docs/decisions/) — Decision Records (ADRs estilo MADR): decisiones de diseño con alternativas consideradas y consecuencias.
- [`docs/domain/ubiquitous-language.md`](docs/domain/ubiquitous-language.md) — Glosario del dominio. Define qué significa cada término en código, UI y conversación.
- `docs/architecture/` — Diseño técnico (ERD, capas del backend, deploy, etc.). En construcción.
