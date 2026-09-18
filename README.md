<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# NexusCRM / Personal CRM

A comprehensive Personal CRM, portfolio database, resume builder, and secure documents vault with Appwrite cloud integration and persistent local storage fallback.

View your app in AI Studio: https://ai.studio/apps/58879efe-7a4b-4838-a237-82a11f04fb48

---

## Features

- **Full Workspace CRM**: Manage personal profiles, work experience, education, skills, projects, certifications, contacts, and calendar events.
- **Durable Storage & Persistence**:
  - **Appwrite Cloud Backend**: Real-time sync with Appwrite Authentication, Appwrite Database collections, and Appwrite Storage buckets.
  - **Zero-Crash Local Fallback**: Automatically activates persistent local disk storage if cloud credentials are not yet defined, ensuring continuous operation without errors.
- **Public Portfolio Sharing**: Share read-only portfolio snapshots via customizable public slugs.
- **Vercel & Cloud Run Ready**: Optimized for serverless API routing (`/api/index.ts`) and custom Express full-stack execution.

---

## Environment Variables

Copy `.env.example` to `.env` or set these variables in your hosting provider (e.g. Vercel Project Settings):

```env
# Appwrite Cloud Configuration (Optional - local fallback active if omitted)
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
VITE_APPWRITE_DATABASE_ID=nexuscrm
APPWRITE_API_KEY=your_secret_appwrite_api_key

# Gemini AI (Optional)
GEMINI_API_KEY=
```

---

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (runs full-stack Express + Vite on port 3000):
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Start production server:
   ```bash
   npm run start
   ```

---

## Vercel Deployment

1. Connect your repository to Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_PROJECT_ID`
   - `VITE_APPWRITE_DATABASE_ID`
   - `APPWRITE_API_KEY`
3. Deploy! Serverless endpoints under `/api` route automatically to the Express backend.
