# Eros-Psyche Anonymous Chat

## Features
- Fully anonymous 1-to-1 chat based on self-declared gender (Boys match with Girls)
- No real identity shared, secure unique IDs
- Real-time matched queues
- Strong privacy and moderation
- Beautiful UI with Dark/Light mode support

## Setup Guide

### 1. Prerequisites
- MongoDB installed and running locally
- Node.js installed

### 2. Environment Variables
See `server/.env.sample` and `client/.env.sample`.

### 3. Server Setup
```bash
cd server
npm install
npm run dev
```

### 4. Client Setup
```bash
cd client
npm install
npm run dev
```

## API Documentation

`POST /api/auth/register`
- body: `{ gender: "Boy", password: "...", isAgeConfirmed: true }`
- Response: `{ message, userId }` (Returns automatically generated User ID starting with Eros_ or Psyche_)

`POST /api/auth/login`
- body: `{ userId: "...", password: "..." }`
- Response: Sets HTTP-Only Cookie with JWT. Returns HTTP 200 `{ message, userId }`

`POST /api/auth/logout`
- Response: Clears cookie.

`POST /api/reports/report`
- body: `{ reportedUserId, sessionId }`
- Note: If reportCount >= 5, user is automatically banned from the platform.

## Architecture
- Backend: `Express`, `Mongoose`
- Front: `React`, `Vite`, `TailwindCSS v3`, `Framer Motion`
- Real-time: `Socket.io` Queueing system and message transport.

## Deployment Guide
1. Frontend: Deploy Vite build output (`npm run build`) to Vercel. Ensure `VITE_API_URL` is set to the real backend domain.
2. Backend: Deploy the server folder to Render/Railway. Ensure environment variables are correctly populated. Add proper MongoDB Atlas URI for `MONGO_URI`.
