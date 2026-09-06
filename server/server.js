// server.js - Updated with better error handling
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        env: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL 
    });
});

// Inngest with comprehensive error handling
let inngestLoaded = false;
try {
    const { serve } = await import("inngest/express");
    const { inngest, functions } = await import("./inngest/index.js");
    
    app.use("/api/inngest", serve({ client: inngest, functions }));
    inngestLoaded = true;
    console.log('Inngest loaded successfully');
} catch (error) {
    console.error('Inngest failed to load:', error.message);
    app.use("/api/inngest", (req, res) => {
        res.status(500).json({ 
            error: 'Inngest not available',
            message: error.message 
        });
    });
}

app.get('/', (req, res) => res.send('Server is live!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));