# Valentine's Day Love Wall 💗

A beautiful, interactive Valentine's Day web app where users can post love notes and leave comments. Built with Next.js, Framer Motion, Three.js, and Supabase.

## Features

- 🎨 Animated hero section with interactive 3D ball pit
- 💌 Post love notes with custom emojis and colors
- 💬 Comment on love notes
- 📱 Fully responsive and mobile-friendly
- ✨ Smooth animations and transitions
- 🌙 Dark mode support

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd valentines
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. In your project dashboard, go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**

### 4. Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create love_notes table
CREATE TABLE love_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES love_notes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE love_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Enable read access for all users" ON love_notes
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON comments
  FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Enable insert access for all users" ON love_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert access for all users" ON comments
  FOR INSERT WITH CHECK (true);
```

### 5. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app in action.

## Project Structure

```
valentines/
├── app/
│   ├── api/
│   │   └── love-wall/          # API routes for notes and comments
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── Ballpit.jsx             # 3D interactive ball pit
│   ├── HeroSection.tsx         # Hero section
│   ├── LoveWall.tsx            # Love wall with notes
│   ├── NoteComments.tsx        # Comment system
│   └── Squares.jsx             # Animated background
└── lib/
    └── utils.ts                # Utility functions
```

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Three.js** - 3D graphics
- **Supabase** - Backend & database

## Security Notes

- ⚠️ **Never commit `.env.local`** - it contains your Supabase credentials
- ✅ The `.gitignore` already excludes `.env*` files
- ✅ Use `.env.example` as a template for others
- ✅ Each person who forks/clones must create their own Supabase project

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
