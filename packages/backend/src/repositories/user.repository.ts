import type { User } from '@planning-poker/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapToUser(user) : null;
  },

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { googleId } });
    return user ? mapToUser(user) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapToUser(user) : null;
  },

  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({ data });
    return mapToUser(user);
  },

  async upsertByGoogleId(data: CreateUserData): Promise<User> {
    const user = await prisma.user.upsert({
      where: { googleId: data.googleId },
      update: {
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
      create: data,
    });
    return mapToUser(user);
  },
};

function mapToUser(dbUser: {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: dbUser.id,
    googleId: dbUser.googleId,
    email: dbUser.email,
    name: dbUser.name || '',
    avatarUrl: dbUser.avatarUrl,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
}

export { prisma };
