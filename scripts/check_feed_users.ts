import { prisma } from "../lib/prisma";
import { RSBMEngine } from "../lib/rsbm/reciprocalMatcher";
import { getCache } from "../lib/cache/redisCache";

async function main() {
  const emails = ["nihaalpatnaik12@gmail.com", "aashna@gmail.com"];
  const engine = new RSBMEngine();
  const cache = getCache();

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, photos: true }
    });

    console.log("\\n--- User:", email, "---");
    if (!user) {
      console.log("User not found in DB:", email);
      continue;
    }

    console.log("id:", user.id);
    console.log("profile.gender:", user.profile?.gender ?? "null");
    console.log("profile exists:", !!user.profile);
    console.log("photos:", (user.photos || []).map(p => p.url));

    // Inspect existing cached feed (may connect to local Redis)
    try {
      const cached = await cache.getFeedCandidates(user.id);
      console.log("cached feed (before):", cached);
    } catch (e) {
      console.warn("cache.getFeedCandidates failed:", String(e));
    }

    // Generate RSBM feed server-side (uses same engine as API)
    try {
      const prefs: any = {
        userId: user.id,
        ageMin: 18,
        ageMax: 99,
        maxDistance: 500,
        gender: "any",
        dealbreakers: {}
      };
      const context: any = {
        userId: user.id,
        currentLocation: { lat: 0, lon: 0 },
        timeOfDay: "day",
        dayOfWeek: "monday",
        sessionContext: { swipesThisSession: 0, likesThisSession: 0, timeSpent: 0 }
      };

      const feed = await engine.generateFeed(user.id, prefs, context, 10);
      console.log("RSBM mostCompatible:", feed.mostCompatible?.candidateId ?? null);
      console.log("RSBM mainFeed ids:", feed.mainFeed.map(f => f.candidateId));
      console.log("RSBM exploration ids:", feed.explorationCandidates.map(f => f.candidateId));

      // Prime cache with these candidates (so API & UI will use cached list)
      const toCache = (feed.mainFeed || []).concat(feed.explorationCandidates || []).map((c: any) => ({
        id: c.candidateId || c.userId || c.id,
        score: c.reciprocalScore || 0
      }));
      if (toCache.length > 0) {
        await cache.cacheFeedCandidates(user.id, toCache);
        const cachedAfter = await cache.getFeedCandidates(user.id);
        console.log("cached feed (after):", cachedAfter);
      } else {
        console.log("No candidates to cache for user:", email);
      }
    } catch (e) {
      console.error("RSBM feed generation failed:", String(e));
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
