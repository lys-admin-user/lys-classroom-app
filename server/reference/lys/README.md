# LYS Reference Corpus

Plain-text reference materials distilled from real LYS-aligned teacher
artifacts (uploaded as zip files in `attached_assets/`). These files are read
by `server/lysReference.ts` and injected into the lesson- and
assignment-generator system prompts so AI output mirrors the structure, voice,
and pedagogical patterns of teachers already using LYS.

## Sources

| File | Source | Purpose |
|---|---|---|
| `cheat_sheet.txt` | LaToya Washington (6/7 Science) | Be/Know/Do philosophy + trait vocabulary across 7 life domains |
| `rubric.txt` | LaToya Washington (6/7 Science) | LYS Lesson Plan Rubric — 4 levels (Need Improvement / Acceptable / Accomplished / Distinguished) across 6 categories |
| `template.txt` | Ed O'Connell (7 Social Studies / 8 Science) | Canonical LYS lesson plan structure |
| `assignment_form.txt` | Skylar Hurst (6/7 ELA) | Student-facing assignment template + accommodation/modification matrix |
| `exemplar_science_7.txt` | LaToya Washington — 7.11A Dichotomous Keys | Distinguished-grade Science exemplar |
| `exemplar_ela_8.txt` | Shannon W. — Arguments in Writing | Distinguished-grade ELA exemplar |
| `exemplar_ela_6.txt` | Skylar Hurst — Supporting opinion with evidence | Distinguished-grade ELA exemplar |
| `exemplar_social_studies_7.txt` | Ed O'Connell — April weekly plan | Distinguished-grade Social Studies exemplar |

## How they're used

`server/lysReference.ts` loads these at module import, distills the structure,
and exposes:

- `buildLysCanonPromptBlock(subject, gradeLevel)` — for the lesson generator
- `LYS_ACCOMMODATIONS` — for the assignment generator
- `LYS_BKD_VOCAB` — Be/Know/Do trait vocabulary for both generators

When you upload new exemplars, add them here and update the lookup map in
`lysReference.ts`.
