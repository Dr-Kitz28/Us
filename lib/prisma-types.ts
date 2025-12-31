// Lightweight Prisma-like TypeScript types for compatibility

export type User = {
  id: string
  email: string
  name?: string | null
  createdAt?: string | Date
  deletedAt?: string | Date | null
}

export type Profile = {
  id: string
  userId: string
  age?: number | null
  gender?: string | null
  location?: string | null
}

export type Like = {
  id: string
  fromId: string
  toId: string
  createdAt?: string | Date
}

export type Match = {
  id: string
  user1Id: string
  user2Id: string
  createdAt?: string | Date
}

export type Message = {
  id: string
  matchId: string
  senderId: string
  body: string
  createdAt?: string | Date
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
