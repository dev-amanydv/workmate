export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isSelf: boolean;
}
