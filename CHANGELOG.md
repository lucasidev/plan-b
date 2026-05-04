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
- redis helper via TCP en lugar de podman exec (e2e) — [`a69b27b`](https://github.com/lucasidev/plan-b/commit/a69b27b0f8532607d3130dab264bc420a30d2fcf)
- re-agregar dotenv perdido en resolución de conflict (e2e) — [`21b513d`](https://github.com/lucasidev/plan-b/commit/21b513d2a9c380a9e618a601b419b3fce403e6e5)
- inyectar JWT_SECRET + SESSION_SECRET al frontend en E2E (ci) — [`9101155`](https://github.com/lucasidev/plan-b/commit/9101155b4df813a75207cef6a3d9d56ac0b1c93a)
- materializar frontend/.env.local con secrets en CI (ci) — [`3f96ea9`](https://github.com/lucasidev/plan-b/commit/3f96ea9eddd467d4076930c866a7dd721fddbbcf)
- JWT__Issuer/Audience deben ser 'planb' (matchean hardcoded del frontend) (ci) — [`3f53709`](https://github.com/lucasidev/plan-b/commit/3f53709ad721a373dd78be60e2b3be4b3350e412)

### Changed

- leer JWT_ISSUER/JWT_AUDIENCE del env, no hardcoded (auth) — [`a3228a3`](https://github.com/lucasidev/plan-b/commit/a3228a3a4612285f5986d85c625d85bd55803005)
