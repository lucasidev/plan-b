# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Fase 1 diseño completa: 13 ADRs de dominio, 5 domain docs, ERD consolidado.
- Fase 2 arquitectura: 12 ADRs adicionales cubriendo backend, frontend y tooling (ADR-0014 a ADR-0025).
- Monorepo scaffolding inicial:
  - Root tooling: `Justfile`, `lefthook.yml`, `docker-compose.yml`, `.env.example`, GitHub Actions CI.
  - Backend: solution `Planb.sln` con estructura modular monolith (SharedKernel + Host + 5 módulos + integration tests).
  - Frontend: Next.js 15 App Router con route groups `(public)`, `(auth)`, `(member)`, `(teacher)`, `(staff)`.
  - Servicios dev: Postgres 17 + pgvector, Mailpit.
