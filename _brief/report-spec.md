# Report Spec — AI Car Theft Analytics

## Report identity
- Report name: AI Car Theft Analytics
- Semantic model: AI Car Theft Analytics (local PBIP, built this session)
- Audience: External / portfolio viewers (recruiters, hiring managers) looking at a CV project
- Primary purpose: Tell a clear story about New Zealand vehicle thefts (Oct 2021 – Apr 2022) and show off data modelling, DAX and report design skills, built with Claude Code
- Delivery target: Local PBIP only (no publishing)

## Semantic model binding
- Entry mode:       Local Model
- Model name:       AI Car Theft Analytics
- connectionString: byPath ../AI Car Theft Analytics.SemanticModel (already set in definition.pbir)

## User decisions and constraints
- Scope: Full portfolio report: 4 analysis pages + 1 "About this project" page
- Page count: 5
- Interactivity: Vertical page navigator in a left rail on every page; 2 dropdown slicers per analysis page (top-right); cross-filtering on by default; no drillthrough
- Design direction: Dark "crime intelligence" look that stands out in CV screenshots
- Publishing: None
- Tooling: `powerbi-report-author` CLI needs Node.js, which is **not installed**. See Implementation notes.
- Model edit permissions: Yes (model built in this session); no new measures expected
- Accessibility: WCAG AA contrast on all text, alt text on every chart, no red/green-only encoding
- Data caveats: Oct 2021 and Apr 2022 are partial months (data runs 7 Oct 2021 – 6 Apr 2022); 15 thefts have no make/model year; 3 regions have zero thefts

## Narrative
- Core story: Thefts more than doubled from Oct 2021 (464) to Mar 2022 (1,053). Auckland has the most thefts, but small Gisborne has the highest rate per person. Ordinary, older standard vehicles (Toyota, stationwagons, silver) are taken, not luxury cars.
- Audience promise: In one minute a viewer understands how many, where, what and when, and sees how it was built
- Key questions answered:
  1. How big is the problem and is it growing?
  2. Which regions are hit hardest, by volume and per person?
  3. Which vehicles are most at risk?
  4. When do thefts happen?
  5. How was this built (model, DAX, AI-assisted workflow)?

## Design identity
- Tone: Dark investigative "case file": deep navy canvas, raised slate panels, one amber signal colour, calm and data-dense
- Signature: Case-file header on every page: small amber kicker label "CASE FILE 0X · SECTION" above an insight headline, plus a slim amber accent bar on the left of the title

## Page plan
1. **Overview**: "4,553 Vehicles Stolen in Six Months, and Monthly Thefts More Than Doubled"
   - Archetype: Executive Summary, variant A (KPI strip + hero trend + side ranking + bottom pair)
   - Visuals: 6 KPI cards; daily thefts column + 7-day rolling average line (combo); thefts by region bar; thefts by vehicle type bar; monthly thefts column
   - Slicers: Region, Make Type
2. **Where**: "Auckland Has the Most Thefts, but Gisborne Has the Highest Rate at 338 per 100K"
   - Archetype: Comparative Benchmark, variant B (side-by-side volume vs rate)
   - Visuals: thefts by region bar; thefts per 100K by region bar; population vs thefts scatter; region detail table
   - Slicers: Make Type, Vehicle Type
3. **What**: "Toyota, Stationwagons and Silver Vehicles Top the Theft List"
   - Archetype: Analytical Canvas, variant A (tall ranking + supporting breakdowns)
   - Visuals: 6 KPI cards; top makes bar; vehicle type bar; colour bar; model decade column
   - Slicers: Region, Make Type
4. **When**: "Mondays Are the Peak Day for Thefts, with About 30 a Day"
   - Archetype: Analytical Canvas, variant C (trend + profile + heatmap)
   - Visuals: monthly thefts column + MoM % line (combo); average daily thefts by weekday column; weekday × month heatmap matrix
   - Slicers: Region, Make Type
5. **About**: "How This Report Was Built: Power BI + Claude Code"
   - Archetype: Narrative Story
   - Visuals: three text panels: project overview & approach, key findings, data model & tech stack

## Design system summary
- Theme: custom dark theme "Case File Dark" based on base.json. Page #0B1220, panels #141E33, border #22304D, text #E8ECF4, muted text #9AA5BA
- Colour semantics: Total Thefts = amber #F5A524; rates (per 100K) = teal #2EC4B6; time trends / rolling avg = blue #5B8CFF; Luxury = coral #FF6B6B; neutral bars = slate #3A4A6B
- Typography: Segoe UI Semibold for headlines (24pt title, 10pt kicker); Segoe UI for body; Segoe UI Light 28pt for KPI values
- Layout: 1920×1080, 12×12 grid, 32px margin, 24px gutter, 8px snap; left nav rail (column 1) on every page
- Accessibility: all text pairs ≥ 4.5:1 on panel colour; alt text on every chart; colour never the only cue (labels on bars)

## Model requirements
- Existing measures used: Total Thefts, Average Daily Thefts, Peak Daily Thefts, Thefts per 100K Population, Luxury Theft %, Average Vehicle Age, Thefts 7-Day Rolling Average, Thefts MoM %, Population, % of Total Thefts, Region Theft Rank, Makes Stolen, Top Stolen Make, Top Stolen Vehicle Type, Top Stolen Color, Luxury Thefts, Weekend Theft %
- New measures: none
- New calculated columns: none
- Relationship/sort requirements: already in place (Day Name → Day of Week Number, Year Month → Year Month Number)

## Canonical design contract

```yaml
Design Brief:
  generated_by: powerbi-report-cli
  contract_version: 1
  mode: greenfield
  design_identity:
    tone: "Dark investigative case file: navy canvas, slate panels, single amber signal, dense but calm"
    signature: "Case-file header: amber kicker 'CASE FILE 0X · SECTION' above an insight headline with a 6px amber accent bar"
  archetype: Executive Summary
  navigation_model: page_navigator
  color_map:
    - measure: "Key Measures[Total Thefts]"
      color: "#F5A524"
      tint: "#3A2E14"
    - measure: "Key Measures[Thefts per 100K Population]"
      color: "#2EC4B6"
      tint: "#123A3A"
    - measure: "Key Measures[Thefts 7-Day Rolling Average]"
      color: "#5B8CFF"
      tint: "#1A2A4F"
    - measure: "Key Measures[Average Daily Thefts]"
      color: "#5B8CFF"
      tint: "#1A2A4F"
    - measure: "Key Measures[Thefts MoM %]"
      color: "#5B8CFF"
      tint: "#1A2A4F"
    - measure: "Key Measures[Luxury Theft %]"
      color: "#FF6B6B"
      tint: "#3D1E24"
  pages:
    - name: "Overview"
      role: landing
      archetype: Executive
      layout_variant: A
      variant_rationale: "A clear growth trend (464 to 1,053 per month) earns the hero spot, with KPIs above and rankings beside and below."
      navigation:
        - element: page_navigator
          action: PageNavigation
          label: "Overview / Where / What / When / About"
      page_background: "#0B1220"
      layout_summary: "Left nav rail; header with title and two slicers; 6-card KPI strip; hero daily trend with region ranking at right; vehicle type and monthly bars at the bottom."
      layout_contract:
        canvas: { width: 1920, height: 1080, margin: 32, gutter: 24, snap: 8 }
        grid:
          columns: 12
          rows: 12
          regions:
            rail:    [1, 1, 2, 13]
            header:  [2, 1, 9, 2]
            filters: [9, 1, 13, 2]
            kpis:    [2, 2, 13, 4]
            hero:    [2, 4, 9, 9]
            side:    [9, 4, 13, 9]
            bottom_left:  [2, 9, 7, 13]
            bottom_right: [7, 9, 13, 13]
        placements:
          - { id: page_navigator, region: rail, kind: pageNavigator, purpose: "Move between report pages", slot: 1, of: 2 }
          - { id: credit, region: rail, kind: textbox, text: "Built with Power BI + Claude Code · Data: NZ Police stolen vehicles, Oct 2021 – Apr 2022", slot: 2, of: 2 }
          - { id: page_title, region: header, kind: textbox, text: "CASE FILE 01 · OVERVIEW — 4,553 Vehicles Stolen in Six Months, and Monthly Thefts More Than Doubled" }
          - { id: region_slicer, region: filters, kind: slicer, field_bindings: "Location[Region]", slicer_type: dropdown, slot: 1, of: 2 }
          - { id: make_type_slicer, region: filters, kind: slicer, field_bindings: "Make[Make Type]", slicer_type: dropdown, slot: 2, of: 2 }
          - { id: kpi_total, region: kpis, kind: cardVisual, purpose: "How many vehicles were stolen?", field_bindings: "Key Measures[Total Thefts]", color_strategy: measure_match, slot: 1, of: 6 }
          - { id: kpi_daily, region: kpis, kind: cardVisual, purpose: "How many per day on average?", field_bindings: "Key Measures[Average Daily Thefts]", color_strategy: measure_match, slot: 2, of: 6 }
          - { id: kpi_peak, region: kpis, kind: cardVisual, purpose: "What was the worst single day?", field_bindings: "Key Measures[Peak Daily Thefts]", color_strategy: none, slot: 3, of: 6 }
          - { id: kpi_rate, region: kpis, kind: cardVisual, purpose: "How common is theft per person?", field_bindings: "Key Measures[Thefts per 100K Population]", color_strategy: measure_match, slot: 4, of: 6 }
          - { id: kpi_luxury, region: kpis, kind: cardVisual, purpose: "What share are luxury vehicles?", field_bindings: "Key Measures[Luxury Theft %]", color_strategy: measure_match, slot: 5, of: 6 }
          - { id: kpi_age, region: kpis, kind: cardVisual, purpose: "How old are stolen vehicles?", field_bindings: "Key Measures[Average Vehicle Age]", color_strategy: none, slot: 6, of: 6 }
          - { id: daily_trend, region: hero, kind: lineClusteredColumnComboChart, purpose: "Is daily theft volume rising?", field_bindings: { Category: "Date[Date]", ColumnY: "Key Measures[Total Thefts]", LineY: "Key Measures[Thefts 7-Day Rolling Average]" }, color_strategy: measure_match }
          - { id: region_rank, region: side, kind: barChart, purpose: "Which regions have the most thefts?", field_bindings: { Category: "Location[Region]", Y: "Key Measures[Total Thefts]" }, sort_policy: value_desc, color_strategy: measure_match }
          - { id: type_bar, region: bottom_left, kind: barChart, purpose: "Which vehicle types are stolen most?", field_bindings: { Category: "Vehicle[Vehicle Type]", Y: "Key Measures[Total Thefts]" }, sort_policy: value_desc, color_strategy: measure_match }
          - { id: monthly_column, region: bottom_right, kind: columnChart, purpose: "How did monthly volume change?", field_bindings: { Category: "Date[Year Month]", Y: "Key Measures[Total Thefts]" }, sort_policy: natural_order, color_strategy: measure_match }
        space_audit:
          content_cell_count: 121
          placed_cell_count: 121
          empty_cell_pct: 0
          unplaced_regions: []
          largest_region: { name: hero, pct_of_content: 29 }
          balance_rationale: "Hero trend carries the growth story; ranking and two supporting bars stay readable at 4-6 grid columns; the rail is a justified navigation rail."

    - name: "Where"
      role: detail
      archetype: Comparative
      layout_variant: B
      variant_rationale: "Volume and rate tell different stories (Auckland vs Gisborne), so two equal ranked bars sit side by side."
      navigation:
        - element: page_navigator
          action: PageNavigation
          label: "Overview / Where / What / When / About"
      page_background: "#0B1220"
      layout_summary: "Volume ranking vs per-capita ranking side by side, then population scatter and region table."
      layout_contract:
        canvas: { width: 1920, height: 1080, margin: 32, gutter: 24, snap: 8 }
        grid:
          columns: 12
          rows: 12
          regions:
            rail:    [1, 1, 2, 13]
            header:  [2, 1, 9, 2]
            filters: [9, 1, 13, 2]
            volume:  [2, 2, 7, 9]
            rate:    [7, 2, 13, 9]
            scatter: [2, 9, 7, 13]
            detail:  [7, 9, 13, 13]
        placements:
          - { id: page_navigator, region: rail, kind: pageNavigator, purpose: "Move between report pages", slot: 1, of: 2 }
          - { id: credit, region: rail, kind: textbox, text: "Built with Power BI + Claude Code · Data: NZ Police stolen vehicles, Oct 2021 – Apr 2022", slot: 2, of: 2 }
          - { id: page_title, region: header, kind: textbox, text: "CASE FILE 02 · WHERE — Auckland Has the Most Thefts, but Gisborne Has the Highest Rate at 338 per 100K" }
          - { id: make_type_slicer, region: filters, kind: slicer, field_bindings: "Make[Make Type]", slicer_type: dropdown, slot: 1, of: 2 }
          - { id: vehicle_type_slicer, region: filters, kind: slicer, field_bindings: "Vehicle[Vehicle Type]", slicer_type: dropdown, slot: 2, of: 2 }
          - { id: region_volume, region: volume, kind: barChart, purpose: "Which regions have the most thefts?", field_bindings: { Category: "Location[Region]", Y: "Key Measures[Total Thefts]" }, sort_policy: value_desc, color_strategy: measure_match }
          - { id: region_rate, region: rate, kind: barChart, purpose: "Which regions have the highest theft rate per person?", field_bindings: { Category: "Location[Region]", Y: "Key Measures[Thefts per 100K Population]" }, sort_policy: value_desc, color_strategy: measure_match, comparison_basis: "per 100K residents normalises for region size" }
          - { id: pop_scatter, region: scatter, kind: scatterChart, purpose: "Do bigger regions simply have more thefts?", field_bindings: { Details: "Location[Region]", X: "Key Measures[Population]", Y: "Key Measures[Total Thefts]", Size: "Key Measures[Thefts per 100K Population]" }, color_strategy: measure_match }
          - { id: region_table, region: detail, kind: tableEx, purpose: "Full regional comparison", field_bindings: ["Location[Region]", "Key Measures[Total Thefts]", "Key Measures[% of Total Thefts]", "Key Measures[Population]", "Key Measures[Thefts per 100K Population]", "Key Measures[Region Theft Rank]"], sort_policy: value_desc }
        space_audit:
          content_cell_count: 121
          placed_cell_count: 121
          empty_cell_pct: 0
          unplaced_regions: []
          largest_region: { name: rate, pct_of_content: 35 }
          balance_rationale: "Two near-equal rankings form the comparison; scatter and table add evidence underneath."

    - name: "What"
      role: detail
      archetype: Analytical
      layout_variant: A
      variant_rationale: "The make list is long (138), so a tall top-N ranking dominates, with compact breakdowns for type, colour and age."
      navigation:
        - element: page_navigator
          action: PageNavigation
          label: "Overview / Where / What / When / About"
      page_background: "#0B1220"
      layout_summary: "KPI strip of 'top' facts, tall top-makes ranking on the left, vehicle type, colour and model decade on the right."
      layout_contract:
        canvas: { width: 1920, height: 1080, margin: 32, gutter: 24, snap: 8 }
        grid:
          columns: 12
          rows: 12
          regions:
            rail:    [1, 1, 2, 13]
            header:  [2, 1, 9, 2]
            filters: [9, 1, 13, 2]
            kpis:    [2, 2, 13, 4]
            makes:   [2, 4, 7, 13]
            types:   [7, 4, 13, 8]
            colors:  [7, 8, 10, 13]
            decades: [10, 8, 13, 13]
        placements:
          - { id: page_navigator, region: rail, kind: pageNavigator, purpose: "Move between report pages", slot: 1, of: 2 }
          - { id: credit, region: rail, kind: textbox, text: "Built with Power BI + Claude Code · Data: NZ Police stolen vehicles, Oct 2021 – Apr 2022", slot: 2, of: 2 }
          - { id: page_title, region: header, kind: textbox, text: "CASE FILE 03 · WHAT — Toyota, Stationwagons and Silver Vehicles Top the Theft List" }
          - { id: region_slicer, region: filters, kind: slicer, field_bindings: "Location[Region]", slicer_type: dropdown, slot: 1, of: 2 }
          - { id: make_type_slicer, region: filters, kind: slicer, field_bindings: "Make[Make Type]", slicer_type: dropdown, slot: 2, of: 2 }
          - { id: kpi_top_make, region: kpis, kind: cardVisual, purpose: "Most stolen make", field_bindings: "Key Measures[Top Stolen Make]", color_strategy: none, insight_basis: "top-1 by thefts", slot: 1, of: 6 }
          - { id: kpi_top_type, region: kpis, kind: cardVisual, purpose: "Most stolen vehicle type", field_bindings: "Key Measures[Top Stolen Vehicle Type]", color_strategy: none, insight_basis: "top-1 by thefts", slot: 2, of: 6 }
          - { id: kpi_top_color, region: kpis, kind: cardVisual, purpose: "Most stolen colour", field_bindings: "Key Measures[Top Stolen Color]", color_strategy: none, insight_basis: "top-1 by thefts", slot: 3, of: 6 }
          - { id: kpi_makes, region: kpis, kind: cardVisual, purpose: "How many different makes were targeted?", field_bindings: "Key Measures[Makes Stolen]", color_strategy: none, slot: 4, of: 6 }
          - { id: kpi_luxury, region: kpis, kind: cardVisual, purpose: "How many luxury vehicles were stolen?", field_bindings: "Key Measures[Luxury Thefts]", color_strategy: measure_match, slot: 5, of: 6 }
          - { id: kpi_age, region: kpis, kind: cardVisual, purpose: "Average age of stolen vehicles", field_bindings: "Key Measures[Average Vehicle Age]", color_strategy: none, slot: 6, of: 6 }
          - { id: top_makes, region: makes, kind: barChart, purpose: "Which makes are stolen most? (top 15)", field_bindings: { Category: "Make[Make Name]", Y: "Key Measures[Total Thefts]" }, sort_policy: value_desc, color_strategy: measure_match }
          - { id: type_bar, region: types, kind: barChart, purpose: "Which vehicle types are stolen most? (top 10)", field_bindings: { Category: "Vehicle[Vehicle Type]", Y: "Key Measures[Total Thefts]" }, sort_policy: value_desc, color_strategy: measure_match }
          - { id: color_bar, region: colors, kind: barChart, purpose: "Which colours are stolen most?", field_bindings: { Category: "Vehicle[Color]", Y: "Key Measures[Total Thefts]" }, sort_policy: value_desc, color_strategy: measure_match }
          - { id: decade_column, region: decades, kind: columnChart, purpose: "How old are stolen vehicles by model decade?", field_bindings: { Category: "Vehicle[Model Decade]", Y: "Key Measures[Total Thefts]" }, sort_policy: category_asc, color_strategy: measure_match }
        space_audit:
          content_cell_count: 121
          placed_cell_count: 121
          empty_cell_pct: 0
          unplaced_regions: []
          largest_region: { name: makes, pct_of_content: 37 }
          balance_rationale: "Top-15 makes needs height for readable labels; three supporting breakdowns keep at least 3x4 cells each."

    - name: "When"
      role: detail
      archetype: Analytical
      layout_variant: C
      variant_rationale: "Time has two grains (month trend, weekday profile); a weekday × month heatmap joins them."
      navigation:
        - element: page_navigator
          action: PageNavigation
          label: "Overview / Where / What / When / About"
      page_background: "#0B1220"
      layout_summary: "Monthly volume with MoM % line and weekday profile on top; full-width weekday × month heatmap below."
      layout_contract:
        canvas: { width: 1920, height: 1080, margin: 32, gutter: 24, snap: 8 }
        grid:
          columns: 12
          rows: 12
          regions:
            rail:    [1, 1, 2, 13]
            header:  [2, 1, 9, 2]
            filters: [9, 1, 13, 2]
            trend:   [2, 2, 9, 7]
            weekday: [9, 2, 13, 7]
            heatmap: [2, 7, 13, 13]
        placements:
          - { id: page_navigator, region: rail, kind: pageNavigator, purpose: "Move between report pages", slot: 1, of: 2 }
          - { id: credit, region: rail, kind: textbox, text: "Built with Power BI + Claude Code · Data: NZ Police stolen vehicles, Oct 2021 – Apr 2022", slot: 2, of: 2 }
          - { id: page_title, region: header, kind: textbox, text: "CASE FILE 04 · WHEN — Mondays Are the Peak Day for Thefts, with About 30 a Day" }
          - { id: region_slicer, region: filters, kind: slicer, field_bindings: "Location[Region]", slicer_type: dropdown, slot: 1, of: 2 }
          - { id: make_type_slicer, region: filters, kind: slicer, field_bindings: "Make[Make Type]", slicer_type: dropdown, slot: 2, of: 2 }
          - { id: monthly_combo, region: trend, kind: lineClusteredColumnComboChart, purpose: "How did monthly thefts and growth rate change?", field_bindings: { Category: "Date[Year Month]", ColumnY: "Key Measures[Total Thefts]", LineY: "Key Measures[Thefts MoM %]" }, sort_policy: natural_order, color_strategy: measure_match, comparison_basis: "previous month" }
          - { id: weekday_column, region: weekday, kind: columnChart, purpose: "Which weekday has the most thefts per day?", field_bindings: { Category: "Date[Day Short]", Y: "Key Measures[Average Daily Thefts]" }, sort_policy: natural_order, color_strategy: measure_match }
          - { id: heatmap, region: heatmap, kind: pivotTable, purpose: "Where do weekday and month combine into hotspots?", field_bindings: { Rows: "Date[Day Name]", Columns: "Date[Year Month]", Values: "Key Measures[Total Thefts]" }, color_strategy: gradient }
        space_audit:
          content_cell_count: 121
          placed_cell_count: 121
          empty_cell_pct: 0
          unplaced_regions: []
          largest_region: { name: heatmap, pct_of_content: 55 }
          balance_rationale: "The heatmap is the page's hero (7 rows × 7 months of cells need width and height); the two charts above keep 4-7 columns each."

    - name: "About"
      role: detail
      archetype: Narrative
      layout_variant: A
      variant_rationale: "A portfolio piece needs a methods page explaining the model, DAX and AI-assisted workflow."
      navigation:
        - element: page_navigator
          action: PageNavigation
          label: "Overview / Where / What / When / About"
      page_background: "#0B1220"
      layout_summary: "Three text panels: overview & approach (left), key findings (top right), data model & tech stack (bottom right)."
      layout_contract:
        canvas: { width: 1920, height: 1080, margin: 32, gutter: 24, snap: 8 }
        grid:
          columns: 12
          rows: 12
          regions:
            rail:     [1, 1, 2, 13]
            header:   [2, 1, 13, 2]
            approach: [2, 2, 7, 13]
            findings: [7, 2, 13, 7]
            stack:    [7, 7, 13, 13]
        placements:
          - { id: page_navigator, region: rail, kind: pageNavigator, purpose: "Move between report pages", slot: 1, of: 2 }
          - { id: credit, region: rail, kind: textbox, text: "Built with Power BI + Claude Code · Data: NZ Police stolen vehicles, Oct 2021 – Apr 2022", slot: 2, of: 2 }
          - { id: page_title, region: header, kind: textbox, text: "CASE FILE 05 · ABOUT — How This Report Was Built with Power BI and Claude Code" }
          - { id: approach_text, region: approach, kind: textbox, text: "Project overview: goal, dataset (4,553 thefts, 16 regions, 138 makes), and a step-by-step approach: CSV ingestion in Power Query, star schema design, 28 DAX measures, model optimisation, report design. All done with Claude Code driving Power BI through the Power BI Modeling MCP server.", insight_basis: "methods narrative" }
          - { id: findings_text, region: findings, kind: textbox, text: "Key findings: (1) monthly thefts rose from 464 (Oct 2021) to 1,053 (Mar 2022); (2) Auckland has 36% of thefts but Gisborne has the highest rate at 338 per 100K; (3) only 4.2% are luxury makes: Toyota, stationwagons and silver vehicles lead; (4) Monday is the peak day at about 30 thefts.", insight_basis: "summary of pages 1-4" }
          - { id: stack_text, region: stack, kind: textbox, text: "Data model & tech stack: Thefts fact table; Vehicle, Make, Location, Date dimensions; one-to-many single-direction relationships; dedicated Key Measures table with 6 display folders; auto date/time off, implicit measures off, hidden keys. Tools: Power BI Desktop, Power Query (M), DAX, PBIP/PBIR, Claude Code.", insight_basis: "technical credibility" }
        space_audit:
          content_cell_count: 121
          placed_cell_count: 121
          empty_cell_pct: 0
          unplaced_regions: []
          largest_region: { name: approach, pct_of_content: 45 }
          balance_rationale: "Narrative page: the approach panel is the main read; findings and stack panels split the right half."
  interaction_pattern:
    drill_targets: []
    cross_filter_rules: "Filter between charts on the same page; slicers filter all visuals on their page only"
  accessibility:
    alt_text_strategy: "headline+trend: each chart's alt text states its question and main finding"
    contrast_notes: "Text #E8ECF4 and muted #9AA5BA on panel #141E33 both pass AA; amber #F5A524 is only used for marks and kickers, never small body text on light backgrounds"
  theme:
    base: "references/design/assets/base.json adapted into the 'Case File Dark' theme"
    user_overrides: "none (no existing brand)"
```

## Implementation notes
- Model changes: none planned. **Before building, save in Power BI Desktop (Ctrl+S)** so the new model is written to the PBIP folder, then close Desktop while the report files are generated.
- PBIR/report authoring: write the theme, 5 pages and their visuals into `AI Car Theft Analytics.Report/definition/`.
- Tooling: the recommended `powerbi-report-author` CLI (schema lookups, validation, Desktop reload and screenshots) needs **Node.js**, which isn't installed. Option A: you install Node.js LTS, then I install the CLI with `npm install -g @microsoft/powerbi-report-authoring-cli@latest`. Option B: I generate the PBIR JSON directly with Python (JSON check only), and you reopen the `.pbip` in Desktop so we can fix anything it flags.
- Validation: JSON parse + expected page/visual counts; Desktop opens the `.pbip` without errors.
- Desktop screenshot verification: automated with Option A; with Option B you open Desktop and I review what you report or screenshot.
- Publishing boundary: local only.
- Risks: page navigator and new card visual formatting vary by Desktop version; dark-theme charts need explicit axis and gridline colours.
