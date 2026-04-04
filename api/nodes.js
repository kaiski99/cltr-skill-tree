const { Client } = require("@notionhq/client");

const notion = new Client({ auth: (process.env.NOTION_TOKEN || '').trim() });
const DATABASE_ID = (process.env.NOTION_DATABASE_ID || '').trim();

// Maps node names to stable IDs for dependency resolution
const NAME_TO_ID = {
  "Brand Identity & Design System": "brand-identity",
  "Landing Page & Web Shell": "landing-page",
  "Card Render Pipeline (3D)": "card-render",
  "Smart Contract Suite v1": "smart-contracts",
  "Supabase Backend & Auth": "supabase",
  "Gacha Engine MVP": "gacha-mvp",
  "Marketplace MVP": "marketplace-mvp",
  "Testnet Deployment": "testnet",
  "FMV Oracle v1": "fmv-oracle",
  "Security Audit": "security-audit",
  "Custody Partnership (Le Freeport SG)": "custody",
  "Vault Intake Pipeline": "vault-intake",
  "Grading & Authentication SOP": "grading-sop",
  "Choose Your Edition Campaign": "edition-campaign",
  "KOL Wave 1 (TCG + Hyperliquid)": "kol-wave-1",
  "Community Channels Setup": "community-channels",
  "Mainnet Deploy": "mainnet",
  "Auction House": "auction-house",
  "Lending & Borrowing (CUSD)": "lending",
  "Points System & Rewards": "points-system",
  "LGM Packs (Licensed Mystery)": "lgm-packs",
  "User Dashboard & Portfolio": "dashboard",
  "Mobile-Responsive PWA": "pwa",
  "Seller Onboarding Portal": "seller-portal",
  "Inventory Management System": "inventory",
  "Analytics & Monitoring": "analytics",
  "KOL Wave 2 (TANKDAO Korea)": "kol-wave-2",
  "Content Engine (CT + Socials)": "content-engine",
  "Strategic Partnerships (Gaming Guilds)": "guild-partnerships",
  "Multi-Category Expansion (One Piece, YGO)": "multi-category",
  "Multi-Vault Network (Japan, HK)": "multi-vault",
  "FMV Oracle v2 (Multi-Source)": "fmv-oracle-v2",
  "$CLTR Token Launch (HIP-1)": "token-launch",
  "Staking & Governance": "staking",
  "Liquidity Pools & DEX Integration": "liquidity-pools",
  "APAC Marketing Hub (Korea, Japan, SEA)": "apac-hub",
  "Institutional Lending Partnerships": "institutional-lending",
  "Advanced Gacha Mechanics": "advanced-gacha",
  "API & SDK for Partners": "api-sdk",
  "Insurance & Risk Framework": "insurance",
  "Community-Generated Packs (Open UGM)": "community-ugm",
  "Permissionless Custody Network": "permissionless-custody",
  "Cross-Platform Trading (Courtyard, CC Bridge)": "cross-platform",
  "DAO Treasury & Revenue Share": "dao-treasury",
  "Sports Cards & Luxury Collectibles": "sports-luxury",
  "Institutional & Whale Services": "whale-services",
  "Mobile Native App (iOS/Android)": "mobile-app",
  "Global KOL Network (10K+)": "global-kol",
  "Protocol Decentralization": "decentralization",
  "Investor Deck & Pitch": "investor-deck",
  "Fundraise (Seed Round)": "fundraise",
  "First Flash Sell (3 LE Packs)": "flash-sell",
  "Perpetual Gacha": "perpetual-gacha",
  // Alternate names for fuzzy matching
  "Multi-Category Expansion": "multi-category",
  "APAC Marketing Hub": "apac-hub",
  "Cross-Platform Trading Bridge": "cross-platform",
  "Community-Generated Packs": "community-ugm",
  "First Flash Sell": "flash-sell",
  "Fundraise": "fundraise",
  "Investor Deck": "investor-deck",
};

// Dependency map (node ID -> array of dependency IDs)
const DEPENDENCY_MAP = {
  "brand-identity": [],
  "landing-page": ["brand-identity"],
  "card-render": ["brand-identity"],
  "smart-contracts": [],
  "supabase": [],
  "gacha-mvp": ["smart-contracts", "supabase"],
  "marketplace-mvp": ["smart-contracts", "supabase", "card-render"],
  "testnet": ["smart-contracts"],
  "fmv-oracle": ["grading-sop"],
  "security-audit": ["testnet"],
  "custody": [],
  "vault-intake": ["custody", "supabase"],
  "grading-sop": ["custody"],
  "edition-campaign": ["landing-page", "brand-identity"],
  "kol-wave-1": ["edition-campaign"],
  "community-channels": ["brand-identity"],
  "mainnet": ["security-audit"],
  "auction-house": ["marketplace-mvp", "mainnet"],
  "lending": ["fmv-oracle", "mainnet"],
  "points-system": ["gacha-mvp"],
  "lgm-packs": ["gacha-mvp", "seller-portal"],
  "dashboard": ["supabase", "marketplace-mvp"],
  "pwa": ["dashboard"],
  "seller-portal": ["vault-intake", "marketplace-mvp"],
  "inventory": ["vault-intake"],
  "analytics": ["mainnet", "supabase"],
  "kol-wave-2": ["kol-wave-1"],
  "content-engine": ["community-channels", "edition-campaign"],
  "guild-partnerships": ["community-channels"],
  "multi-category": ["seller-portal", "inventory"],
  "multi-vault": ["inventory", "custody"],
  "fmv-oracle-v2": ["fmv-oracle", "analytics"],
  "token-launch": ["mainnet", "security-audit"],
  "staking": ["token-launch"],
  "liquidity-pools": ["token-launch"],
  "apac-hub": ["kol-wave-2", "multi-vault"],
  "institutional-lending": ["lending", "fmv-oracle-v2"],
  "advanced-gacha": ["points-system", "lgm-packs"],
  "api-sdk": ["seller-portal", "fmv-oracle-v2"],
  "insurance": ["multi-vault"],
  "community-ugm": ["advanced-gacha", "staking"],
  "permissionless-custody": ["multi-vault", "insurance"],
  "cross-platform": ["api-sdk", "multi-category"],
  "dao-treasury": ["staking", "liquidity-pools"],
  "sports-luxury": ["multi-category", "permissionless-custody"],
  "whale-services": ["institutional-lending", "insurance"],
  "mobile-app": ["pwa", "advanced-gacha"],
  "global-kol": ["apac-hub", "content-engine"],
  "decentralization": ["dao-treasury", "permissionless-custody"],
  "investor-deck": ["brand-identity", "landing-page"],
  "fundraise": ["investor-deck"],
  "flash-sell": ["edition-campaign", "gacha-mvp", "landing-page"],
  "perpetual-gacha": ["flash-sell", "gacha-mvp"],
};

// Unlock map (reverse of dependencies)
const UNLOCK_MAP = {};
Object.entries(DEPENDENCY_MAP).forEach(([nodeId, deps]) => {
  deps.forEach(depId => {
    if (!UNLOCK_MAP[depId]) UNLOCK_MAP[depId] = [];
    UNLOCK_MAP[depId].push(nodeId);
  });
});

function getPhaseNumber(phaseStr) {
  if (!phaseStr) return 1;
  const match = phaseStr.match(/(\d)/);
  return match ? parseInt(match[1]) : 1;
}

function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return "";
  switch (prop.type) {
    case "title":
      return prop.title?.map(t => t.plain_text).join("") || "";
    case "rich_text":
      return prop.rich_text?.map(t => t.plain_text).join("") || "";
    case "select":
      return prop.select?.name || "";
    case "multi_select":
      return prop.multi_select?.map(s => s.name) || [];
    case "number":
      return prop.number ?? 0;
    case "unique_id":
      return prop.unique_id?.number || 0;
    default:
      return "";
  }
}

function resolveNodeId(name) {
  return NAME_TO_ID[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Query all pages from the Skill Nodes database
    let allPages = [];
    let cursor = undefined;

    do {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      });
      allPages = allPages.concat(response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    // Transform to skill tree node format
    const nodes = allPages.map((page, idx) => {
      const name = getPropertyValue(page, "Node");
      const id = resolveNodeId(name);
      const phase = getPhaseNumber(getPropertyValue(page, "Phase"));
      const branch = getPropertyValue(page, "Branch") || "Core Product";
      const status = getPropertyValue(page, "Status") || "Not Started";
      const priority = getPropertyValue(page, "Priority") || "Medium";
      const team = getPropertyValue(page, "Team");
      const cost = getPropertyValue(page, "Est. Cost") || 0;
      const duration = getPropertyValue(page, "Duration") || "";
      const notes = getPropertyValue(page, "Notes") || "";
      const blockers = getPropertyValue(page, "Blockers") || "";
      const nodeId = getPropertyValue(page, "Node ID");

      return {
        id,
        notionId: page.id,
        name,
        phase,
        branch,
        status,
        priority,
        team: Array.isArray(team) ? team : [team].filter(Boolean),
        cost,
        duration,
        notes,
        blockers,
        nodeId,
        depends: DEPENDENCY_MAP[id] || [],
        unlocks: UNLOCK_MAP[id] || [],
      };
    });

    // Sort by phase, then branch
    const branchOrder = ["Design & Brand", "Core Product", "Operations", "GTM & Marketing", "Token & DeFi", "Multi-Category"];
    nodes.sort((a, b) => {
      if (a.phase !== b.phase) return a.phase - b.phase;
      return branchOrder.indexOf(a.branch) - branchOrder.indexOf(b.branch);
    });

    // Stats
    const stats = {
      total: nodes.length,
      active: nodes.filter(n => n.status === "In Progress").length,
      done: nodes.filter(n => n.status === "Done" || n.status === "Shipped").length,
      locked: nodes.filter(n => n.status === "Locked").length,
      totalCost: nodes.reduce((s, n) => s + n.cost, 0),
    };
    stats.progress = stats.total > 0 ? Math.round(((stats.done + stats.active * 0.5) / stats.total) * 100) : 0;

    res.status(200).json({
      ok: true,
      stats,
      nodes,
      lastSync: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Notion API error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to fetch from Notion",
    });
  }
};
