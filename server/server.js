import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import workspaceRouter from './routes/workspaceRoutes.js'
import { protect } from './middlewares/authMiddleware.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.use("/api/workspaces", protect, workspaceRouter);

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        env: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeVersion: process.version
    });
});

// Inngest with detailed logging
let inngestLoaded = false;
try {
    //console.log('Phase 1: Importing Inngest...');
    const { serve } = await import("inngest/express");
    console.log('Inngest imported');
    
    //console.log('Phase 2: Creating Prisma client');
    // Import Prisma
    const { default: prisma } = await import("./configs/prisma.js");
    console.log('Prisma client created');
    
    // Test database connection
    //console.log('Phase 3: Testing database connection');
    await prisma.$connect();
    console.log('Database connected');
    
    //console.log('Phase 4: Importing Inngest functions');
    const { inngest, functions } = await import("./inngest/index.js");
    console.log(`Inngest functions loaded: ${functions.length} functions`);
    
    //console.log('Phase 5: Setting up Inngest route');
    app.use("/api/inngest", serve({ client: inngest, functions }));
    inngestLoaded = true;
    console.log('Inngest loaded successfully');
} catch (error) {
    console.error('Inngest failed to load:', error.message);
    console.error('Stack:', error.stack);
    
    // Fallback route with error details
    app.use("/api/inngest", (req, res) => {
        res.status(500).json({ 
            error: 'Inngest not available',
            message: error.message,
            details: error.stack
        });
    });
}

app.get('/', (req, res) => res.send('Server is live!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Inngest status: ${inngestLoaded ? 'Loaded' : 'Not loaded'}`);
});