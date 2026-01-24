import { userRepository } from '../repositories';
import { generateToken } from '../middleware';
import { User, AuthUser } from '@planning-poker/shared';

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string }>;
  displayName: string;
  photos?: Array<{ value: string }>;
}

export const authService = {
  async handleGoogleCallback(profile: GoogleProfile): Promise<{ user: User; token: string }> {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new Error('Email not provided by Google');
    }

    const user = await userRepository.upsertByGoogleId({
      googleId: profile.id,
      email,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value || null,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return { user, token };
  },

  async getCurrentUser(userId: string): Promise<AuthUser | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  },

  async handleDevLogin(): Promise<{ user: User; token: string }> {
    const user = await userRepository.upsertByGoogleId({
      googleId: 'DEV_LOCAL_USER',
      email: 'dev@localhost.local',
      name: 'Dev Admin',
      avatarUrl: null,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return { user, token };
  },
};
