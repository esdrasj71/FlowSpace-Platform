import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
    // Neon adapter for Vercel (production) 
    const { PrismaNeon } = await import('@prisma/adapter-neon');
    const { Pool } = await import('@neondatabase/serverless');
    
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });  
    const adapter = new PrismaNeon(pool);         
    
    prisma = global.prisma || new PrismaClient({ adapter });
} else {
    
    prisma = global.prisma || new PrismaClient();
}

if (process.env.NODE_ENV === 'development') global.prisma = prisma;
export default prisma;