# planb

Plataforma web para planificación de cuatrimestre y reseñas crowdsourced de materias y docentes, orientada a alumnos de universidades argentinas.

Resuelve cinco decisiones concretas que enfrenta el alumno al inscribirse (¿recursar o ir a libre?, ¿qué materias meter?, ¿cuántas son viables?, ¿qué comisión elegir?, ¿cómo impacta en la fecha estimada de recepción?), apoyándose en información agregada por los propios alumnos que nadie indexa hoy.

## Contexto académico

|                 |                                                               |
| --------------- | ------------------------------------------------------------- |
| **Asignatura**  | Proyecto Final                                                |
| **Carrera**     | Tecnicatura Universitaria en Desarrollo y Calidad de Software |
| **Universidad** | Universidad del Norte Santo Tomás de Aquino (UNSTA)           |
| **Docente**     | Ing. Elio Copas                                               |
| **Alumno**      | Lucas Daniel Iriarte                                          |

## Problema

El plan de estudios universitario asume una trayectoria ideal. Cuando esa trayectoria se rompe (recursadas, equivalencias, cambios de carrera, ingreso ciego), el alumno necesita tomar decisiones informadas sobre su cuatrimestre. La información necesaria (carga real, dificultad, experiencia con docentes) existe atomizada en conversaciones de WhatsApp/Telegram/Discord, pero no de forma estructurada ni accesible.

Del lado institucional: alta deserción, baja tasa de graduación, causas invisibles. La data que explicaría esas métricas está dispersa en experiencias individuales que nadie agrega.

## Solución

Una plataforma donde los alumnos:

1. **Planifican el cuatrimestre**: simulan combinaciones tentativas de materias y ven carga horaria total, dificultad promedio combinada, y combinaciones históricas de otros alumnos.
2. **Consultan reseñas** crowdsourced sobre materias y docentes.
3. **Aportan las suyas**, en un loop de reciprocidad.

Las universidades (cliente secundario, comercial) acceden a un dashboard con métricas agregadas anónimas.

## Actores

| Actor                               | Descripción                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Alumno (member)**                 | Usuario principal. Gestiona historial, simula inscripciones, escribe/consulta reseñas.         |
| **Docente verificado**              | Responde públicamente a reseñas sobre él. Verificación por email institucional o manual.       |
| **Moderador (staff)**               | Resuelve reports, mantiene la calidad del contenido. Cuenta separada, sin identidad académica. |
| **Universidad (cliente comercial)** | Accede al dashboard institucional vía suscripción. Datos agregados y anónimos.                 |

## Funcionalidades del MVP

1. Precarga manual de planes de estudio (UNSTA como primer caso; el modelo soporta múltiples universidades).
2. Registro abierto de alumnos.
3. Carga gradual del historial académico: manual o parseo de PDF/texto.
4. Visualización del plan como grafo interactivo con estados por color.
5. Simulador de inscripción: editor, no recomendador.
6. Sistema de reseñas con filtro automático básico y moderación reactiva.
7. Respuesta pública de docentes verificados.
8. Dashboard institucional con reseñas agregadas, tasas de recursada y combinaciones que más fallan.

Fuera de MVP: firma opcional de reseñas con identidad, modelos predictivos de aprobación, estimación de fecha de recepción, análisis de temas recurrentes con clustering semántico (la infraestructura está, el feature UI queda gated hasta tener volumen).

## Stack técnico

| Capa                          | Tecnología               | Notas                                              |
| ----------------------------- | ------------------------ | -------------------------------------------------- |
| **Frontend**                  | Next.js                  | SSR para indexar reseñas y materias                |
| **Backend**                   | .NET                     | API REST con Clean Architecture                    |
| **Base de datos**             | PostgreSQL               | JSONB, CTEs recursivos, full-text search, pgvector |
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

**Fase 2 en curso.** El dominio está modelado, las decisiones formalizadas (25 ADRs) y el monorepo está scaffoldeado. La implementación concreta de features arranca en Fase 3.

## Cómo correr local

**Prerequisitos**: .NET 10 SDK, [bun](https://bun.sh), Docker, [just](https://just.systems), [lefthook](https://lefthook.dev).

```bash
# Primera vez: crea .env, levanta Postgres + MailHog, instala deps, corre hooks
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
| MailHog UI  | http://localhost:8025 | emails de verificación de dev |

## Estructura del repo

```
plan-b/
├── backend/              .NET 10 modular monolith (5 módulos)
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
├── docs/                 25 ADRs + domain + architecture
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
