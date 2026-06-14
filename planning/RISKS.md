# Risks

| Risk | Likelihood | Impact | Mitigation | Status |
|---|---:|---:|---|---|
| Rebuilding too broadly from the Super Apps deck creates a bloated MVP. | High | High | Use grill sessions to classify modules as Now, Later, or Never. | Open |
| Migrating too much from SOKA Lama carries relics into SOKA Baru. | High | High | Treat SOKA Lama as a reference; migrate only through sprint blueprints. | Open |
| Role scope remains ambiguous, especially siswa, kepsek, and TU. | High | High | Run a dedicated role and scope grill session before implementation. | Open |
| Documentation becomes heavy and unused. | Medium | Medium | Keep 120x docs concise, operational, and sprint-linked. | Open |
| Data and permissions model is designed after UI work. | Medium | High | Resolve multi-tenant, auth, and RBAC decisions before production implementation. | Open |
| Teacher daily workflow becomes too heavy and hurts adoption. | High | High | Use the migrated 10-minute daily loop constraint when evaluating MVP features. | Open |
| Numeric behavior scoring creates policy conflict between schools. | Medium | High | Keep behavior notes qualitative unless a future paid school explicitly requires configurable scoring. | Open |
| Broad super-app vision pulls MVP away from the first buyer segment. | High | High | Use the migrated "SOKA is not" boundary and SD swasta menengah segment filter. | Open |
| Parent-facing value is optimized while school buyer value is underdefined. | Medium | High | Keep B2B Sekolah visible in North Star and pricing/onboarding sessions. | Open |
| SOKA Baru inherits old codebase-specific cleanup tasks as if they were product requirements. | Medium | High | Treat `90-relic-catalog.md` as guardrails unless a sprint explicitly targets old-code migration. | Open |
| Old mock-based student features distort the Phase 2 student role. | Medium | Medium | Rebuild student role around digital assignments and learning materials, not old mock page parity. | Open |
| Payment module becomes a shiny distraction before finance ownership is defined. | Medium | High | Keep payments out of promoted MVP until payment gateway and school-finance workflow decisions exist. | Open |
| Parent premium subscription creates conflict with the school buyer. | Medium | High | Treat as a future hypothesis only; require school consent, privacy boundaries, and no added teacher workload before considering it. | Open |
| Parent premium creates unequal information access between parents in the same school. | Medium | Medium | Define a strong free parent baseline; premium, if ever used, should add convenience or coaching, not core school transparency. | Open |
| Custom backend weakens tenant isolation if `school_id` checks are not systematic. | Medium | High | Use tenant-aware service helpers, integration tests with two schools, and optional Postgres RLS defense-in-depth. | Open |
