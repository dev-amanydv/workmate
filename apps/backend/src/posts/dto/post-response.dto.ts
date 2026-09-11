export interface AuthorSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export class PostResponseDto {
  id: string;
  authorId: string;
  author: AuthorSummary;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

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
    };
  }): PostResponseDto {
    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatarUrl: post.author.avatarUrl,
      },
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
