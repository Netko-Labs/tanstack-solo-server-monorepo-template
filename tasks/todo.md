# Task checklist

## Active — freeze pass (2026-10-01)

Rules, layering, security, examples, tests and generator parity settled before the template freezes.
Stack: `feat/freeze-pass` → `main`

- [x] batch 1–3: rules & specs, generator & CLI basics, domain contracts & layering
- [ ] batch 5 (WP18): todos `update`/`delete` throw `not_found` for a row removed elsewhere; map the
      code to copy through `toUserMessage` instead of showing `mutation.error.message`
- [ ] batch 8 (WP09): one example query in the generator's service template (carried from WP02):
      domain table + drizzle-zod entity + flat schema + `domain/src/values/`, a
      `service/queries/{entity}/{op}.ts`, and a D2 procedure with `.input()`/`.output()`; the
      template `entities/index.ts.hbs` re-exports that entity instead of `export {}`
- [ ] verify: `bun run check-types`, `bun run fmt-lint`, `bun run test` (with `CACHE_URL`,
      `DATABASE_URL`) green before every commit
- acceptance: §2 of `docs/conventions.md` unchanged; every baseline `lib/` folder still exists

## Completed
