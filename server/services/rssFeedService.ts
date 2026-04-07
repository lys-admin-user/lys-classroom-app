import Parser from "rss-parser";
import { storage } from "../storage";
import type { InsertRssContentItem, RssPlacement, RssBkdPillar, RssFeed } from "@shared/schema";

const parser = new Parser({
  customFields: {
    item: [
      ["itunes:summary", "itunesSummary"],
      ["itunes:duration", "itunesDuration"],
      ["itunes:image", "itunesImage"],
      ["itunes:keywords", "itunesKeywords"],
    ],
  },
});

const BE_KEYWORDS = [
  "identity", "purpose", "self-discovery", "character", "values", "mindset",
  "confidence", "self-awareness", "growth mindset", "emotional intelligence",
  "resilience", "motivation", "belonging", "reflection", "self-esteem",
  "personal development", "who am i", "strengths", "personality",
];

const KNOW_KEYWORDS = [
  "career", "strategy", "skills", "knowledge", "certification", "training",
  "industry", "profession", "college", "university", "scholarship", "degree",
  "trade", "apprenticeship", "financial literacy", "resume", "interview",
  "workplace", "salary", "job market", "stem", "healthcare", "technology",
  "business", "entrepreneurship", "planning", "resources", "learning",
];

const DO_KEYWORDS = [
  "action", "project", "portfolio", "goal setting", "achievement",
  "internship", "volunteer", "community service", "competition",
  "hands-on", "practical", "build", "create", "implement", "apply",
  "capstone", "service learning", "extracurricular", "club", "activity",
];

const CAREER_KEYWORDS: Record<string, string[]> = {
  "Technology": ["technology", "tech", "coding", "programming", "software", "ai", "cybersecurity", "data", "cloud", "robotics", "computer"],
  "Healthcare": ["healthcare", "health", "nursing", "medical", "dental", "mental health", "therapy", "patient care", "clinical"],
  "Business": ["business", "marketing", "finance", "management", "accounting", "entrepreneurship", "startup", "economics"],
  "STEM": ["stem", "science", "engineering", "math", "research", "laboratory", "physics", "chemistry", "biology"],
  "Skilled Trades": ["trades", "plumbing", "hvac", "welding", "electrical", "construction", "automotive", "diesel", "mechanic"],
  "Creative Arts": ["art", "design", "creative", "music", "film", "photography", "graphic design", "ux", "animation"],
  "Education": ["education", "teaching", "teacher", "classroom", "curriculum", "pedagogy", "instruction", "tutoring"],
  "Public Safety": ["public safety", "firefighter", "emt", "paramedic", "law enforcement", "emergency"],
};

const LESSON_KEYWORDS = [
  "lesson", "teaching", "curriculum", "classroom", "instruction",
  "pedagogy", "education", "learning objectives", "assessment",
  "standards", "differentiation", "engagement", "rubric",
  "scope and sequence", "unit plan", "instructional",
];

const MENTOR_KEYWORDS = [
  "mentor", "mentorship", "career guidance", "professional development",
  "networking", "industry expert", "career path", "role model",
  "advice", "coaching", "career exploration",
];

function analyzeContent(title: string, description: string, categories: string[]): {
  placements: RssPlacement[];
  bkdPillar: RssBkdPillar;
  careerFields: string[];
  tags: string[];
} {
  const text = `${title} ${description} ${categories.join(" ")}`.toLowerCase();

  const scores = {
    be: BE_KEYWORDS.filter(k => text.includes(k)).length,
    know: KNOW_KEYWORDS.filter(k => text.includes(k)).length,
    do: DO_KEYWORDS.filter(k => text.includes(k)).length,
  };

  const bkdPillar: RssBkdPillar = scores.be >= scores.know && scores.be >= scores.do ? "be"
    : scores.know >= scores.do ? "know" : "do";

  const placements: RssPlacement[] = [];

  if (KNOW_KEYWORDS.some(k => text.includes(k)) || scores.know > 0) {
    placements.push("know_resource");
  }
  if (LESSON_KEYWORDS.some(k => text.includes(k))) {
    placements.push("ai_lesson");
  }
  if (BE_KEYWORDS.some(k => text.includes(k)) || DO_KEYWORDS.some(k => text.includes(k))) {
    placements.push("featured");
  }
  if (MENTOR_KEYWORDS.some(k => text.includes(k)) || CAREER_KEYWORDS["Technology"].some(k => text.includes(k))) {
    placements.push("mentor_connect");
  }

  if (placements.length === 0) {
    placements.push("know_resource");
  }

  const careerFields: string[] = [];
  for (const [field, keywords] of Object.entries(CAREER_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) {
      careerFields.push(field);
    }
  }

  const tags = categories.filter(c => c.length > 0);

  return { placements, bkdPillar, careerFields, tags };
}

export async function fetchAndProcessFeed(feed: RssFeed): Promise<{ newItems: number; errors: string[] }> {
  const errors: string[] = [];
  let newItems = 0;

  try {
    const parsed = await parser.parseURL(feed.url);

    for (const item of parsed.items) {
      const guid = item.guid || item.link || item.title || "";
      if (!guid) continue;

      const existing = await storage.getRssContentItemByGuid(feed.id, guid);
      if (existing) continue;

      const categories = (item.categories || []).map(c => typeof c === "string" ? c : (c as any)._ || "");
      const description = item.contentSnippet || item.content || (item as any).itunesSummary || item.summary || "";
      const title = item.title || "Untitled";

      const analysis = analyzeContent(title, description, categories);

      const audioUrl = item.enclosure?.url && item.enclosure?.type?.startsWith("audio")
        ? item.enclosure.url
        : undefined;

      const imageUrl = (item as any).itunesImage?.href || parsed.image?.url || feed.imageUrl || undefined;

      const contentItem: InsertRssContentItem = {
        feedId: feed.id,
        guid,
        title,
        description: description.substring(0, 2000),
        contentUrl: item.link || undefined,
        imageUrl,
        audioUrl,
        author: item.creator || (item as any).author || parsed.title || undefined,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        rawMetadata: {
          categories: categories as any,
          enclosure: item.enclosure as any,
          itunesDuration: (item as any).itunesDuration,
          itunesKeywords: (item as any).itunesKeywords,
        } as Record<string, any>,
        suggestedPlacements: analysis.placements,
        status: "pending",
        aiUsageType: "supplemental",
        bkdPillar: analysis.bkdPillar,
        careerFields: analysis.careerFields,
        tags: analysis.tags,
      };

      try {
        await storage.createRssContentItem(contentItem);
        newItems++;
      } catch (err: any) {
        errors.push(`Failed to save item "${title}": ${err.message}`);
      }
    }

    await storage.updateRssFeed(feed.id, {
      lastFetchedAt: new Date(),
      itemCount: (feed.itemCount || 0) + newItems,
    });
  } catch (err: any) {
    errors.push(`Failed to fetch feed "${feed.name}": ${err.message}`);
  }

  return { newItems, errors };
}

export async function fetchAllActiveFeeds(): Promise<{ totalNew: number; feedResults: { feedName: string; newItems: number; errors: string[] }[] }> {
  const feeds = await storage.getRssFeeds();
  const activeFeeds = feeds.filter(f => f.isActive);
  let totalNew = 0;
  const feedResults: { feedName: string; newItems: number; errors: string[] }[] = [];

  for (const feed of activeFeeds) {
    const result = await fetchAndProcessFeed(feed);
    totalNew += result.newItems;
    feedResults.push({ feedName: feed.name, ...result });
  }

  return { totalNew, feedResults };
}

let fetchInterval: NodeJS.Timeout | null = null;

export function startRssFeedScheduler(intervalMinutes: number = 60) {
  if (fetchInterval) clearInterval(fetchInterval);
  console.log(`Starting RSS feed scheduler (every ${intervalMinutes} minutes)`);
  fetchInterval = setInterval(async () => {
    try {
      const result = await fetchAllActiveFeeds();
      if (result.totalNew > 0) {
        console.log(`RSS feed sync: ${result.totalNew} new items ingested`);
      }
    } catch (err) {
      console.error("RSS feed scheduler error:", err);
    }
  }, intervalMinutes * 60 * 1000);
}

export function stopRssFeedScheduler() {
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
  }
}
