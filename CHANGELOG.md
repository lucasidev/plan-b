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
- rate limiter + refresh bulk revoke (US-033-i infra) (identity) — [`75af6ba`](https://github.com/lucasidev/plan-b/commit/75af6ba5f2a3aed0e083473a5f75049b7e6363e6)
- forgot-password + reset-password backend (US-033-i) (identity) — [`053636d`](https://github.com/lucasidev/plan-b/commit/053636de4aaa3bc6d8b2d280a69f59bb9c7ee752)
- vitest + Testing Library setup + sample tests (US-T01) (test) — [`d96994f`](https://github.com/lucasidev/plan-b/commit/d96994f58492ae9068f55a646f1a940064cf27b4)
- Playwright e2e infra + auth flows (US-T02) (test) — [`af4a527`](https://github.com/lucasidev/plan-b/commit/af4a527d733d65869e057076a94d525a264d1713)
- resend verification email end-to-end (US-021) (identity) — [`4ef9f60`](https://github.com/lucasidev/plan-b/commit/4ef9f60f5d8062be5c356bf22a3f4a92e4267afe)
- expirar registros no verificados a los 7 dias (US-022) (identity) — [`ff8a872`](https://github.com/lucasidev/plan-b/commit/ff8a872ed5c88a083f101b97feddd52d01655067)
- catalogo Academic minimo + StudentProfile (US-012) (identity) — [`fe7c4be`](https://github.com/lucasidev/plan-b/commit/fe7c4be41e6d6f404cb0f3a8b492cf4db996e859)

### Fixed

- changelog workflow handles full push range + literal skip tag (ci) — [`f227a3e`](https://github.com/lucasidev/plan-b/commit/f227a3eada706dcd55ffac0348ac2eb4b794654a)
- broken link in ADR-0036 + lychee config tweaks (docs) — [`f4ef9c5`](https://github.com/lucasidev/plan-b/commit/f4ef9c5f5888cd67c4e2e867eaed4ab4e0217d9e)
- skip pr-title workflow on dependabot PRs (ci) — [`6aae01f`](https://github.com/lucasidev/plan-b/commit/6aae01f1a1ae3074266073d2401fefdc558e323d)
- pr-title skip uses pull_request.user.login (not actor) (ci) — [`921113b`](https://github.com/lucasidev/plan-b/commit/921113b74be04845871d94edcfd635a7babefd1c)
- e2e first-run issues (alert, seed timing, validation scope) (test) — [`ba8e5ce`](https://github.com/lucasidev/plan-b/commit/ba8e5ce8832a0825e0ecf1054111b324358fa852)
- drop dangling US-033-f link (US-033 is integrated, lives in US-033-i.md) (docs) — [`e304ad1`](https://github.com/lucasidev/plan-b/commit/e304ad1aeeb1682bb8c5e9baeb40243f14ee1237)
- actualizar locator de sign-in tras rename del hint a boton resend (e2e) — [`2277bd4`](https://github.com/lucasidev/plan-b/commit/2277bd4ab4eeed44ef1d15970a06f868a6881dc1)
