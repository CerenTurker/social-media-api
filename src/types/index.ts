import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface PostQuery {
  page?: number;
  limit?: number;
  userId?: string;
  hashtag?: string;
}

export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}
