import { RSBMEngine } from '@/lib/rsbm/reciprocalMatcher'

describe('RSBMEngine basic', () => {
  test('generateFeed returns expected shape with defaults', async () => {
    const engine = new RSBMEngine()

    const preferences = {
      userId: 'test-user',
      ageMin: 18,
      ageMax: 99,
      maxDistance: 500,
      gender: 'any',
      dealbreakers: {}
    }

    const context = {
      userId: 'test-user',
      currentLocation: { lat: 0, lon: 0 },
      timeOfDay: 'day',
      dayOfWeek: 'monday',
      sessionContext: { swipesThisSession: 0, likesThisSession: 0, timeSpent: 0 }
    }

    const feed = await engine.generateFeed('test-user', preferences, context, 5)

    expect(feed).toBeDefined()
    expect(feed).toHaveProperty('mostCompatible')
    expect(feed).toHaveProperty('mainFeed')
    expect(feed).toHaveProperty('explorationCandidates')
    expect(Array.isArray(feed.mainFeed)).toBe(true)
    expect(Array.isArray(feed.explorationCandidates)).toBe(true)
  })
})
