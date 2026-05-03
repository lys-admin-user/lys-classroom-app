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
| `exemplar_math_6.txt` | Jennifer Pluma — Converting Fractions/Decimals to Percentages (Unit 1, Day 1) | Distinguished-grade Math exemplar; gold standard for Lesson-Close depth (quote + real-life Financial reflection) |
| `exemplar_ela_8.txt` | Shannon W. — Arguments in Writing (Unit 04) | Distinguished-grade ELA exemplar — argumentation/persuasion topics |
| `exemplar_ela_8_literature.txt` | Shannon W. — Establishing Purpose with Langston Hughes (Unit 05) | Distinguished-grade ELA exemplar — literature/fiction/poetry topics |
| `exemplar_ela_6.txt` | Skylar Hurst — Supporting opinion with evidence | Distinguished-grade ELA exemplar |
| `exemplar_social_studies_7.txt` | Ed O'Connell — April weekly plan | Distinguished-grade Social Studies exemplar |

## How they're used

`server/lysReference.ts` loads these at module import, distills the structure,
and exposes:

- `buildLysCanonPromptBlock(subject, gradeLevel, topic?)` — for the lesson generator. The optional `topic` enables topic-aware exemplar matching (e.g. Grade 8 ELA: literature topics route to the Langston Hughes exemplar; argument topics route to the Arguments in Writing exemplar).
- `LYS_ACCOMMODATIONS` — for the assignment generator
- `LYS_BKD_VOCAB` — Be/Know/Do trait vocabulary for both generators

When you upload new exemplars, add them here and update the lookup map in
`lysReference.ts`. After editing any `.txt` file, regenerate the embedded
module so the version hash bumps and the lesson cache invalidates:

```
node scripts/regen_lys_embedded.mjs
```
