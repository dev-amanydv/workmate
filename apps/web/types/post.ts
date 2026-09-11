export interface AuthorSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  author: AuthorSummary;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
