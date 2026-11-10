import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), ms))
  ]);
}

export interface StorageTip {
  id: string;
  title: string;
  habit: string;
  impact: string;
  category: 'dcim_video' | 'dormant_apps' | 'burst_cleanup' | 'cache_hygiene' | 'housekeep_cadence' | 'download_archive';
  actionText: string;
  actionTab: 'dcim' | 'dormant_apps' | 'housekeep' | 'download_archive';
  estimatedSavingsBytes?: number;
}

// Fallback rule-based tips generator when AI API key is not yet set or unavailable
function generateRuleBasedTips(data: any): { headline: string; tips: StorageTip[]; comparisonInsight: string } {
  const dcimGB = (data.storage?.dcimBytes || 0) / (1024 * 1024 * 1024);
  const videoMB = (data.dcimSummary?.videoBytes || 0) / (1024 * 1024);
  const dormantAppsGB = (data.dormantAppsSummary?.totalBytes || 0) / (1024 * 1024 * 1024);
  const dormantCount = data.dormantAppsSummary?.count || 0;
  const duplicateCount = data.dcimSummary?.duplicateCount || 0;

  const tips: StorageTip[] = [];

  if (videoMB > 200) {
    tips.push({
      id: 'tip-video',
      title: 'Delete or Offload Large Videos First',
      habit: `You have ${(videoMB / 1024).toFixed(1)} GB in video recordings. Trimming or offloading 1 high-resolution video saves more space than deleting 50 to 100 individual photos.`,
      impact: 'High Impact',
      category: 'dcim_video',
      actionText: 'Manage Videos in DCIM',
      actionTab: 'dcim',
      estimatedSavingsBytes: data.dcimSummary?.videoBytes || 730 * 1024 * 1024
    });
  }

  if (dormantCount > 0) {
    tips.push({
      id: 'tip-apps',
      title: 'Batch Uninstall Unused Games & Heavy Apps',
      habit: `${dormantCount} apps haven't been opened for 30+ days (${dormantAppsGB.toFixed(1)} GB). Removing apps you no longer play yields instant storage without losing memories.`,
      impact: 'High Impact',
      category: 'dormant_apps',
      actionText: 'Review Dormant Apps',
      actionTab: 'dormant_apps',
      estimatedSavingsBytes: data.dormantAppsSummary?.totalBytes || 3 * 1024 * 1024 * 1024
    });
  }

  if (duplicateCount > 0) {
    tips.push({
      id: 'tip-burst',
      title: 'Keep Best Shot and Discard Camera Bursts',
      habit: `Camera burst sequences create 5-10 identical shots in seconds. Consolidating burst shots to just the favorite pick prevents DCIM folder bloat.`,
      impact: 'Medium Impact',
      category: 'burst_cleanup',
      actionText: 'Clean Burst Shots',
      actionTab: 'dcim',
      estimatedSavingsBytes: 150 * 1024 * 1024
    });
  }

  const downloadsMB = (data.downloadsSummary?.totalBytes || 0) / (1024 * 1024);
  const downloadsCount = data.downloadsSummary?.count || 0;
  if (downloadsMB > 100) {
    tips.push({
      id: 'tip-downloads',
      title: 'Archive WhatsApp & Telegram Videos to Dated Folders',
      habit: `${downloadsCount} chat videos and downloaded movies are using ${(downloadsMB / 1024).toFixed(1)} GB. Archiving them weekly to download_archive/2026_Nov_Week_2 prevents messaging folders from silently overwhelming your internal memory.`,
      impact: 'High Impact',
      category: 'download_archive',
      actionText: 'Manage Download Archive',
      actionTab: 'download_archive',
      estimatedSavingsBytes: data.downloadsSummary?.totalBytes || 1200 * 1024 * 1024
    });
  }

  tips.push({
    id: 'tip-cadence',
    title: 'Maintain Sunday Weekly Offloading Routine',
    habit: 'Moving each week\'s photo bucket (e.g. housekeep/2026_Nov_Week_2) directly to your external hard drive keeps phone memory below 70% indefinitely.',
    impact: 'Systemic Habit',
    category: 'housekeep_cadence',
    actionText: 'View Housekeep Staging',
    actionTab: 'housekeep',
    estimatedSavingsBytes: 2 * 1024 * 1024 * 1024
  });

  return {
    headline: videoMB > 300 
      ? `Trimming videos and ${dormantCount} dormant apps can instantly reclaim up to ${(dormantAppsGB + videoMB / 1024).toFixed(1)} GB.`
      : `${dormantCount} dormant apps and weekly DCIM staging offer ${(dormantAppsGB + 2).toFixed(1)} GB in potential savings.`,
    tips,
    comparisonInsight: 'Rule of Thumb: 1 minute of 4K video occupies ~350 MB, which equals approximately 70 camera photos or 140 screenshots.'
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// POST endpoint for AI personalized storage tips
app.post('/api/storage-tips', async (req: Request, res: Response) => {
  try {
    const usageData = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no key configured
      return res.json(generateRuleBasedTips(usageData));
    }

    const systemPrompt = `You are HousekeepOS AI, an expert mobile device storage advisor. 
Analyze the user's phone storage breakdown, camera folder statistics, and app inactivity patterns.
Suggest 3 to 4 personalized, concrete storage habits and trade-offs.
Focus on high-leverage habits (e.g., 'Delete long 4K videos instead of deleting cherished photos', 'Batch uninstall games unused for >30 days before touching documents', 'Keep 1 best shot per camera burst').
Tone must be practical, encouraging, analytical, and actionable. Avoid generic fluff like 'stay organized'.`;

    const userPrompt = `Here is the user's current phone storage data:
- Total Internal Capacity: ${(usageData.storage?.totalCapacityBytes / 1e9).toFixed(1)} GB
- Used Space: ${(usageData.storage?.usedBytes / 1e9).toFixed(1)} GB (${Math.round((usageData.storage?.usedBytes / usageData.storage?.totalCapacityBytes) * 100)}% full)
- DCIM Media Folder: ${(usageData.storage?.dcimBytes / 1e9).toFixed(1)} GB
- Video Files in DCIM: ${usageData.dcimSummary?.videoCount || 0} videos totaling ${((usageData.dcimSummary?.videoBytes || 0) / 1e6).toFixed(0)} MB
- Duplicate / Burst Shots: ${usageData.dcimSummary?.duplicateCount || 0} shots (${((usageData.dcimSummary?.duplicateBytes || 0) / 1e6).toFixed(0)} MB)
- Screenshots: ${usageData.dcimSummary?.screenshotCount || 0} screenshots
- Apps Unused for > 30 Days: ${usageData.dormantAppsSummary?.count || 0} apps totaling ${((usageData.dormantAppsSummary?.totalBytes || 0) / 1e9).toFixed(1)} GB
- Top Dormant Apps: ${JSON.stringify(usageData.dormantAppsSummary?.topApps || [])}
- Weekly Housekeeping History: 6 months of weekly offloading active

Generate:
1. headline: One punchy sentence highlighting the biggest leverage point (e.g. comparing video space to photos, or dormant apps to gallery size).
2. comparisonInsight: A crisp comparison rule of thumb (e.g., '1 minute of 4K video = 70 camera photos').
3. tips: 3 to 4 specific habit suggestions with:
   - id: unique string
   - title: concise action title (e.g. 'Delete Long Videos Instead of Photos')
   - habit: 1-2 sentence explanation of the habit and why it's more effective
   - impact: 'High Impact' | 'Medium Impact' | 'Systemic Habit'
   - category: 'dcim_video' | 'dormant_apps' | 'burst_cleanup' | 'cache_hygiene' | 'housekeep_cadence'
   - actionText: Short button label (e.g. 'Manage Videos in DCIM', 'Review Dormant Apps', 'Clean Burst Shots')
   - actionTab: 'dcim' | 'dormant_apps' | 'housekeep'`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              comparisonInsight: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    habit: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      enum: ['dcim_video', 'dormant_apps', 'burst_cleanup', 'cache_hygiene', 'housekeep_cadence']
                    },
                    actionText: { type: Type.STRING },
                    actionTab: {
                      type: Type.STRING,
                      enum: ['dcim', 'dormant_apps', 'housekeep']
                    }
                  },
                  required: ['id', 'title', 'habit', 'impact', 'category', 'actionText', 'actionTab']
                }
              }
            },
            required: ['headline', 'comparisonInsight', 'tips']
          }
        }
      }),
      3000
    );

    const text = response.text;
    if (!text) {
      return res.json(generateRuleBasedTips(usageData));
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err) {
    console.error('Error generating storage tips with Gemini:', err);
    return res.json(generateRuleBasedTips(req.body));
  }
});

// Helper for smart suggestions rule-based fallback
function generateSmartPreviewFallback(data: any) {
  const photos = data.currentWeekPhotos || [];
  const apps = data.installedApps || [];

  const suggestions: any[] = [];
  let totalReclaimableBytes = 0;

  // 1. Identify large videos
  const videos = photos
    .filter((p: any) => p.category === 'large_video' && p.status === 'in_dcim')
    .sort((a: any, b: any) => b.sizeBytes - a.sizeBytes);

  for (const v of videos.slice(0, 2)) {
    const mb = Math.round(v.sizeBytes / (1024 * 1024));
    suggestions.push({
      id: `sug-${v.id}`,
      targetId: v.id,
      name: v.name,
      type: 'file',
      sizeBytes: v.sizeBytes,
      impactBadge: 'Top Video Lever',
      aiRationale: `High-bitrate recording taking ${mb} MB. Staging this single file frees more space than clearing 50+ standard photos.`,
      actionType: 'move_to_housekeep',
      actionLabel: 'Stage to Housekeep'
    });
    totalReclaimableBytes += v.sizeBytes;
  }

  // 2. Identify top dormant apps (>30 days inactive)
  const dormant = apps
    .filter((a: any) => !a.uninstalled && !a.isSystemApp && (a.daysInactive || 0) >= 30)
    .sort((a: any, b: any) => (b.totalBytes || b.sizeBytes) - (a.totalBytes || a.sizeBytes));

  for (const a of dormant.slice(0, 2)) {
    const gb = ((a.totalBytes || a.sizeBytes) / (1024 * 1024 * 1024)).toFixed(1);
    suggestions.push({
      id: `sug-${a.id}`,
      targetId: a.id,
      name: a.name,
      type: 'app',
      sizeBytes: a.totalBytes || a.sizeBytes,
      impactBadge: a.category === 'Games' ? 'Heavy 3D Game' : 'Dormant App',
      aiRationale: `Inactive for ${a.daysInactive || 45} days, occupying ${gb} GB of storage with user data. Uninstalling yields immediate space.`,
      actionType: 'uninstall_app',
      actionLabel: 'Quick Uninstall'
    });
    totalReclaimableBytes += a.totalBytes || a.sizeBytes;
  }

  // 3. Identify duplicate bursts
  const duplicates = photos
    .filter((p: any) => p.category === 'duplicate' && p.status === 'in_dcim')
    .sort((a: any, b: any) => b.sizeBytes - a.sizeBytes);

  if (duplicates.length > 0) {
    const dup = duplicates[0];
    suggestions.push({
      id: `sug-${dup.id}`,
      targetId: dup.id,
      name: dup.name,
      type: 'file',
      sizeBytes: dup.sizeBytes,
      impactBadge: 'Burst Duplicate',
      aiRationale: `Identical burst shot captured seconds apart from the primary photo. Safe to trim without losing memories.`,
      actionType: 'clean_duplicate',
      actionLabel: 'Trim Duplicate'
    });
    totalReclaimableBytes += dup.sizeBytes;
  }

  const gbTotal = (totalReclaimableBytes / (1024 * 1024 * 1024)).toFixed(1);

  return {
    summaryHeadline: `${suggestions.length} high-impact levers can immediately reclaim ${gbTotal} GB right now.`,
    totalReclaimableBytes,
    smartSuggestions: suggestions
  };
}

// POST endpoint for Gemini AI Smart Preview
app.post('/api/smart-preview', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json(generateSmartPreviewFallback(body));
    }

    const systemPrompt = `You are HousekeepOS Smart Preview Engine. 
Analyze the provided week's photos and installed apps.
Select the top 3 to 5 specific files or apps that offer the absolute highest storage impact if cleaned right now.
For each item, specify whether it is a file or app, calculate its exact storage impact, and provide a 1-sentence analytical rationale explaining why cleaning it right now is the most effective action.`;

    const userPrompt = `Here is the current device status:
Photos in DCIM:
${JSON.stringify((body.currentWeekPhotos || []).slice(0, 15).map((p: any) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  sizeMB: Math.round(p.sizeBytes / 1e6)
})))}

Installed Apps:
${JSON.stringify((body.installedApps || []).filter((a: any) => !a.isSystemApp).slice(0, 15).map((a: any) => ({
  id: a.id,
  name: a.name,
  category: a.category,
  daysInactive: a.daysInactive,
  sizeMB: Math.round((a.totalBytes || a.sizeBytes) / 1e6)
})))}

Produce a JSON object matching this schema:
- summaryHeadline: One compelling summary sentence (e.g. '4 high-impact levers can immediately reclaim 5.1 GB right now')
- totalReclaimableBytes: total bytes sum of these selected items
- smartSuggestions: array of items:
  - id: unique string
  - targetId: original id of file or app
  - name: filename or app name
  - type: 'file' | 'app'
  - sizeBytes: number
  - impactBadge: short badge label (e.g. 'Top Video Lever', 'Heavy 3D Game', 'Burst Duplicate')
  - aiRationale: concise 1-sentence explanation of why this specific item has high impact
  - actionType: 'move_to_housekeep' | 'uninstall_app' | 'clean_duplicate'
  - actionLabel: 'Stage to Housekeep' | 'Quick Uninstall' | 'Trim Duplicate'`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryHeadline: { type: Type.STRING },
              totalReclaimableBytes: { type: Type.NUMBER },
              smartSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    targetId: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['file', 'app'] },
                    sizeBytes: { type: Type.NUMBER },
                    impactBadge: { type: Type.STRING },
                    aiRationale: { type: Type.STRING },
                    actionType: { type: Type.STRING, enum: ['move_to_housekeep', 'uninstall_app', 'clean_duplicate'] },
                    actionLabel: { type: Type.STRING }
                  },
                  required: ['id', 'targetId', 'name', 'type', 'sizeBytes', 'impactBadge', 'aiRationale', 'actionType', 'actionLabel']
                }
              }
            },
            required: ['summaryHeadline', 'totalReclaimableBytes', 'smartSuggestions']
          }
        }
      }),
      3000
    );

    const text = response.text;
    if (!text) {
      return res.json(generateSmartPreviewFallback(body));
    }

    return res.json(JSON.parse(text));
  } catch (err) {
    console.error('Error in smart-preview Gemini call:', err);
    return res.json(generateSmartPreviewFallback(req.body));
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer();
