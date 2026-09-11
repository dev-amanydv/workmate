export interface AuthorSummary {
  id: string;
  name: string;
  role?: string;
  avatarUrl: string | null;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author: AuthorSummary;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  isLiked: boolean;
}

