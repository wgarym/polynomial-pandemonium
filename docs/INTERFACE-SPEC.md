# Polynomial Pandemonium — source interface specification

Source: `/Users/wgarymartin/Downloads/poly072225e.ggb`. Extracted read-only with `scripts/extract.py`. The original is not a build input and is never written by the app. SHA-256, size and GeoGebra version are in `source/provenance.json`. Full XML, global JavaScript, thumbnail, and all 200 construction records are retained in `source/`.

## First milestone contract

| Source object | Behavior | Trial implementation |
| --- | --- | --- |
| `n` | Integer degree 0–7; initially 1 | Native HTML range and degree readout |
| `a_0` … `a_7` | Initially `[0,1,0,0,0,0,0,0]`; show only indices ≤ n | Paired slider and numeric input, ascending order |
| `n.onUpdate` + `GoBtn` | Clear coefficients above n; set a_n to 1 only if it is zero; rebuild f | Implemented on degree changes; Go is implicit |
| `f` | Sum a_i x^i for i=0…n; coefficients remain live | JSXGraph function graph, evaluated with Horner's method |
| `button4` / Min Poly | Clear all eight coefficients; set a_n=1 | Exact behavior; degree zero becomes constant 1 |
| `s` | 1.2 × max(10, absolute coefficients of q) | Computed per degree for slider bounds |
| `q` | (x−1) times successive factors (x+2), (x−3), …, (x−7) up to degree n; first factor present even at n=0 | Used for slider bounds only |
| `InputBox1` … `InputBox8` | Numeric editing of a_0 … a_7 | Finite numeric values; not restricted to slider bounds |
| `button1` / Standard View | ZoomIn(−13.5,−6,9,8) | Bounding box [−13.5,8,9,−6] |
| Save/open | No custom save/open buttons or scripts in construction; GeoGebra supplies document persistence | Trial JSON v1 with coefficients, selected degree and viewport |

Only a_0 explicitly stores a 0.1 animation step; other coefficients have automatic/unspecified steps. Trial sliders consistently use 0.1; numeric fields allow arbitrary finite precision. Editing a leading coefficient to zero does not force it back to 1, matching the source (normalization occurs only on degree change/Go). The displayed actual degree may thus be lower than n; the zero polynomial is identified separately.

The initial source viewport is approximately [−13.50,8.05,17.66,−18.02] from its stored origin, scales and 1663×1229 size. The trial starts with the source's Standard View preset. Controls live outside the graph rather than masking part of it with polygons. Equation text is always simplified in this milestone. Curve and interface colors are a new trial design.

## Remaining source interface inventory / later milestones

- `a`: Show Zeros; `b`: Show Extrema; `j`: Show Inflection Points; `l`: y-intercept. All initially false. Root/Extremum/TurningPoint objects and B=(0,f(0)) provide these overlays.
- `c`: Factored Form, initially false; `g=IFactor(Simplify(f))`, `h=Factor(Simplify(f))`, `m1=Factors(f)` and associated text/list helpers.
- `simp`: Simplify, initially false; switches expanded numeric expression to simplified text.
- `button6`: Max Poly copies q's descending coefficients into the a_i values, then Fit View.
- `button2`: Fit View uses real roots, extrema, inflection points and y-intercept bounds with fallback spans of 10 and asymmetric margins. See `fitstr`, `xlist`, `ylist` in XML.
- `button3` and `button5`: Zoom In / Out; `xzoom` (H) and `yzoom` (V), initially true. The stored “Zoom In” script multiplies bounds by 2 and “Out” by 1/2 (apparently reversed labels). Trial uses conventional JSXGraph zoom, both axes together.
- `q1`, `q2`, corners and dilations form interface background/positioning geometry; replaced by HTML/CSS layout.
- Hidden construction helpers include symbolic strings, counters, factor experiments and viewport calculations. Their full definitions are in `interface-inventory.json` and XML; no GeoGebra script is executed by the trial.

## Persistence contract

JSON object: `format: "polynomial-pandemonium"`, `version: 1`, `degree: 0…7`, `coefficients: number[8]` in ascending power order, `bounds: [left,top,right,bottom]`. All numbers finite, inactive coefficients zero, and graph extents ordered. Opening validates before replacing state, reports errors, and leaves the current work intact for malformed files. Input capped at 100 KB. Save downloads a local file; no server or account required. This milestone does not import arbitrary .ggb documents or export GeoGebra files.

## Technical references

- [Vite guide](https://vite.dev/guide/)
- [JSXGraph API](https://jsxgraph.org/docs/)

## Trial revision: compact controls and graph features

Coefficient sliders and numeric values now share one row, with the value on the right. Source-derived slider limits are capped at ±144; direct numeric entry remains unrestricted. Degree uses the same compact layout.

Checkboxes below the coefficients toggle zeroes (Z), extrema (E), inflection points (I), and y-intercept (Y). Markers update with coefficients. Coincident feature labels are staggered. Feature locations use numerical polynomial root isolation: derivative roots divide the real line into monotonic intervals, a Cauchy bound encloses the roots, and bisection locates sign crossings. Repeated roots are detected at stationary points. Extrema require a first-derivative sign change; inflections require a second-derivative sign change. The zero polynomial has no isolated zero markers.

Fit Graph frames all finite feature coordinates, including hidden ones, with 20% margins, minimum span for degenerate cases, and the origin included. It does not change checkbox selections. This replaces the earlier milestone's deferred feature overlays/Fit View; it uses symmetric margins rather than GeoGebra's control-panel compensation. Numerical positions are approximate; nearly coincident roots and extremely ill-conditioned coefficients remain subject to floating-point precision. Checkbox visibility is a session preference, not stored in trial JSON.

## Trial revision: Max Poly and desktop view

The canvas now targets 1200 × 720 px, keeping the degree-seven controls, graph, and footer in one desktop view. Narrow embedded browsers scroll over this canvas. Fit View is next to Standard View below the graph.

Max Poly implements `q` and `button6` exactly for coefficient generation: successive factors are (x−1)(x+2)(x−3)(x+4)(x−5)(x+6)(x−7), stopping at n. At n=0, button6 selects the first descending coefficient of q=x−1, producing constant 1. The trial additionally enables all four feature checkboxes and fits the view. Exact Max Poly coefficients can exceed the ±144 slider range; numeric inputs retain those values without truncation.

Feature labels are placed in screen coordinates, avoiding other labels, markers, axis text and graph edges. Placement reruns on viewport changes. Short Z/E/I/Y identifiers correspond to the checkbox legend. An offscreen marker does not retain a floating onscreen label.

Feature palette: zeroes blue (#1769e0), extrema dark red (#8b1538), inflections green (#168039), y-intercept bright orange (#ff7900). Numerically coincident enabled features share one marker and an equals-joined label (e.g. Z1=E1=Y). The marker takes the first enabled feature's color in Z/E/I/Y order. Label collision placement accounts for the wider combined text. Visibility toggles remove only the corresponding label component.

Label placement revision: labels now render in a dedicated HTML overlay with exact screen-space boxes and light backgrounds. Candidate positions are searched at 4 px distance increments, avoiding the plotted curve as well as other text and markers. Labels displaced more than 18 px from their marker have a thin connector. Rechecked the degree-seven Max Poly case, including E2, E3, Z3, and Z5.

## Equation display and independent scaling

The source contains `c` (Factored Form) and `simp` (Simplify); no boolean named `fact` exists in this supplied archive. The trial exposes those two independent checkboxes, initially off. Simplify off shows every coefficient and power through the selected degree, including zeros and x⁰; on shows the simplified expression. Factored Form adds a second equivalent-expression line.

Factoring runs locally in a cancellable worker, using Nerdamer for rational factors and exact quadratic radicals. Real factors of irreducible higher-degree expressions may be numerical and use ≈. Some higher-degree residuals remain unfactored; this is not full GeoGebra IFactor CAS parity. Timeouts or unsupported inputs are explicitly reported. The worker is restarted after coefficient changes, so stale results cannot replace newer ones.

X and Y controls beside the zoom buttons correspond to source H/V. Buttons scale only selected axes about the origin, using factors 1/2 (in) and 2 (out); mouse-wheel zoom obeys the same selection. With both unchecked, zoom does nothing and reports why. Fit View and Standard View intentionally reset both axes. The source's apparently reversed Zoom In/Out captions are not copied. Equation/axis checkboxes are session preferences, currently not stored in JSON.

References: https://geogebra.github.io/docs/manual/en/commands/IFactor/ and https://nerdamer.com/docs/reference/factor/.

## Factored precision and Save As

A Decimals slider beside the equation checkboxes selects 0–6 decimal places (default 1). Factored coefficients/root offsets are rounded for display only; the original coefficients, graph, and saved JSON retain full precision. Rounded expressions use ≈ when no longer exact; trailing decimal zeros are omitted.

Save invokes `showSaveFilePicker` directly from the click event, suggesting the last saved name and restricting the document type to JSON. It writes only after a file is chosen and reports success after the write closes. Cancellation and failures do not trigger an automatic download. Where that API is absent, a filename dialog offers Download JSON and explains that location is controlled by browser download preferences. Chrome/Edge support the native picker; other browsers may use the fallback. Native OS dialog interaction was not inspectable through the embedded browser tools.
