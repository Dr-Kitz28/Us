import { ResearchBackedMatcher } from '@/app/api/enhanced-recommendations/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/cache/redisCache', () => ({
  getCache: jest.fn()
}))

describe('Enhanced recommendations', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('returns recommendations from cache when available', async () => {
    const { getCache } = require('@/lib/cache/redisCache')
    const fakeCache = {
      getFeedCandidates: jest.fn().mockResolvedValue(['cand-1', 'cand-2']),
    }
    getCache.mockImplementation(() => fakeCache)

    // mock prisma current user lookup
    jest.spyOn(prisma.user, 'findUnique' as any).mockImplementation(async (opts: any) => {
      if (opts.where?.email === 'me@example.com') return { id: 'me-id', email: 'me@example.com', profile: {} }
      return null
    })

    // call internal method directly
    const results = await ResearchBackedMatcher.getRSBMRecommendations('me@example.com', 5)

    expect(results.length).toBeGreaterThan(0)
    expect(fakeCache.getFeedCandidates).toHaveBeenCalled()
  })

  test('generates feed and writes to cache when cache empty', async () => {
    const { getCache } = require('@/lib/cache/redisCache')
    const fakeCache = {
      getFeedCandidates: jest.fn().mockResolvedValue([]),
      cacheFeedCandidates: jest.fn().mockResolvedValue(undefined)
    }
    getCache.mockImplementation(() => fakeCache)

    // mock RSBMEngine.generateFeed to return a predictable feed
    const { RSBMEngine } = require('@/lib/rsbm/reciprocalMatcher')
    jest.spyOn(RSBMEngine.prototype, 'generateFeed').mockResolvedValue({
      mostCompatible: { candidateId: 'cand-1', reciprocalScore: 0.9 },
      mainFeed: [{ candidateId: 'cand-2', reciprocalScore: 0.8 }],
      explorationCandidates: []
    })

    // mock prisma to return user records
    jest.spyOn(prisma.user, 'findUnique' as any).mockImplementation(async (opts: any) => {
      if (opts.where?.email === 'me@example.com') {
        return { id: 'me-id', email: 'me@example.com', profile: {} }
      }
      return { id: opts.where?.id || 'cand-id', email: 'user@example.com', profile: {} }
    })

    const results = await ResearchBackedMatcher.getRSBMRecommendations('me@example.com', 5)

    expect(fakeCache.cacheFeedCandidates).toHaveBeenCalled()
    expect(results.length).toBeGreaterThan(0)
  })
})
