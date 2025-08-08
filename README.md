# AI Prompt Library

A Next.js application for managing AI-generated images with prompts and metadata for Shopos.ai employees.

## Features

- 🔐 Secure authentication (@shopos.ai emails only)
- 📤 Direct image upload to Supabase Storage
- 🔍 Advanced filtering (client, model, favorites)
- 📊 Export functionality (JSON/CSV)
- ⭐ Favorites system
- ✏️ Edit and delete prompt cards
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **Deployment**: Vercel

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env.local`
4. Fill in your Supabase credentials in `.env.local`
5. Run development server: `npm run dev`

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

This application is configured for deployment on Vercel with Supabase as the backend.

## Authentication

Access is restricted to @shopos.ai email addresses only. 