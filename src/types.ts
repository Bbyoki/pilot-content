export type SocialChannel = 'LinkedIn' | 'X / Twitter' | 'Instagram' | 'Dev.to';
export type ToneType = 'Profissional' | 'Persuasivo' | 'Criativo' | 'Técnico';
export type PostStatus = 'Draft' | 'Scheduled' | 'Published';

export interface UserProfile {
  uid: string;
  email: string;
  isAdmin: boolean;
  plan: 'Free' | 'Pro' | 'Enterprise' | 'Admin';
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface PostItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  channel: SocialChannel;
  tone: ToneType;
  status: PostStatus;
  scheduledTime?: string;
  createdAt: string;
}

export interface UserAnalytics {
  userId: string;
  postsCount: number;
  sharesCount: number;
  engagementFactor: number;
  updatedAt: string;
}
