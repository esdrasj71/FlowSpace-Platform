import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
    const { PrismaNeon } = await import('@prisma/adapter-neon');
    const { neon } = await import('@neondatabase/serverless');
    
    const connectionString = process.env.DATABASE_URL;
    const sql = neon(connectionString);
    const adapter = new PrismaNeon(sql);
    
    prisma = global.prisma || new PrismaClient({ adapter });
} else {
    prisma = global.prisma || new PrismaClient();
}

if (process.env.NODE_ENV === 'development') global.prisma = prisma;
export default prisma;