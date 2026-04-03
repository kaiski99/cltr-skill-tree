# CLTR Skill Tree — Live Setup

## 3-Step Deploy (< 5 min)

### 1. Create Notion Integration
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New Integration**
3. Name it `CLTR Skill Tree`, pick your workspace
4. Copy the **Internal Integration Secret** (starts with `secret_`)
5. Go to your Skill Nodes database in Notion → click `...` → **Connections** → add your integration

### 2. Deploy to Vercel
```bash
# Install Vercel CLI (if you don't have it)
npm i -g vercel

# From this folder
cd cltr-skill-tree
npm install
vercel

# When prompted:
# - Link to existing project? No
# - Project name: cltr-skill-tree
# - Directory: ./

# Add environment variables
vercel env add NOTION_TOKEN        # paste your secret_xxx
vercel env add NOTION_DATABASE_ID  # 13586810-72e8-4b14-b339-af87dfde831e

# Deploy to production
vercel --prod
```

### 3. Done
Your skill tree is live at `https://cltr-skill-tree.vercel.app` (or whatever Vercel assigns).

## How It Works
- The page loads and calls `/api/nodes` (a Vercel serverless function)
- The serverless function queries your Notion Skill Nodes database via API
- Returns all nodes with their current status, cost, duration, notes
- The frontend renders the interactive skill tree with live data
- Auto-refreshes every 30 seconds
- Click the **Sync** badge or press **R** to manually refresh

## Update Workflow
1. Change anything in Notion (status, cost, blockers, notes)
2. The skill tree reflects it within 30 seconds
3. No code changes needed

## Keyboard Shortcuts
- `0` — View all phases
- `1-4` — Filter by phase
- `R` — Manual refresh
- `Esc` — Close detail panel
