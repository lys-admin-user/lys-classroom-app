import { db } from "./db";
import { foundationModules } from "@shared/schema";
import { sql } from "drizzle-orm";

const SEED_MODULES = [
  {
    slug: "mission",
    order: 1,
    title: "The Mission",
    subtitle: "Why we exist beyond profit",
    contentType: "text" as const,
    videoUrl: null,
    body: `At LYS, our mission is to provide a clear pathway for students to achieve success. We do this by empowering them to move from potential to prosperity using our core method: **Being, Knowing, Doing**. This isn't just a sales pitch; it's the foundation of everything we build, from our products to our relationships.

## 1. BE: Who You Are
Before anyone can succeed, they must first understand their own worth. Being is about helping students find their purpose, recognize their unique strengths, and build unshakeable confidence.

- What top 3 experiences have had the most impact on my life?
- When I wake up in the morning, what is the *why* that drives me the most?
- What do I cherish the most?
- What are my top 3 values?

## 2. KNOW: What You Need
Once a person knows who they are, they need the right tools to achieve their goals. Knowing is about providing students with the essential knowledge, practical skills, and resources needed for their journey.

- What are my top 3 skills?
- What are my top 3 areas of interest/knowledge?
- How can I develop them?
- Who do I know that can help me?
- Where else can I go to find support?

## 3. DO: Take Action
Dreams become reality through action. Doing is where we empower students to turn their "Being" and "Knowing" into tangible progress. It's about building relationships, habits, achieving goals, and making a real-world impact.

- What can I do today to improve my skills and knowledge?
- How can I do that every day for 5 minutes?
- What impact will it have on my life? Family? Community?
- Today I am _______________`,
    quizJson: [],
  },
  {
    slug: "vision",
    order: 2,
    title: "The Vision",
    subtitle: "A 21st-century definition of education",
    contentType: "text" as const,
    videoUrl: null,
    body: `When we think of education, we often associate it with formal institutions. It's time to shift our focus to a more modern view. Below are five components of a contemporary definition of education — what we believe education must *be* in the 21st century.

## #1 — Transformational Education Lasts a Lifetime
> "Education is not preparation for life; education is life itself." — John Dewey

At the heart of education are relationships. Learning doesn't stop with formal education. The absence of diverse and dynamic mentoring solutions is the same as learning on our own. We measure growth toward the goal of a fruitful career.

## #2 — Teachers are Mentors, But They Shouldn't Be a Child's Only Mentor
> "When the student is ready, the teacher will appear." — attributed to Buddha

Continuous, hyper-individualized mentorship is finally technologically achievable. The conscious learner has three veracities the reactive learner lacks: **Character, Values, and Principles**. Character is knowing what makes you valuable. Values shape your journey toward self-actualization. Principles ground you in times of uncertainty.

## #3 — Change Is the Only Constant
> "The only true wisdom is in knowing you know nothing." — Socrates

The average adult receives over 5,000 marketing messages a day. Knowing what to filter — what is true, what the facts are, where they can take you — is now the core skill. We marry formal schooling with custom-tailored mentoring to teach this discernment.

## #4 — Horton Hears a Who, But Should Have Been Listening for a How
> "I did then what I knew how to do. Now that I know better, I do better." — Maya Angelou

Roughly 50% of college graduates work outside their field of study. Maximizing "the how" happens when we identify with a deeper sense of intention and an infinite sense of possibility — not just following directions.

## #5 — A Quality Education Prepares Students for a Cold World
> "The goal of education is to enable individuals to continue their education." — John Dewey

Lifelong success takes individual planning — responding strategically, well in advance of pitfalls. Our core conviction: **poverty doesn't hamper educational attainment; it robs us of the belief that our actions make a difference.** Our job is to give that belief back.`,
    quizJson: [],
  },
  {
    slug: "values",
    order: 3,
    title: "Our Values",
    subtitle: "Being, Knowing, Doing — values in action",
    contentType: "quiz" as const,
    videoUrl: null,
    body: `Being, Knowing, and Doing operate across **seven key domains**: education, cultural, health, financial, spiritual, vocational, and social. These domains are immutable — they provide individual and societal structure.

If we empower the student in their being, knowing, and doing, we create lifelong learners who help us forge a more productive society.

Use the reflection below as your own internal worksheet, then take the short quiz to lock in the methodology.

### BE — Reflect
- What top 3 experiences have most shaped your life?
- What is the *why* that drives you in the morning?
- What do you cherish the most?
- What are your top 3 values?

### KNOW — Reflect
- What are your top 3 skills?
- What are your top 3 areas of interest/knowledge?
- Who do you know that can help you grow them?

### DO — Reflect
- What can you do *today* to improve your skills and knowledge?
- How can you do that every day for 5 minutes?
- What impact will it have on your life, family, and community?

When you're ready, take the quiz below.`,
    quizJson: [
      {
        question: "In the LYS Being / Knowing / Doing methodology, BE refers to…",
        options: [
          "What we do every day at our desks",
          "Who you are: your purpose, strengths, values, and confidence",
          "The technical tools and resources you have access to",
          "How quickly you complete your tasks",
        ],
        correctIndex: 1,
        explanation: "BE is foundational — it's about understanding who you are before you decide what to do.",
      },
      {
        question: "A teammate says they feel stuck and don't know what to do next. Through a BKD lens, what do you help them clarify FIRST?",
        options: [
          "Their next three action steps",
          "Which tools and resources to deploy",
          "Their values and what truly matters to them (Be)",
          "Their manager's priorities for the week",
        ],
        correctIndex: 2,
        explanation: "Action without clarity of purpose tends to drift. Start with Be, then move to Know, then Do.",
      },
      {
        question: "Drawing on Educational Component #2, the LYS team helps students move from…",
        options: [
          "Reacting to setbacks → responding strategically",
          "Listening → speaking",
          "Group work → independent work",
          "Theory → memorization",
        ],
        correctIndex: 0,
        explanation: "School trains students to react. Life requires responding strategically. We bridge the two.",
      },
      {
        question: "Being, Knowing, and Doing operate across how many key domains?",
        options: ["Three", "Five", "Seven", "Twelve"],
        correctIndex: 2,
        explanation: "Seven: education, cultural, health, financial, spiritual, vocational, and social.",
      },
    ],
  },
  {
    slug: "brand",
    order: 4,
    title: "The Brand",
    subtitle: "How we look and speak",
    contentType: "text" as const,
    videoUrl: null,
    body: `*This module is a starting placeholder — HR can replace this copy in the Admin Foundation page.*

## Logo
The LYS wordmark uses our hand-drawn marker style. The "L" and "S" are bold marker strokes; the three horizontal bars between them represent the **rungs of the ladder** — the steps from potential to prosperity.

## Color Palette
- **LYS Teal** — primary surface and footer color. Calm, trustworthy, professional.
- **LYS Yellow** — accent and highlight. Optimism, attention, energy.
- **LYS Red** — emphasis and call-to-action. Urgency and conviction.

## Typography
- **Permanent Marker** — for the wordmark and rare hero moments only.
- **Oswald** — for headings. Strong, clean, modern.
- **Roboto** — for all body copy. Readable at any size.

## Voice
We speak the way a great mentor speaks: warm, direct, never condescending. We use everyday language for everyday people. We don't hide behind jargon. When we praise, we praise the work — not the person.`,
    quizJson: [],
  },
  {
    slug: "strategy",
    order: 5,
    title: "The Strategy",
    subtitle: "Discover, Develop, Deploy — our North Star",
    contentType: "text" as const,
    videoUrl: null,
    body: `## Discover, Develop, Deploy
The first step to a life is a relationship. Every life begins when two life forces meet — we typically call them our parents.

Parents create at least three distinct environments: the **paternal**, the **maternal**, and the **combined**. Once a child is born, they find themselves in the culmination of these environments and the pull and tug between them. The environment they are most intrinsically attracted to is the one that draws them the most. **This is where they begin to discover themselves.**

If a child has strong intrinsic motivation, a nurturing environment, and the willingness to stretch — they will hear the clarion call to personal, actualized success.

> Discovering *being* helps students discover their authentic character, clarify their values, and establish guiding principles to find meaning, purpose, and passion in everything they do.

## Key Development Areas

**Educational Foundation** — competency and independence; curiosity and lifelong learning; purpose-driven scholarship.

**Spiritual Growth** — wisdom and trust; hope and aspiration; identity and resilience; humility and creativity.

**Social Connection** — empathy and understanding; openness and fulfillment; unity and family bonds; trust and connectedness.

**Vocational Identity** — work ethic and pride; drive and resourcefulness; reliability and dedication; integrity and professionalism.

**Cultural Awareness** — patriotism balanced with openness; understanding of diverse perspectives; community engagement.

**Health & Wellness** — self-care and sacrifice balance; moderation and assertiveness; physical and mental well-being.

**Financial Wisdom** — thriftiness and resourcefulness; generosity and adaptability; long-term thinking.

## Five Ways to Help a Person Discover Their Being
1. **Meditation** — quiet time to listen inward
2. **Reflection** — structured looking-back
3. **Coaching** — a trained outside voice
4. **Modeling** — watching someone live it
5. **Visualization** — seeing the future before it arrives`,
    quizJson: [],
  },
  {
    slug: "goals",
    order: 6,
    title: "The Goals",
    subtitle: "Quarterly OKRs (coming soon)",
    contentType: "okr" as const,
    videoUrl: null,
    body: `*This module is a placeholder. HR will populate quarterly OKRs and KPIs here.*

## How we'll use this space
- **Objectives** — the 2 or 3 things we're trying to accomplish this quarter (qualitative, inspiring).
- **Key Results** — the 2 to 4 measurable outcomes that prove we hit the objective.
- **KPIs** — the steady-state numbers we watch every week.

## What you'll see here next quarter
- Top-line objectives for the company.
- Each team's contribution to those objectives.
- A live read of where we stand.

For now, focus on Modules 1–5. The Goals module will be filled in once leadership finalizes this quarter's OKRs.`,
    quizJson: [],
  },
];

/**
 * Idempotent seed: inserts the 6 Foundation modules if they don't exist yet.
 * Existing rows are left alone so HR edits in the admin page are never overwritten.
 */
export async function seedFoundationModules(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (const m of SEED_MODULES) {
    const result = await db
      .insert(foundationModules)
      .values({
        slug: m.slug,
        order: m.order,
        title: m.title,
        subtitle: m.subtitle,
        contentType: m.contentType,
        body: m.body,
        videoUrl: m.videoUrl,
        quizJson: m.quizJson,
        isPublished: true,
      })
      .onConflictDoNothing({ target: foundationModules.slug })
      .returning({ id: foundationModules.id });
    if (result.length > 0) inserted += 1;
    else skipped += 1;
  }
  return { inserted, skipped };
}

/** Used by the admin "Reset to defaults" button — wipes and reseeds. Destructive. */
export async function resetFoundationToDefaults(): Promise<void> {
  await db.execute(sql`DELETE FROM foundation_modules`);
  for (const m of SEED_MODULES) {
    await db.insert(foundationModules).values({
      slug: m.slug,
      order: m.order,
      title: m.title,
      subtitle: m.subtitle,
      contentType: m.contentType,
      body: m.body,
      videoUrl: m.videoUrl,
      quizJson: m.quizJson,
      isPublished: true,
    });
  }
}
