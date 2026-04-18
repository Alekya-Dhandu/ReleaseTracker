// =============================================================
//  Release Tracker — Backend API Server (MySQL)
//  File: server.js
//  Run: node server.js  (or: pm2 start server.js)
//
//  npm install express mysql2 cors dotenv @anthropic-ai/sdk
// =============================================================

require('dotenv').config();
const express   = require('express');
const mysql     = require('mysql2/promise');
const cors      = require('cors');
const crypto    = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const port = process.env.PORT || 4000;

// ---- MySQL Pool ----
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  database:           process.env.DB_NAME     || 'release_tracker',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  ssl:                process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4',
});

const path = require('path');
const ai   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---- CORS ----
const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === 'null') return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-api-key','x-webhook-signature'],
}));

app.options('*', cors());
app.use(express.json());

// ---- Serve dashboard.html at root ----
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

function requireApiKey(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.API_KEY)
    return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function verifyWebhook(req) {
  const sig = req.headers['x-webhook-signature'];
  if (!sig) return false;
  const expected = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(req.body)).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); }
  catch { return false; }
}

function buildWhere(q) {
  const cond = [], params = [];
  if (q.client)       { cond.push('client = ?');       params.push(q.client); }
  if (q.status)       { cond.push('status = ?');        params.push(q.status); }
  if (q.env)          { cond.push('env LIKE ?');         params.push(`%${q.env}%`); }
  if (q.store_status) { cond.push('store_status = ?');  params.push(q.store_status); }
  if (q.q) {
    cond.push('(client LIKE ? OR platform LIKE ? OR branch LIKE ? OR features LIKE ? OR commit_id LIKE ?)');
    const l = `%${q.q}%`;
    params.push(l,l,l,l,l);
  }
  return { clause: cond.length ? 'WHERE ' + cond.join(' AND ') : '', params };
}

// ---- Teams Notification ----
async function sendTeamsNotification(data) {
  if (!process.env.TEAMS_WEBHOOK_URL) {
    console.warn('[teams] TEAMS_WEBHOOK_URL not set in .env');
    return;
  }
  try {
    const { client, platform, branch, status, env, build_number, triggered_by, ai_risk, ai_summary } = data;
    const statusEmoji = status === 'success' || status === 'Live' ? '✅' : status === 'failure' || status === 'Failed' ? '❌' : '🔄';
    const statusColor = status === 'success' || status === 'Live' ? '00703C' : status === 'failure' || status === 'Failed' ? 'FF0000' : 'FFA500';
    const card = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": statusColor,
      "summary": `${client} deployment ${status}`,
      "sections": [{
        "activityTitle": `${statusEmoji} **${client}** — Build #${build_number} **${(status||'').toUpperCase()}**`,
        "activitySubtitle": `Triggered by ${triggered_by || 'Jenkins'}`,
        "facts": [
          { "name": "📱 Platform",    "value": platform || '—' },
          { "name": "🌿 Branch",      "value": branch || '—' },
          { "name": "🌍 Environment", "value": env || '—' },
          { "name": "⚠️ Risk",        "value": ai_risk || 'low' },
          { "name": "🤖 AI Summary",  "value": ai_summary || 'Deployed via Jenkins' },
        ],
        "markdown": true
      }],
      "potentialAction": [{
        "@type": "OpenUri",
        "name": "View Dashboard",
        "targets": [{ "os": "default", "uri": "http://localhost:4000" }]
      }]
    };
    const https = require('https');
    const body  = JSON.stringify(card);
    const url   = new URL(process.env.TEAMS_WEBHOOK_URL);
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (res) => {
        console.log(`[teams] Response status: ${res.statusCode}`);
        resolve(res.statusCode);
      });
      req.on('error', (e) => {
        console.warn('[teams] Request error:', e.message);
        reject(e);
      });
      req.write(body);
      req.end();
    });
    console.log(`[teams] ✅ Notification sent — ${client} / ${status}`);
  } catch(e) {
    console.warn('[teams] ❌ Notification failed:', e.message);
  }
}

// ---- Health ----
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'MySQL connected', time: new Date().toISOString() });
  } catch (e) { res.status(500).json({ status: 'error', error: e.message }); }
});

// ---- PLANNING ----
app.get('/api/planning', requireApiKey, async (req, res) => {
  try {
    const { clause, params } = buildWhere(req.query);
    const [rows] = await pool.query(`SELECT * FROM planning ${clause} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/planning', requireApiKey, async (req, res) => {
  try {
    const { date,client,platform,branch,env,features,status,owner,notes,prod_release } = req.body;
    await pool.query(
      'INSERT INTO planning (date,client,platform,branch,env,features,status,owner,notes,prod_release) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [date,client,platform,branch,env,features,status,owner,notes,prod_release]
    );
    const [rows] = await pool.query('SELECT * FROM planning ORDER BY created_at DESC LIMIT 1');
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/planning/:id', requireApiKey, async (req, res) => {
  try {
    const { date,client,platform,branch,env,features,status,owner,notes,prod_release } = req.body;
    await pool.query(
      'UPDATE planning SET date=?,client=?,platform=?,branch=?,env=?,features=?,status=?,owner=?,notes=?,prod_release=? WHERE id=?',
      [date,client,platform,branch,env,features,status,owner,notes,prod_release,req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM planning WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/planning/:id', requireApiKey, async (req, res) => {
  try {
    await pool.query('DELETE FROM planning WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- PLATFORM VERSIONS ----
app.get('/api/versions', requireApiKey, async (req, res) => {
  try {
    const { clause, params } = buildWhere(req.query);
    const [rows] = await pool.query(`SELECT * FROM platform_versions ${clause} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/versions', requireApiKey, async (req, res) => {
  try {
    const { type,component,client,prod_version,prev_version,branch,last_release,api_version,owner,store_status,store_link } = req.body;
    await pool.query(
      'INSERT INTO platform_versions (type,component,client,prod_version,prev_version,branch,last_release,api_version,owner,store_status,store_link) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [type,component,client,prod_version,prev_version,branch,last_release,api_version,owner,store_status,store_link]
    );
    const [rows] = await pool.query('SELECT * FROM platform_versions ORDER BY created_at DESC LIMIT 1');
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/versions/:id', requireApiKey, async (req, res) => {
  try {
    const { type,component,client,prod_version,prev_version,branch,last_release,api_version,owner,store_status,store_link } = req.body;
    await pool.query(
      'UPDATE platform_versions SET type=?,component=?,client=?,prod_version=?,prev_version=?,branch=?,last_release=?,api_version=?,owner=?,store_status=?,store_link=? WHERE id=?',
      [type,component,client,prod_version,prev_version,branch,last_release,api_version,owner,store_status,store_link,req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM platform_versions WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/versions/:id', requireApiKey, async (req, res) => {
  try {
    await pool.query('DELETE FROM platform_versions WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- DEPLOYMENTS ----
app.get('/api/deployments', requireApiKey, async (req, res) => {
  try {
    const { clause, params } = buildWhere(req.query);
    const [rows] = await pool.query(`SELECT * FROM deployments ${clause} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/deployments', requireApiKey, async (req, res) => {
  try {
    const { date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted } = req.body;
    await pool.query(
      'INSERT INTO deployments (date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted]
    );
    const [rows] = await pool.query('SELECT * FROM deployments ORDER BY created_at DESC LIMIT 1');
    console.log(`[deployment] ${client} / ${branch} / ${status}`);
    await sendTeamsNotification({
      client       : client || '—',
      platform     : platform || '—',
      branch       : branch || '—',
      status       : status || 'unknown',
      env          : env || '—',
      build_number : commit_id || '—',
      triggered_by : 'Jenkins',
      ai_risk      : 'low',
      ai_summary   : feature_impacted || 'Deployed via Jenkins pipeline'
    });
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/deployments/:id', requireApiKey, async (req, res) => {
  try {
    const { date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted } = req.body;
    await pool.query(
      'UPDATE deployments SET date=?,client=?,platform=?,repo=?,branch=?,commit_id=?,status=?,env=?,blocker=?,feature_impacted=? WHERE id=?',
      [date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted,req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM deployments WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/deployments/:id', requireApiKey, async (req, res) => {
  try {
    await pool.query('DELETE FROM deployments WHERE id=?', [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- JENKINS WEBHOOK ----
app.post('/webhook/jenkins', async (req, res) => {
  if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid signature' });
  const { app_name,client,platform,repo,branch,commit,build_number,status,env,triggered_by,pipeline_url,features,blocker,version } = req.body;
  if (!client || !branch) return res.status(400).json({ error: 'client and branch required' });
  try {
    let ai_summary = '', ai_risk = 'low';
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const msg = await ai.messages.create({
          model: 'claude-sonnet-4-20250514', max_tokens: 200,
          messages: [{ role:'user', content:`Return JSON only: {"summary":"1 sentence","risk":"low|medium|high"}\nApp:${app_name||client} Platform:${platform} Branch:${branch} Status:${status} Env:${env} Features:${features||'N/A'}` }]
        });
        const p = JSON.parse(msg.content[0].text.replace(/```json|```/g,'').trim());
        ai_summary = p.summary||''; ai_risk = p.risk||'low';
      } catch(e) { console.warn('AI failed:', e.message); }
    }
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g,'-');
    await pool.query(
      'INSERT INTO deployments (date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted,app_name,build_number,pipeline_url,triggered_by,ai_summary,ai_risk,auto_captured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
      [today,client,platform||'',repo||'',branch,commit||'',status||'',env||'Prod',blocker||'',features||'',app_name||client,build_number||'',pipeline_url||'',triggered_by||'Jenkins',ai_summary,ai_risk]
    );
    if (version) {
      await pool.query(
        'INSERT IGNORE INTO platform_versions (client,component,branch,prod_version,last_release,owner,auto_captured) VALUES (?,?,?,?,?,?,1)',
        [client,platform||'',branch,version,today,triggered_by||'Jenkins']
      );
    }
    const [rows] = await pool.query('SELECT * FROM deployments ORDER BY created_at DESC LIMIT 1');
    console.log(`[webhook] ${client} / ${branch} / ${status}`);
    await sendTeamsNotification({ client, platform, branch, status, env, build_number, triggered_by, ai_risk, ai_summary });
    res.status(201).json({ ok:true, id:rows[0].id, ai_risk, ai_summary });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ---- STATS ----
app.get('/api/stats', requireApiKey, async (req, res) => {
  try {
    const [[{ total }]]   = await pool.query('SELECT COUNT(*) AS total FROM deployments');
    const [[{ live }]]    = await pool.query("SELECT COUNT(*) AS live FROM deployments WHERE status IN ('Live','QA-Passed','Released')");
    const [[{ clients }]] = await pool.query('SELECT COUNT(DISTINCT client) AS clients FROM deployments');
    const [[{ today }]]   = await pool.query('SELECT COUNT(*) AS today FROM deployments WHERE DATE(created_at) = CURDATE()');
    res.json({ total, live, clients, today });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ---- AI CHAT ----
app.post('/api/chat', requireApiKey, async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question required' });
  try {
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const [todayDeploys] = await pool.query(
      'SELECT client,platform,branch,status,env,date,ai_summary,ai_risk,commit_id,triggered_by FROM deployments WHERE date = ? ORDER BY created_at DESC',
      [today]
    );
    const [recentDeploys] = await pool.query(
      'SELECT client,platform,branch,status,env,date,ai_summary,ai_risk,commit_id,triggered_by FROM deployments ORDER BY created_at DESC LIMIT 20'
    );
    const [plans] = await pool.query(
      'SELECT client,platform,branch,status,env,date,features,owner FROM planning ORDER BY created_at DESC LIMIT 15'
    );
    const [versions] = await pool.query(
      'SELECT client,component,prod_version,store_status,last_release,owner FROM platform_versions ORDER BY created_at DESC LIMIT 15'
    );
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 800,
      system: `You are a release tracker assistant for tv2z engineering team.
Today's date is ${today}.

TODAY'S DEPLOYMENTS (${todayDeploys.length} total today):
${JSON.stringify(todayDeploys, null, 2)}

RECENT DEPLOYMENTS (last 20):
${JSON.stringify(recentDeploys, null, 2)}

PLANNING DATA:
${JSON.stringify(plans, null, 2)}

PLATFORM VERSIONS:
${JSON.stringify(versions, null, 2)}

STRICT FORMATTING RULES — always follow this exact style:
- Use numbered sections like: 1. Client Name
- Use bullet points with - for each detail
- Bold important values using **value**
- Use emojis: ✅ success, ❌ failed, 🚀 deployed, 📅 date, 📱 platform, 🌍 environment, ⚠️ warning, 🔄 in progress
- Always show: Date, Platform, Branch, Status, Environment for each deployment
- When asked about today use TODAY'S DEPLOYMENTS first
- If nothing deployed today say ❌ No deployments today for [client]
- End with a short 💡 Summary line
- Keep answers concise and scannable`,
      messages: [{ role: 'user', content: question }]
    });
    res.json({ answer: msg.content[0].text });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(port, () => {
  console.log(`\n Release Tracker API (MySQL) → http://localhost:${port}`);
  console.log(` Health: http://localhost:${port}/health\n`);
});