import { PrismaClient } from '@prisma/client';

// Mantém uma única instância do Prisma rodando
export const prisma = new PrismaClient();
