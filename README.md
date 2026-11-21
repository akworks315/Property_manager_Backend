# Property Manager - Backend (Express + MongoDB) for Vercel

## Deploy
1. Vercel dashboard > Add New > Project > import this folder from GitHub (or run `npx vercel --prod` inside this folder).
2. Framework Preset: Other. No build command needed.
3. Environment Variables (Project Settings):
   - MONGO_URI    (same Atlas string you use locally)
   - JWT_SECRET   (long random string)
   - CLIENT_URL   (your frontend URL, set after the frontend is deployed)
4. In MongoDB Atlas > Network Access, allow 0.0.0.0/0 (Vercel has no fixed IP).
5. Open https://YOUR-BACKEND.vercel.app/api/health - it should show {"ok":true}.

## Seed first accounts (only if the database is new)
Run locally once, with MONGO_URI in .env pointing to the same database:
    npm install
    npm run seed

## Local
    npm install
    cp .env.example .env
    npm run dev
