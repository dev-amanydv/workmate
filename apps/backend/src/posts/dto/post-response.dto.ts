export interface AuthorSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  isFollowing?: boolean;
}

export class PostResponseDto {
  id: string;
  authorId: string;
  author: AuthorSummary;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  isLiked: boolean;

  static fromEntity(post: {
    id: string;
    authorId: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string;
      avatarUrl: string | null;
      isFollowing?: boolean;
    };
    likesCount?: number;
    isLiked?: boolean;
  }): PostResponseDto {
    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatarUrl: post.author.avatarUrl,
        isFollowing: post.author.isFollowing ?? false,
      },
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likesCount: post.likesCount ?? 0,
      isLiked: post.isLiked ?? false,
    };
  }
}

