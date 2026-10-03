# <Product or area> — PRD

`<host or surface>`. <One paragraph: what this is and who it serves.> Extends `docs/tech-spec.md`
§<n>. Release tags follow the tech spec's Releases table. Nothing here reopens a decided item
(`docs/decisions.md`, tech spec Decisions); where a section adds beyond the spec it says so.

## 1. Problem

<What breaks or leaks today without this, and for whom. No solution yet.>

## 2. Users

<A table: Role | Who | Can. Name the gate that enforces each role.>

## 3. Principles

<Three to five numbered rules every feature below obeys, each one testable.>

## 4. Functional areas

<One `### 4.n <Area> (R<n>)` per area: what a user does, the states, the edge cases. When it
draws on outside research, add a verdict table: Feature | take / adapt / later / skip | Why.>

## 5. Data model

<Tables that exist and are reused, then a table of additions: Table | Purpose | Release.>

## 6. Non-functional

<Latency, safety, auditability, access, availability, i18n: each a number or a check.>

## 7. Success metrics

<Measurable outcomes with a target and how each is measured.>

## 8. Out of scope

<What this PRD deliberately does not cover, and where it lives instead.>

## 9. Open questions

<Numbered questions, each with who decides and what it blocks.>
