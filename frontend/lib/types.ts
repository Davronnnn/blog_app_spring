export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthorRef {
  id: number;
  username: string;
  displayName: string | null;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  author: AuthorRef;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostDetail extends PostSummary {
  content: string;
}

export interface Comment {
  id: number;
  content: string;
  author: AuthorRef;
  createdAt: string;
}

/** Spring Data `Page<T>` envelope. */
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface PostInput {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
}

export interface AdminStats {
  userCount: number;
  postCount: number;
  commentCount: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  role: "USER" | "ADMIN";
  postCount: number;
  createdAt: string;
}
