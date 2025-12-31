// Lightweight Prisma-like TypeScript types for compatibility

export type User = {
  id: string
  email: string
  password: string
  name?: string | null
  image?: string | null
  updatedAt?: string | Date
  createdAt?: string | Date
  deletedAt?: string | Date | null
  profile?: Profile | null
  photos?: Photo[]
  likesGiven: Like[]
  passesGiven: any[]
}

export type Profile = {
  id: string
  userId: string
  age?: number | null
  gender?: string | null
  location?: string | null
  bio?: string | null
  interests?: string | null
  goldenRatioScore?: number | null
  photoAnalyzed?: boolean | null
  photoAnalysisDate?: string | Date | null
  facialProportions?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type Like = {
  id: string
  fromId: string
  toId: string
  from: User
  to: User
  createdAt?: string | Date
}

export type Match = {
  id: string
  user1Id: string
  user2Id: string
  user1: User
  user2: User
  createdAt: Date
  messages: Message[]
}

export type Message = {
  id: string
  matchId: string
  senderId: string
  body?: string
  content?: string
  createdAt: Date
  sender: User
}

export type Photo = {
  id: string
  userId: string
  url: string
}

export type Report = {
  id: string
  reporterId: string
  targetId: string
  reason?: string
}

export {}
