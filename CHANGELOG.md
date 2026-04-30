# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Pre-deploy: no hay versiones todavía (ver [ADR-0038](docs/decisions/0038-release-and-versioning-policy.md)).
> Cada merge a `main` appendea un bullet a `[Unreleased]` automáticamente vía workflow GHA
> (ver [ADR-0037](docs/decisions/0037-changelog-automation-auto-append.md)). **No editar a mano.**

## [Unreleased]

### Added

- forgot-password + reset-password flow (US-033-f) (frontend) — [`c6b87a1`](https://github.com/lucasidev/plan-b/commit/c6b87a1bf844e1a623e1581c8777b2673e161d92)

### Fixed

- changelog workflow handles full push range + literal skip tag (ci) — [`f227a3e`](https://github.com/lucasidev/plan-b/commit/f227a3eada706dcd55ffac0348ac2eb4b794654a)
- broken link in ADR-0036 + lychee config tweaks (docs) — [`f4ef9c5`](https://github.com/lucasidev/plan-b/commit/f4ef9c5f5888cd67c4e2e867eaed4ab4e0217d9e)
