/**
 * Shared API types used across norbo-mobile services and stores.
 * These mirror the backend DTOs from norbo-api.
 */

export interface User {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  ownerId: string;
  contactUserId: string;
  nickname?: string;
  contactUser: User;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PingIn {
  pingId: string;
  senderId: string;
  ttlSeconds: number;
  createdAt: string;
}

export interface Dahed {
  pingId: string;
  dahedAt: string;
}

export interface Expired {
  pingId: string;
}
