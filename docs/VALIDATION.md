# Validation Plan

## Overview

SOKA Baru should prove correctness through both technical tests and school-workflow checks.

## Validation Principles

- Critical outputs must trace back to source data or explicit user input.
- Attendance, grades, parent links, and permissions require especially careful validation.
- MVP acceptance must be judged against real user workflows, not just code completion.

## Initial Checklist

| Area | Validation Method | Status | Notes |
|---|---|---|---|
| Product scope | Grill decisions recorded in planning files. | In progress | Session 0 started. |
| Role access | Permission matrix, backend tenant-isolation tests, and optional RLS tests. | Not started | Depends on Sprint 002 implementation. |
| Attendance | Unit/integration tests plus manual workflow check. | Not started | Core daily loop candidate. |
| Grades | Tests for KKM, finalization, and parent visibility. | Not started | Scope needs confirmation. |
| Parent messaging | Workflow tests across staff and parent roles. | Not started | Core communication candidate. |
