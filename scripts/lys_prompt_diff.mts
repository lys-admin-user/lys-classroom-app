import { writeFileSync } from 'fs';
import { buildLysCanonPromptBlock, LYS_REF_VERSION } from '../server/lysReference';

const req = {
  topic: 'Photosynthesis',
  course: 'Science 7',
  unit: 'Organisms and Environments',
  gradeLevel: '7',
  bkdFocus: 'know' as const,
  duration: '60 minutes',
};
const bkdDescriptions = {
  be: 'Character, values, and identity development',
  know: 'Resources, knowledge, and how to access them',
  do: 'Action steps, skills, and execution with excellence',
};

const beforeUser = `Create a complete lesson plan with these specifications:
- Topic: ${req.topic}
- Course: ${req.course}
- Unit: ${req.unit}
- Grade Level: ${req.gradeLevel}
- Primary Focus: ${req.bkdFocus.toUpperCase()} (${bkdDescriptions[req.bkdFocus]})
- Duration: ${req.duration}
Standards system: Texas TEKS (United States — Science).

[no LYS canonical reference block]
[no master-lesson examples on file for Science 7]

Generate a complete LYS lesson plan in JSON format. Include:
1. A compelling title
2. 2-3 essential questions that tie to real-world application
3. LYS Methodology section with specific BE/KNOW/DO applications for this lesson
4. Clear learning objectives aligned to the standards
5. Instructional phases: Anticipatory Set, Modeling (I Do), Guided Practice (We Do), Independent Practice
6. Resources with URLs where applicable
7. Materials list
8. Assessment strategy
9. Lesson Close with life application connections (educational, social, vocational, financial, spiritual as relevant)

[…JSON schema follows…]`;

const lysCanon = buildLysCanonPromptBlock(req.course, req.gradeLevel);

const afterUser = `Create a complete lesson plan with these specifications:
- Topic: ${req.topic}
- Course: ${req.course}
- Unit: ${req.unit}
- Grade Level: ${req.gradeLevel}
- Primary Focus: ${req.bkdFocus.toUpperCase()} (${bkdDescriptions[req.bkdFocus]})
- Duration: ${req.duration}
Standards system: Texas TEKS (United States — Science).

${lysCanon}
[no master-lesson examples on file for Science 7]

Generate a complete LYS lesson plan in JSON format. Include:
1. A compelling title
2. 2-3 essential questions that tie to real-world application
3. LYS Methodology section with specific BE/KNOW/DO applications for this lesson
4. Clear learning objectives aligned to the standards
5. Instructional phases: Anticipatory Set, Modeling (I Do), Guided Practice (We Do), Independent Practice
6. Resources with URLs where applicable
7. Materials list
8. Assessment strategy
9. Lesson Close with life application connections to ALL SEVEN dimensions (educational, social, cultural, financial, health, vocational, spiritual) — none are optional

[…JSON schema follows…]`;

writeFileSync('attached_assets/lys_demo/prompt_BEFORE.txt', beforeUser);
writeFileSync('attached_assets/lys_demo/prompt_AFTER.txt', afterUser);

const summary = `LYS PROMPT INTEGRATION — BEFORE vs AFTER
==========================================
Sample request: ${req.topic} (${req.course}, Grade ${req.gradeLevel}, ${req.duration}, BKD focus = ${req.bkdFocus})
LYS reference corpus version: ${LYS_REF_VERSION}

BEFORE prompt size: ${beforeUser.length} chars
AFTER  prompt size: ${afterUser.length} chars
Net added by LYS canon: ${afterUser.length - beforeUser.length} chars (~${Math.round((afterUser.length - beforeUser.length)/4)} tokens)

What's NEW in the AFTER prompt (literal additions the model now sees):
1. A real LaToya Washington Distinguished-rated lesson exemplar (7.11A Dichotomous Keys) — trimmed to ~3.5KB — showing the exact structural pattern, BKD tagline phrasing, and 7-domain Lesson Close voice the model should mirror.
2. The Be/Know/Do trait/strategy/action vocabulary (e.g., "Curiosity, Resilience, Humility…", "Asking for help, Self-advocacy…", "Skill development, Independence…").
3. The explicit Async vs Sync split with AS/M/GP definitions.
4. All 7 life domains pinned as MANDATORY for the Lesson Close (was "as relevant").
5. Voice rules: warm, second-person, real-life tie-back, name the trait/action/next-step.

See:
  attached_assets/lys_demo/prompt_BEFORE.txt — what the model used to see
  attached_assets/lys_demo/prompt_AFTER.txt  — what the model sees now
`;

writeFileSync('attached_assets/lys_demo/SUMMARY.txt', summary);
console.log(summary);
