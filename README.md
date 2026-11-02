# Polynomial Pandemonium migration trial

Local Vite + TypeScript app with JSXGraph and native HTML/CSS controls. First milestone implements degree 0–7, coefficients, live polynomial graph, Min Poly, and JSON save/open. No GeoGebra runtime or backend.

## Run

Use Node 22.12+ and pnpm:

```sh
pnpm install
pnpm dev
```

Open the localhost URL printed by Vite. `pnpm build` type-checks and produces `dist/`; `pnpm preview` serves the build; `pnpm test` checks source behavior and persistence. A pinned dependency resolution is in `pnpm-lock.yaml`.

## Migration evidence

Read [the interface specification](docs/INTERFACE-SPEC.md) for source behavior, explicit trial differences, file format, and deferred features. `docs/source/` holds extracted evidence and a SHA-256 provenance record. Regenerate using `python3 scripts/extract.py [path-to-ggb]`. The extractor reads the source without modifying it.

Save/Open handles the trial's JSON files, not `.ggb`. Save includes the current graph viewport. Opening replaces the active polynomial after validating the complete document. Degree reductions discard higher coefficients, matching the source. Min Poly means xⁿ, not a minimization calculation.

On this Mac, Node is supplied by the bundled Codex runtime rather than the shell PATH. After the completed dependency installation, run `./scripts/dev.sh` to launch using that runtime automatically.

## Verification

TypeScript check and production build pass; six model/persistence tests pass. Browser smoke checks verified degree changes, Min Poly, a rendered cubic, opening the quadratic fixture, saving, changing state, and reopening the actual downloaded JSON to restore the quadratic. Source SHA-256 was rechecked unchanged. Narrow-screen graph capture: `docs/browser-preview.png`.

The production build reports JSXGraph's bundled JessieCode `eval` and a roughly 1 MB JavaScript bundle (262 KB gzip). The trial does not execute imported scripts; bundle reduction is deferred. Zeros, extrema, inflection points, factoring, Max Poly, and Fit View remain later milestones.

Revision: compact slider/value rows, slider ranges capped at ±144, live zero/extremum/inflection/y-intercept checkboxes, and Fit Graph are implemented. The verification suite now has 11 tests, including repeated roots, stationary inflections, distant roots, and constant-polynomial fitting. These overlays and fitting supersede their earlier deferred status above.

Latest revision: 1200 × 720 desktop layout; Fit View beside Standard View; source-matched Max Poly with all features enabled and fitted; collision-aware feature label placement. The suite includes every degree's Max Poly roots/feature counts and label collision/edge cases.

Rendering regression fixed: JSXGraph's default function-graph RDP simplification operated in user coordinates and removed visible bends with highly unequal x/y scales. The polynomial graph now disables RDP simplification and uses 4096 samples during both movement and settled rendering. Reproduced and visually verified with `tests/fixtures/large-scale-septic.json` (the reported screenshot polynomial); corrected view is in `docs/curve-fix-preview.png`.

Equation controls now mirror source `simp` (Simplify) and `c` (Factored Form). X/Y selectors independently control zoom buttons and wheel scaling. Factoring supports rational factors and exact quadratic radicals, with explicitly approximate higher-degree real factors; it is not a complete replacement for GeoGebra's symbolic IFactor engine. See the specification for limits and persistence behavior.
