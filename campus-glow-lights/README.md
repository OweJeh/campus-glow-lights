# Campus Glow 💡

A smart streetlight management and fault reporting system for the University of Ghana.

## Overview
Campus Glow provides a real-time dashboard for campus administrators to monitor streetlight health, manage assets, and generate QR-based reporting labels. Students and faculty can scan these labels to instantly report outages or damages.

## Features
- **Real-time Monitoring**: Powered by Supabase for instant updates.
- **Fault Reporting**: Mobile-first reporting flow with photo proof.
- **QR Management**: Generate and print individual QR labels for every pole on campus.
- **Analytics**: visualized insights into common fault types and zone-based health.
- **Responsive Admin Portal**: Manage everything from any device.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Lucide Icons
- **Backend**: Supabase (Database, Real-time)
- **Visualization**: Recharts

## Getting Started

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Run the development server: `npm run dev`

### Building for Production
```sh
npm run build
```
