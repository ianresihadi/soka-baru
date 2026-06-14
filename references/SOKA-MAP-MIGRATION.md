# SOKA-MAP Migration

## Purpose

This file records how SOKA Lama's `docs/SOKA-MAP` relates to SOKA Baru.

SOKA Baru does not recreate `docs/SOKA-MAP/` as an active documentation format. The active source of truth is:

- `CONTEXT.md`
- `planning/DOMAIN.md`
- `planning/DECISIONS.md`
- `planning/QUESTIONS.md`
- `planning/GRILL-SESSIONS.md`
- Sprint files under `planning/sprints/`
- Durable technical docs under `docs/`

## Source

Original source folder:

`C:\Users\USER\Desktop\Cowork Station\Projects\SOKA\docs\SOKA-MAP`

## Migration Rule

Do not copy SOKA-MAP files raw into SOKA Baru.

Instead:

- Move school terms, roles, and workflows into `planning/DOMAIN.md` or `CONTEXT.md`.
- Move durable product and architecture decisions into `planning/DECISIONS.md`.
- Move unresolved tensions into `planning/QUESTIONS.md`.
- Move session sequencing into `planning/GRILL-SESSIONS.md`.
- Move implementation-specific architecture into `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, or `docs/PERMISSIONS.md`.

## Known High-Value Source Files

| SOKA-MAP File | Likely Destination | Notes |
|---|---|---|
| `00-overview.md` | `planning/DOMAIN.md`, `planning/DECISIONS.md` | Product identity, segment, role frame, and existing scope decisions. |
| `30-core-loop.md` | `planning/DOMAIN.md`, `planning/DECISIONS.md`, future sprint requirements | Most important MVP scope source: daily loop, menu reduction, role staging. |
| `31-visual-standard.md` | Future UX docs or sprint requirements | Defines the "hangat dan ramah" visual direction. |
| `33-akademik-multimapel.md` | `docs/DATA_MODEL.md`, `docs/PERMISSIONS.md`, future sprint docs | Important for teacher assignments and academic model. |
| `38-notifikasi.md` | `docs/DATA_MODEL.md`, future sprint docs | Important for event and notification model. |
| `90-relic-catalog.md` | `planning/RISKS.md`, migration sprint docs | Helps prevent relics from entering SOKA Baru. |

## Status

Migration has started. Session 0 decided the first extraction order:

1. `30-core-loop.md`
2. `00-overview.md`
3. `90-relic-catalog.md`

This order starts from the strongest MVP decisions, then adds broader context, then adds relic guardrails.

## Migration Progress

| Source File | Status | Destination Notes |
|---|---|---|
| `30-core-loop.md` | Started | Core MVP baseline migrated into `CONTEXT.md`, `planning/DOMAIN.md`, `planning/DECISIONS.md`, `planning/QUESTIONS.md`, and `planning/RISKS.md`. |
| `00-overview.md` | Started | Business model, target segment, product boundaries, and delivery workflow migrated into `CONTEXT.md`, `planning/DOMAIN.md`, `planning/DECISIONS.md`, `planning/QUESTIONS.md`, and `planning/RISKS.md`. |
| `90-relic-catalog.md` | Started | Migrated as guardrails into `CONTEXT.md`, `planning/DOMAIN.md`, `planning/DECISIONS.md`, `planning/QUESTIONS.md`, and `planning/RISKS.md`; not copied as a literal cleanup backlog. |

## Relic Catalog Rule

`90-relic-catalog.md` is now a guardrail source only.

It does not create implementation work by itself. File-by-file migration from SOKA Lama must be handled later through an approved Existing Code Salvage sprint with its own requirements, blueprint, and acceptance criteria.
