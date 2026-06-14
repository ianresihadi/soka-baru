# AGENTS.md

## Project

**Name:** SOKA Baru
**Client:** Internal / Ian
**Description:** School operating app for Indonesian private elementary schools, rebuilt with a 120x-style Architect / Builder operating system.
**Tech stack:** React, Vite, TypeScript, Tailwind, Hono API, Drizzle ORM, Better Auth, Neon Postgres. Existing reference app uses Supabase, but SOKA Baru does not use Supabase as its baseline backend.
**Created:** 2026-06-13

## Operating Model

This project uses a 120x-style Architect / Builder workflow.

The handoff is a folder, not a conversation. Durable project truth lives in this repository, especially under `planning/` and `docs/`.

## First Files to Read

Read these in order at the start of every session:

1. `AGENTS.md`
2. `CONTEXT.md`
3. `planning/STATE.md`
4. `planning/DECISIONS.md`
5. `planning/DOMAIN.md`
6. `planning/RISKS.md`
7. `planning/QUESTIONS.md`
8. Active sprint files under `planning/sprints/`
9. Relevant docs under `docs/`

## Source Material

The new source of truth is this folder:

`C:\Users\USER\Documents\SOKA`

Reference materials currently live outside this repo:

- Existing SOKA app: `C:\Users\USER\Desktop\Cowork Station\Projects\SOKA`
- 120x Operators Kit: `C:\Users\USER\Downloads\120x-Operators-Kit.zip`
- Super Apps Sekolah deck: `C:\Users\USER\Downloads\super_apps_sekolah.pptx`

Do not silently copy private or bulky reference files into the repo. Track them in `planning/FILE_INVENTORY.md` first.

## Builder Rules

- Do not redefine product scope during implementation.
- Do not invent business rules.
- Prefer small, testable changes.
- Record durable decisions in `planning/DECISIONS.md`.
- Keep current status in `planning/STATE.md`.
- Keep domain terminology in `CONTEXT.md` and `planning/DOMAIN.md`.
- Update architecture docs when architecture changes.
- Use the old SOKA app as a migration source, not as the new product truth.

## Sprint Workflow

Each sprint lives in:

```text
planning/sprints/###-{sprint-name}/
```

Each sprint should include:

- `requirements.md` for what and why
- `blueprint.md` for how
- `acceptance.md` for what done means
- `handoff-prompt.md` for the Builder prompt

Implementation should not begin until the relevant sprint files exist and are approved.
