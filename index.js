import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-cardverse'

export const inject = ['webServer']

const PKG_DIR = fileURLToPath(new URL('./', import.meta.url))

const STATE_FILE = () => path.join(process.env.DSH_HOME || path.join(os_home(), '.dsh'), 'dsh-cardverse', 'state.json')
function os_home() { return process.env.USERPROFILE || process.env.HOME || '.' }

const TRAIL_DIR = path.join(PKG_DIR, 'trail')

const TRAIL_MAX_BYTES = 10 * 1024 * 1024
const TRAIL_ROLL_BYTES = Math.floor(TRAIL_MAX_BYTES * 0.94)

const TRAIL_PORT = Number(process.env.DSH_CARDVERSE_TRAIL_PORT || 5002)

const WORKBENCH = process.env.DSH_CARDVERSE_WORKBENCH || ''
const BOUNTY_VIEW_PATH = process.env.DSH_CARDVERSE_BOUNTY_PATH || '/api/bounty'
const BOUNTY_GRAB_PATH = process.env.DSH_CARDVERSE_GRAB_PATH || '/bounty/grab'
const BOUNTY_GRAB_WHO = process.env.DSH_CARDVERSE_GRAB_WHO || 'agent'

export const MODELS = [
  { id: 'our-free-model/openai/gpt-oss-20b', label: 'EAC GPT-OSS 20B', provider: 'our-free-model', model: 'openai/gpt-oss-20b' },
  { id: 'our-free-model/z-ai/glm-5.3-flash', label: 'EAC GLM 5.3 Flash', provider: 'our-free-model', model: 'z-ai/glm-5.3-flash' },
  { id: 'our-free-model/z-ai/glm-5.3', label: 'EAC GLM 5.3', provider: 'our-free-model', model: 'z-ai/glm-5.3' },
]

export const THEMES = [
  { id: 'aurora', label: '极光', hue: 220 },
  { id: 'emerald', label: '翡翠', hue: 152 },
  { id: 'sunset', label: '日落', hue: 16 },
  { id: 'orchid', label: '兰花', hue: 276 },
  { id: 'ocean', label: '海洋', hue: 195 },
  { id: 'rose', label: '玫瑰', hue: 340 },
]

const WORKSPACE_DIRS = [
  '.',
  '.',
  '.',
]

function defaultCards() {
  return {
    order: ['hall', 'ws-1', 'ws-2', 'ws-3'],
    theme: 'aurora',
    cards: {
      hall: {
        id: 'hall', kind: 'hall', title: '群发大厅', locked: true,
        model: null, session: null, sessions: [],
        x: 24, y: 24, w: 320, h: 420,
      },
      'ws-1': {
        id: 'ws-1', kind: 'workspace', title: '工作区 1', locked: false,
        dir: WORKSPACE_DIRS[0], model: 'our-free-model/openai/gpt-oss-20b',
        modelProvider: 'our-free-model', modelId: 'openai/gpt-oss-20b', modelLabel: 'EAC GPT-OSS 20B',
        session: null, sessions: [],
        x: 360, y: 24, w: 320, h: 420,
      },
      'ws-2': {
        id: 'ws-2', kind: 'workspace', title: '工作区 2', locked: false,
        dir: WORKSPACE_DIRS[1], model: 'our-free-model/z-ai/glm-5.3-flash',
        modelProvider: 'our-free-model', modelId: 'z-ai/glm-5.3-flash', modelLabel: 'EAC GLM 5.3 Flash',
        session: null, sessions: [],
        x: 696, y: 24, w: 320, h: 420,
      },
      'ws-3': {
        id: 'ws-3', kind: 'workspace', title: '工作区 3', locked: false,
        dir: WORKSPACE_DIRS[2], model: 'our-free-model/z-ai/glm-5.3',
        modelProvider: 'our-free-model', modelId: 'z-ai/glm-5.3', modelLabel: 'EAC GLM 5.3',
        session: null, sessions: [],
        x: 1032, y: 24, w: 320, h: 420,
      },
    },
  }
}

function ensureDirs() {
  const dir = path.dirname(STATE_FILE())
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(TRAIL_DIR, { recursive: true })
}

function loadState() {
  let state
  try {
    const raw = fs.readFileSync(STATE_FILE(), 'utf8')
    state = JSON.parse(raw)
  } catch {
    state = defaultCards()
  }

  const fresh = defaultCards()
  if (!state.order || !Array.isArray(state.order) || state.order.length === 0) state.order = fresh.order
  if (state.theme === undefined) state.theme = fresh.theme
  if (!state.cards || typeof state.cards !== 'object') state.cards = fresh.cards

  const MODEL_FIX = {
    'eac/gpt-oss-20b': 'our-free-model/openai/gpt-oss-20b',
    'eac/glm-5.3-flash': 'our-free-model/z-ai/glm-5.3-flash',
    'eac/glm-5.3': 'our-free-model/z-ai/glm-5.3',
  }
  for (const card of Object.values(state.cards)) {
    if (card?.model && MODEL_FIX[card.model]) {
      const real = MODEL_FIX[card.model]
      const slash = real.indexOf('/')
      card.model = real
      card.modelProvider = real.slice(0, slash)
      card.modelId = real.slice(slash + 1)
      card.modelLabel = card.modelLabel?.replace(/^GPT-OSS/, 'EAC GPT-OSS').replace(/^GLM/, 'EAC GLM')
    }
  }
  let i = 0
  for (const id of state.order) {
    const card = state.cards[id]
    const def = fresh.cards[id] ?? fresh.cards['ws-1']
    if (!card) { state.cards[id] = { ...def, id }; continue }
    if (card.dir === undefined) card.dir = def.dir
    if (card.x === undefined) card.x = 24 + i * 336
    if (card.y === undefined) card.y = def.y
    if (card.w === undefined) card.w = def.w
    if (card.h === undefined) card.h = def.h
    i += 1
  }
  return state
}

function saveState(state) {
  const tmp = STATE_FILE() + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, STATE_FILE())
}

function escapeHtml(s) {
  return String(s)
    .replaceAll(String.fromCharCode(38), String.fromCharCode(38) + 'amp;')
    .replaceAll(String.fromCharCode(60), String.fromCharCode(38) + 'lt;')
    .replaceAll(String.fromCharCode(62), String.fromCharCode(38) + 'gt;')
}

let trailIndex = 1
let trailBytes = 0
let trailDirty = false
let trailTimer = null

function trailFilePath(i) { return path.join(TRAIL_DIR, `trail-${String(i).padStart(4, '0')}.html`) }

function trailCurrentFile() { return trailFilePath(trailIndex) }

function trailHead() {
  const title = `CardVerse 轨迹 · 第 ${trailIndex} 片`
  return [
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">',
    `<title>${title}</title>`,
    '<style>',
    'body{font-family:"Segoe UI",system-ui,sans-serif;margin:0;background:#0f1420;color:#dbe4f0}',
    'header{position:sticky;top:0;background:#0f1420ee;padding:10px 16px;border-bottom:1px solid #2a3550;backdrop-filter:blur(8px)}',
    'h1{margin:0;font-size:16px}h1 small{color:#7f8db0;font-weight:400}',
    '.ev{padding:10px 16px;border-left:3px solid #3b82f6;margin:8px 16px;background:#161e3088;border-radius:0 8px 8px 0}',
    '.ev.user{border-color:#22c55e}.ev.model{border-color:#3b82f6}.ev.sys{border-color:#f59e0b}',
    '.ev .t{color:#7f8db0;font-size:12px;margin-bottom:4px}',
    '.ev .m{white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.55}',
    'footer{padding:12px 16px;color:#5c6a8f;font-size:12px;text-align:center}',
    '</style></head><body>',
    `<header><h1>🃏 CardVerse 轨迹 <small>· 第 ${trailIndex} 片 · 满片自动换下一页</small></h1></header>`,
    '<main>',
    '',
  ].join('\n')
}

function trailFoot() {
  return [
    '',
    '</main>',
    `<footer>CardVerse · 单片上限 10MB（9.4MB 滚动） · ${new Date().toISOString()}</footer>`,
    '</body></html>',
  ].join('\n')
}

function trailInit() {
  ensureDirs()
  let i = 1
  while (fs.existsSync(trailFilePath(i))) i += 1
  trailIndex = Math.max(1, i - 1)
  const cur = trailCurrentFile()
  if (!fs.existsSync(cur)) {
    fs.writeFileSync(cur, trailHead() + trailFoot())
  }
  trailBytes = fs.statSync(cur).size
}

function trailAppend(kind, card, who, text) {
  try {
    const now = new Date()
    const hhmm = now.toLocaleTimeString('zh-CN', { hour12: false })
    const esc = escapeHtml(String(text ?? ''))
    const cardName = escapeHtml(String(card ?? ''))
    const line = [
      `<div class="ev ${kind}">`,
      `  <div class="t">${hhmm} · ${cardName} · ${who}</div>`,
      `  <div class="m">${esc}</div>`,
      '</div>',
    ].join('\n') + '\n'
    const lineBytes = Buffer.byteLength(line, 'utf8')

    if (trailBytes + lineBytes > TRAIL_ROLL_BYTES) {
      trailRoll()
    }
    const cur = trailCurrentFile()

    fs.appendFileSync(cur, line)
    trailBytes += lineBytes
    trailDirty = true
    scheduleTrailFlush()
  } catch (error) {
    bootLog(`trail append failed: ${String(error)}`)
  }
}

function trailRoll() {
  try {
    const cur = trailCurrentFile()
    fs.appendFileSync(cur, trailFoot())
    trailIndex += 1
    const next = trailCurrentFile()
    fs.writeFileSync(next, trailHead() + trailFoot())
    trailBytes = fs.statSync(next).size
    trailDirty = false
    bootLog(`trail rolled to #${trailIndex}`)
  } catch (error) {
    bootLog(`trail roll failed: ${String(error)}`)
  }
}

function scheduleTrailFlush() {
  if (trailTimer) return
  trailTimer = setTimeout(() => {
    trailTimer = null
    if (!trailDirty) return
    try {
      const cur = trailCurrentFile()

      const body = fs.readFileSync(cur, 'utf8')
      const cut = body.lastIndexOf('</main>')
      if (cut >= 0) {
        const headPart = body.slice(0, cut)
        fs.writeFileSync(cur, headPart + trailFoot())
      }
      trailDirty = false
    } catch (error) {
      bootLog(`trail flush failed: ${String(error)}`)
    }
  }, 5000)
}

function startTrailServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname === '/' || url.pathname === '/index.html') {

      const files = listTrailFiles()
      const rows = files.map((f) => {
        const idx = f.match(/trail-(\d+)\.html/)?.[1] ?? '?'
        const size = fs.statSync(path.join(TRAIL_DIR, f)).size
        return `<li><a href="/${f}">第 ${Number(idx)} 片</a> <small>${(size / 1048576).toFixed(2)} MB</small></li>`
      }).join('\n')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>CardVerse 轨迹索引</title>
<style>body{font-family:system-ui;background:#0f1420;color:#dbe4f0;margin:0;padding:24px}h1{font-size:18px}
li{margin:8px 0}a{color:#7ab8ff;text-decoration:none}small{color:#7f8db0}</style></head><body>
<h1>🃏 CardVerse 轨迹 · 分片索引</h1><ul>${rows}</ul></body></html>`)
      return
    }
    const m = url.pathname.match(/^\/(trail-\d+\.html)$/)
    if (m) {
      const file = path.join(TRAIL_DIR, m[1])
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return }

      let body = fs.readFileSync(file, 'utf8')
      if (!body.endsWith('</html>')) {
        const cut = body.lastIndexOf('</main>')
        if (cut >= 0) body = body.slice(0, cut) + trailFootFor(file)
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(body)
      return
    }
    res.writeHead(404); res.end('not found')
  })
  server.on('error', (error) => bootLog(`trail server error: ${String(error)}`))

  let attempts = 0
  const tryListen = () => {
    if (supersededFlag) return
    attempts += 1
    bootLog(`trail listen attempt ${attempts}`)
    server.listen(TRAIL_PORT, '127.0.0.1', () => {
      bootLog(`trail server listening on http://127.0.0.1:${TRAIL_PORT}`)
    })
  }
  server.on('error', (error) => {
    if (String(error).includes('EADDRINUSE') && attempts < 60 && !supersededFlag) {
      setTimeout(() => {
        try { server.close() } catch { }
        tryListen()
      }, 500)
    }
  })
  tryListen()
  return server
}

function trailFootFor(file) {
  const idx = path.basename(file).match(/trail-(\d+)\.html/)?.[1] ?? '?'
  return [
    '',
    '</main>',
    `<footer>CardVerse · 单片上限 10MB（9.4MB 滚动） · ${new Date().toISOString()}</footer>`,
    '</body></html>',
  ].join('\n')
}

function listTrailFiles() {
  try {
    return fs.readdirSync(TRAIL_DIR)
      .filter((f) => /^trail-\d+\.html$/.test(f))
      .sort()
  } catch { return [] }
}

let bountyTimer = null
let lastBountyId = ''

async function pollBountyOnce() {
  if (!WORKBENCH) return
  try {
    const res = await fetch(`${WORKBENCH}${BOUNTY_VIEW_PATH}`, { signal: AbortSignal.timeout(4000) })
    const j = await res.json()
    const b = j?.bounty
    const key = b ? `${b.text}|${b.open_ts}|${b.winner ?? ''}` : ''
    if (key && key !== lastBountyId) {
      lastBountyId = key
      if (b.status === 'open' && !b.winner) {
        pushEvent({ kind: 'bounty', bounty: b, text: `悬赏开放：${b.text}（${b.points} 分）` })
        trailAppend('sys', '群发大厅', '悬赏', `开放：${b.text}（${b.points}分）`)
      } else if (b.winner) {
        pushEvent({ kind: 'bounty', bounty: b, text: `${b.winner} 抢到了「${b.text}」（开放后 ${b.win_ms} ms）` })
        trailAppend('sys', '群发大厅', '悬赏', `${b.winner} 抢到「${b.text}」 (${b.win_ms}ms)`)
      }
    }
  } catch {

  }
}

function startBountyPoller() {
  pollBountyOnce()
  bountyTimer = setInterval(pollBountyOnce, 5000)
}

const WECHAT_SEND = path.join(
  process.env.DSH_HOME || path.join(os_home(), '.dsh'),
  'profiles', 'desktop', 'node_modules', '.bin', 'dsh-wechat-send.CMD',
)
let wechatAvailable = null

function wechatProbe() {
  if (wechatAvailable !== null) return wechatAvailable
  wechatAvailable = fs.existsSync(WECHAT_SEND)
  if (!wechatAvailable) bootLog('wechat mirror OFF: dsh-wechat-send not found')
  return wechatAvailable
}

let lastWechatAt = 0
const WECHAT_MIN_GAP_MS = 20_000

function mirrorToWechat(title, text) {
  if (!wechatProbe()) return
  const body = String(text ?? '').trim()
  if (!body) return
  const now = Date.now()
  if (now - lastWechatAt < WECHAT_MIN_GAP_MS) return
  lastWechatAt = now
  const clipped = body.length > 900 ? `${body.slice(0, 900)}\n…（截断）` : body
  const msg = `[${title}]\n${clipped}`
  try {
    const child = spawn('cmd', ['/c', WECHAT_SEND, msg], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    child.on('error', () => { wechatAvailable = false })
    child.unref()
  } catch (error) {
    bootLog(`wechat mirror spawn failed: ${String(error)}`)
  }
}

const sseClients = new Set()
const pendingEvents = []

function pushEvent(ev) {
  const payload = JSON.stringify({ ...ev, ts: Date.now() })
  pendingEvents.push(payload)
  if (pendingEvents.length > 200) pendingEvents.shift()
  for (const res of sseClients) {
    try { res.write(`data: ${payload}\n\n`) } catch { }
  }
}

function handleSse(req, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-store, must-revalidate',
    'connection': 'keep-alive',
    'x-accel-buffering': 'no',
  })
  res.write('retry: 3000\n\n')

  for (const p of pendingEvents.slice(-20)) res.write(`data: ${p}\n\n`)
  sseClients.add(res)
  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n') } catch { }
  }, 15000)
  req.on('close', () => {
    clearInterval(keepAlive)
    sseClients.delete(res)
  })
}

function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(obj))
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  try {
    for await (const chunk of req) {
      chunks.push(chunk)
      if (chunks.length > 4096) break
    }
  } catch {
    return {}
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

async function storedSessionWorkspace(sessionId) {
  const home = process.env.DSH_HOME || path.join(os_home(), '.dsh')
  const indexDir = path.join(home, 'storages', 'session_projcache', 'sessions')
  const bare = sessionId.replace(/^session-/, '')
  for (const name of [`${sessionId}.json`, `${bare}.json`]) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(indexDir, name), 'utf8'))
      const cwd = parsed?.record?.identity?.cwd
      if (typeof cwd === 'string' && cwd !== '') return cwd
    } catch { }
  }
  return undefined
}

async function ensureSession(ctx, sessionController, sessionId) {
  if (!sessionController || !sessionId) return false
  const home = await storedSessionWorkspace(sessionId)
  try {
    if (home === undefined) {

      await sessionController.create({ sessionId, cwd: process.cwd() })
    } else {

      let workspaceId = ''
      const registry = ctx[Symbol.for('cardverse.workspaceRegistry')]
      if (registry) {
        try {
          const ws = (await registry.resolveByPath(home)) ?? (await registry.create(home))
          workspaceId = ws?.id ?? ''
        } catch { }
      }
      if (workspaceId !== '') {
        await sessionController.create({ sessionId, workspaceId })
      } else {
        await sessionController.create({ sessionId, cwd: home })
      }
    }
    return true
  } catch (error) {

    bootLog(`ensureSession ${sessionId}: ${String(error && error.message || error)}`)
    return true
  }
}

function dispatchPrompt(sessionController, sessionId, text) {
  if (!sessionController || !sessionId) return false
  try {
    void sessionController.prompt({
      requestId: `cardverse-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      mode: 'queue',
      content: [{ type: 'text', text }],
    }, new AbortController().signal).catch((error) => {
      bootLog(`prompt dispatch failed: ${String(error)}`)
    })
    return true
  } catch (error) {
    bootLog(`prompt dispatch threw: ${String(error)}`)
    return false
  }
}

const FLAG_FILE = path.join(path.dirname(STATE_FILE()), 'instance.flag')
let activeBootId = ''
let supersededFlag = false
let retireTimer = null
let routeRetryTimer = null
let trailServerRef = null
const pendingUnregisters = new Set()

function writeBootFlag() {
  activeBootId = `cv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  try {
    fs.mkdirSync(path.dirname(FLAG_FILE), { recursive: true })
    fs.writeFileSync(FLAG_FILE, JSON.stringify({ bootId: activeBootId, ts: Date.now() }))
  } catch (error) {
    bootLog(`boot flag write failed: ${String(error)}`)
  }
}

function flagSaysSuperseded() {
  try {
    const flag = JSON.parse(fs.readFileSync(FLAG_FILE, 'utf8'))
    return typeof flag?.bootId === 'string' && flag.bootId !== activeBootId
  } catch { return false }
}

function standDown(reason) {
  if (supersededFlag) return
  supersededFlag = true
  bootLog(`standing down: ${reason}`)
  for (const t of [retireTimer, routeRetryTimer, bountyTimer, trailTimer]) {
    if (!t) continue
    try { clearInterval(t) } catch { }
    try { clearTimeout(t) } catch { }
  }
  try { trailServerRef?.closeAllConnections?.() } catch { }
  try { trailServerRef?.close?.() } catch { }
  for (const res of sseClients) { try { res.end() } catch { } }
  sseClients.clear()
  for (const un of pendingUnregisters) { try { un() } catch { } }
  pendingUnregisters.clear()
  bootLog('stand-down complete (passive husk; successor owns routes/port)')
}

function registerRoutes(ctx, state) {
  const PREFIX = '/.cardverse'

  ctx.effect(() => {
    const webServer = ctx.webServer
    const unregisters = []
    const busyRoutes = []

    const registerOnce = (methods, sub, handler) => webServer.register({
      kind: 'exact',
      path: `${PREFIX}${sub}`,
      handler: async (req, res) => {
        if (!methods.includes(req.method ?? 'GET')) {
          return json(res, 405, { ok: false, error: `method ${req.method} not allowed (want ${methods.join('/')})` })
        }
        try {
          await handler(req, res)
        } catch (error) {
          bootLog(`route ${methods.join('/')} ${sub} failed: ${String(error && error.message || error)}`)
          if (!res.headersSent) return json(res, 500, { ok: false, error: String(error && error.message || error) })
          try { res.end() } catch { }
        }
      },
    })

    const add = (method, sub, handler) => {
      const methods = Array.isArray(method) ? method : [method]
      try {
        const un = registerOnce(methods, sub, handler)
        unregisters.push(un)
        pendingUnregisters.add(un)
      } catch (error) {

        busyRoutes.push([methods, sub, handler])
        bootLog(`route busy (queued): ${PREFIX}${sub} — ${String(error && error.message || error)}`)
      }
    }

    add('GET', '/state', (req, res) => {
      json(res, 200, {
        ok: true,
        order: state.order,
        cards: state.cards,
        theme: state.theme ?? 'aurora',
        models: MODELS,
        themes: THEMES,
        dirs: WORKSPACE_DIRS,
        trail: { port: TRAIL_PORT, files: listTrailFiles() },
      })
    })

    add('POST', '/theme', async (req, res) => {
      const b = await readBody(req)
      const t = THEMES.find((x) => x.id === b.theme)
      if (!t) return json(res, 400, { ok: false, error: 'unknown theme' })
      state.theme = t.id
      saveState(state)
      pushEvent({ kind: 'theme', theme: t.id })
      json(res, 200, { ok: true, theme: t })
    })

    add('POST', '/move', async (req, res) => {
      const b = await readBody(req)

      if (b.positions && typeof b.positions === 'object') {
        let n = 0
        for (const [id, pos] of Object.entries(b.positions)) {
          const card = state.cards[id]
          if (!card || card.locked || typeof pos !== 'object') continue
          if (Number.isFinite(pos.x)) card.x = Math.max(0, Math.round(pos.x))
          if (Number.isFinite(pos.y)) card.y = Math.max(0, Math.round(pos.y))
          if (Number.isFinite(pos.w)) card.w = Math.min(640, Math.max(260, Math.round(pos.w)))
          if (Number.isFinite(pos.h)) card.h = Math.min(900, Math.max(220, Math.round(pos.h)))
          n += 1
        }
        if (n === 0) return json(res, 400, { ok: false, error: '没有可移动的卡片' })
        saveState(state)
        pushEvent({ kind: 'cards', text: '卡片位置已保存' })
        return json(res, 200, { ok: true, n })
      }

      const card = state.cards[String(b.id ?? '')]
      if (!card) return json(res, 404, { ok: false, error: 'no such card' })
      if (card.locked) return json(res, 403, { ok: false, error: '首卡（群发大厅）锁死不能动' })
      if (Number.isFinite(b.x)) card.x = Math.max(0, Math.round(b.x))
      if (Number.isFinite(b.y)) card.y = Math.max(0, Math.round(b.y))
      if (Number.isFinite(b.w)) card.w = Math.min(640, Math.max(260, Math.round(b.w)))
      if (Number.isFinite(b.h)) card.h = Math.min(900, Math.max(220, Math.round(b.h)))
      saveState(state)
      pushEvent({ kind: 'cards', text: '卡片位置已更新' })
      json(res, 200, { ok: true, card })
    })

    add('POST', '/bind', async (req, res) => {
      const b = await readBody(req)
      const { id } = b
      const card = state.cards[id]
      if (!card || card.kind !== 'workspace') return json(res, 404, { ok: false, error: 'no such workspace card' })
      const sc = getSessionController(ctx)

      let provider = b.provider
      let modelId = b.model
      let label = b.label
      if (!provider && typeof b.model === 'string') {
        const idx = b.model.indexOf('/')
        if (idx > 0) { provider = b.model.slice(0, idx); modelId = b.model.slice(idx + 1) }
        else { provider = b.model; modelId = b.model }
      }
      if (!provider || !modelId) return json(res, 400, { ok: false, error: '要 provider + model（或 "provider/model"）' })

      if (card.session && sc) {
        try {
          const read = await sc.projections?.({ sessionId: card.session }, new AbortController().signal)
          const sel = read?.values?.modelSelection
          const inUse = sel?.next && (sel.next.provider !== '' || sel.next.model !== '')
          const sameModel = inUse && sel.next.provider === provider && sel.next.model === modelId
          if (sameModel) {
            card.model = `${provider}/${modelId}`
            card.modelProvider = provider
            card.modelId = modelId
            card.modelLabel = label || card.modelLabel || `${provider}/${modelId}`
            saveState(state)
            return json(res, 200, { ok: true, card, switched: true, idempotent: true, detail: '会话本来就是这个模型' })
          }
        } catch { }
      }

      card.model = `${provider}/${modelId}`
      card.modelProvider = provider
      card.modelId = modelId
      card.modelLabel = label || card.modelLabel || `${provider}/${modelId}`

      card.effort = typeof b.effort === 'string' && b.effort ? b.effort : card.effort
      saveState(state)

      let switched = false
      let switchError = ''
      if (card.session && sc) {
        try {
          await sc.selectModel({
            sessionId: card.session,
            provider,
            model: modelId,
            ...(card.effort ? { reasoningEffort: card.effort } : {}),
          })
          switched = true
        } catch (error) {
          switchError = String(error?.message ?? error)
          bootLog(`selectModel failed: ${switchError}`)
        }
      }
      pushEvent({ kind: 'cards', text: `「${card.title}」绑定 ${card.modelLabel}${card.effort ? ` · ${card.effort}` : ''}` })
      json(res, 200, { ok: true, card, switched, error: switchError || undefined })
    })

    add('POST', '/title', async (req, res) => {
      const b = await readBody(req)
      const { id, title } = b
      const card = state.cards[id]
      if (!card || card.locked) return json(res, 403, { ok: false, error: 'locked card' })
      card.title = String(title || card.title).slice(0, 24)
      saveState(state)
      json(res, 200, { ok: true, card })
    })

    add('POST', '/session', async (req, res) => {
      const b = await readBody(req)
      const { id, sessionId, action } = b
      const card = state.cards[id]
      if (!card || card.kind !== 'workspace') return json(res, 404, { ok: false, error: 'no such workspace card' })
      if (action === 'list') {

        const sc = getSessionController(ctx)
        let rows = []
        try {
          const list = await sc?.list?.() ?? []
          rows = list
            .map((s) => ({
              id: s.id ?? s.sessionId,
              title: s.title ?? s.name ?? s.id,
              cwd: s.cwd,
            }))
            .filter((s) => s.id)
        } catch {
          rows = []
        }

        if (rows.length === 0) rows = scanDiskSessions()

        return json(res, 200, { ok: true, sessions: card.sessions, available: rows, dir: card.dir })
      }
      if (action === 'use') {
        if (!card.sessions.includes(sessionId)) card.sessions.push(sessionId)
        card.session = sessionId
        saveState(state)
        pushEvent({ kind: 'cards', text: `「${card.title}」切到会话 ${sessionId}` })
        const sc2 = getSessionController(ctx)

        const adopted = await ensureSession(ctx, sc2, sessionId)

        if (adopted && sc2?.selectModel && card.modelProvider && card.modelId) {
          try {
            await sc2.selectModel({
              sessionId,
              provider: card.modelProvider,
              model: card.modelId,
              ...(card.effort ? { reasoningEffort: card.effort } : {}),
            })
          } catch (error) {
            bootLog(`selectModel on session-use failed: ${String(error)}`)
          }
        }
        return json(res, 200, { ok: true, card, adopted })
      }
      if (action === 'drop') {
        card.sessions = card.sessions.filter((s) => s !== sessionId)
        if (card.session === sessionId) card.session = card.sessions[0] ?? null
        saveState(state)
        return json(res, 200, { ok: true, card })
      }
      json(res, 400, { ok: false, error: 'unknown action' })
    })

    add(['GET', 'POST'], '/hall', async (req, res) => {
      if ((req.method ?? 'GET') === 'GET') {
        const url = new URL(req.url, 'http://x')
        const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 50))
        const hall = Array.isArray(state.hall) ? state.hall : []
        return json(res, 200, { ok: true, messages: hall.slice(-limit) })
      }
      const b = await readBody(req)
      const who = String(b.who || '老板').slice(0, 32)
      const text = String(b.text || '').trim()
      if (!text) return json(res, 400, { ok: false, error: 'empty text' })
      if (!Array.isArray(state.hall)) state.hall = []
      const msg = { who, text: text.slice(0, 2000), ts: Date.now() }
      state.hall.push(msg)
      if (state.hall.length > 300) state.hall.splice(0, state.hall.length - 300)
      saveState(state)
      pushEvent({ kind: 'hall', hall: msg })
      trailAppend('user', '群发大厅', who, text)
      json(res, 200, { ok: true, message: msg })
    })

    add('POST', '/broadcast', async (req, res) => {
      const b = await readBody(req)
      const text = String(b.text || '').trim()
      if (!text) return json(res, 400, { ok: false, error: 'empty text' })
      const who = String(b.who || '老板').slice(0, 32)

      if (!Array.isArray(state.hall)) state.hall = []
      const msg = { who, text: text.slice(0, 2000), ts: Date.now() }
      state.hall.push(msg)
      if (state.hall.length > 300) state.hall.splice(0, state.hall.length - 300)
      saveState(state)
      pushEvent({ kind: 'hall', hall: msg })
      trailAppend('user', '群发大厅', who, text)

      const sc = getSessionController(ctx)
      const results = []
      for (const id of state.order) {
        const card = state.cards[id]
        if (card.kind !== 'workspace' || !card.session) continue
        await ensureSession(ctx, sc, card.session)
        const ok = dispatchPrompt(sc, card.session, text)
        results.push({ card: id, session: card.session, ok })
      }
      pushEvent({ kind: 'broadcast', text })
      json(res, 200, { ok: true, dispatched: results, message: msg })
    })

    add('POST', '/post', async (req, res) => {
      const b = await readBody(req)
      const card = state.cards[String(b.card ?? '')]
      const text = String(b.text ?? '').trim()
      if (!card || card.kind !== 'workspace') return json(res, 404, { ok: false, detail: 'no such workspace card' })
      if (!text) return json(res, 400, { ok: false, detail: 'empty text' })
      if (!card.session) return json(res, 409, { ok: false, detail: '这张卡还没绑定会话' })

      const sc = getSessionController(ctx)
      await ensureSession(ctx, sc, card.session)
      const ok = dispatchPrompt(sc, card.session, text)
      trailAppend('user', card.title, '老板', text)
      pushEvent({ kind: 'post', card: card.id, text })
      json(res, 200, { ok, dispatched: ok, detail: ok ? `已发到 ${card.title}` : '派发失败（sessionController 未就绪）' })
    })

    add('POST', '/trail', async (req, res) => {
      const b = await readBody(req)
      const title = String(b.title ?? b.card ?? '工作区')
      const events = Array.isArray(b.events) ? b.events : []
      for (const ev of events) {
        if (!ev || typeof ev !== 'object') continue
        const kind = ev.kind === 'tool' ? 'tool' : 'model'
        const who = kind === 'tool' ? `工具 ${ev.tool ?? '?'}` : '模型'
        const body = kind === 'tool'
          ? `${ev.tool ?? '?'} ${String(ev.args ?? '').slice(0, 260)}`
          : String(ev.text ?? '').slice(0, 400)
        trailAppend('model', title, who, body)
      }
      json(res, 200, { ok: true, n: events.length })
    })

    add('GET', '/models', async (req, res) => {
      const sc = getSessionController(ctx)
      if (!sc?.modelCatalog) return json(res, 200, { ok: true, models: MODELS, live: false })
      try {
        const catalog = await sc.modelCatalog()
        const flat = []
        for (const group of catalog.groups ?? []) {
          for (const m of group.models ?? []) {
            flat.push({
              id: `${group.id}/${m.id}`,
              label: m.name ?? m.id,
              provider: group.id,
              model: m.id,

              efforts: m.reasoning?.efforts?.map((e) => ({ id: e.id, name: e.name ?? e.id })) ?? [],
              defaultEffort: m.reasoning?.defaultEffort ?? null,
            })
          }
        }
        json(res, 200, {
          ok: true,
          models: flat.length ? flat : MODELS,
          live: flat.length > 0,
          default: catalog.default ? `${catalog.default.provider}/${catalog.default.model}` : null,
        })
      } catch (error) {
        bootLog(`modelCatalog failed: ${String(error)}`)
        json(res, 200, { ok: true, models: MODELS, live: false })
      }
    })

    add('GET', '/bounty', async (req, res) => {
      if (!WORKBENCH) return json(res, 200, { ok: false, error: 'bounty workbench not configured (set DSH_CARDVERSE_WORKBENCH)' })
      try {
        const r = await fetch(`${WORKBENCH}${BOUNTY_VIEW_PATH}`, { signal: AbortSignal.timeout(4000) })
        const j = await r.json()
        json(res, 200, j)
      } catch (error) {
        json(res, 200, { ok: false, error: String(error) })
      }
    })

    add('POST', '/bounty/grab', async (req, res) => {
      if (!WORKBENCH) return json(res, 200, { ok: false, error: 'bounty workbench not configured (set DSH_CARDVERSE_WORKBENCH)' })
      try {
        const r = await fetch(`${WORKBENCH}${BOUNTY_GRAB_PATH}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ who: BOUNTY_GRAB_WHO }),
          signal: AbortSignal.timeout(4000),
        })
        const j = await r.json()
        trailAppend('sys', '群发大厅', 'bounty', `抢单结果：${JSON.stringify(j)}`)
        json(res, 200, j)
      } catch (error) {
        json(res, 200, { ok: false, error: String(error) })
      }
    })

    add('GET', '/events', (req, res) => handleSse(req, res))

    const IGNORED = new Set(['node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information', '.DS_Store', 'Thumbs.db'])
    const TEXT_EXT = new Set(['.txt', '.md', '.json', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.html', '.css', '.py', '.ps1', '.bat', '.cmd', '.sh', '.yml', '.yaml', '.xml', '.log', '.ini', '.csv', '.sql', '.env', '.gitignore'])
    const MAX_FILE_BYTES = 256 * 1024

    const listDir = (dir, sub = '') => {
      const base = path.resolve(dir, sub)

      if (!base.startsWith(path.resolve(dir))) return { ok: false, error: 'bad path' }
      let entries
      try {
        entries = fs.readdirSync(base, { withFileTypes: true })
      } catch (error) {
        return { ok: false, error: `读不了目录：${String(error && error.message || error)}` }
      }
      const items = []
      for (const e of entries) {
        if (IGNORED.has(e.name) || e.name.startsWith('session-')) continue
        let size = 0, mtime = null
        try {
          const st = fs.statSync(path.join(base, e.name))
          size = st.size
          mtime = st.mtimeMs
        } catch { }
        items.push({ name: e.name, dir: e.isDirectory(), size, mtime })
      }
      items.sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name, 'zh'))
      return { ok: true, path: base, items }
    }
    const readWorkspaceFile = (dir, sub) => {
      const base = path.resolve(dir, sub ?? '')
      if (!base.startsWith(path.resolve(dir))) return { ok: false, error: 'bad path' }
      let st
      try {
        st = fs.statSync(base)
      } catch (error) {
        return { ok: false, error: `文件不存在：${String(error && error.message || error)}` }
      }
      if (st.size > MAX_FILE_BYTES) {

        const buf = fs.readFileSync(base)
        return { ok: true, name: path.basename(base), size: st.size, truncated: true, text: buf.subarray(0, MAX_FILE_BYTES).toString('utf8') + '\n…（文件太大，已截断）' }
      }
      const ext = path.extname(base).toLowerCase()
      if (!TEXT_EXT.has(ext) && !st.isDirectory()) {
        return { ok: true, name: path.basename(base), size: st.size, binary: true, text: `（${ext || '无扩展名'} 文件 ${st.size} 字节，二进制不展示）` }
      }
      return { ok: true, name: path.basename(base), size: st.size, text: fs.readFileSync(base, 'utf8') }
    }
    add('GET', '/files', async (req, res) => {
      const url = new URL(req.url, 'http://x')
      const id = url.searchParams.get('card')
      const sub = url.searchParams.get('path') || ''
      const card = state.cards[String(id ?? '')]
      if (!card || card.kind !== 'workspace' || !card.dir) return json(res, 404, { ok: false, error: 'no such workspace card' })
      json(res, 200, listDir(card.dir, sub))
    })
    add('GET', '/file', async (req, res) => {
      const url = new URL(req.url, 'http://x')
      const id = url.searchParams.get('card')
      const sub = url.searchParams.get('path') || ''
      const card = state.cards[String(id ?? '')]
      if (!card || card.kind !== 'workspace' || !card.dir) return json(res, 404, { ok: false, error: 'no such workspace card' })
      json(res, 200, readWorkspaceFile(card.dir, sub))
    })

    if (busyRoutes.length) {
      let round = 0
      const retry = () => {
        round += 1
        if (supersededFlag) return
        const still = []
        for (const [methods, sub, handler] of busyRoutes) {
          try {
            const un = registerOnce(methods, sub, handler)
            unregisters.push(un)
            pendingUnregisters.add(un)
          } catch {
            still.push([methods, sub, handler])
          }
        }
        if (still.length && round < 60) {
          routeRetryTimer = setTimeout(retry, 500)
        } else if (!still.length) {
          bootLog(`routes takeover complete: +${busyRoutes.length} paths (round ${round})`)
        } else {
          bootLog(`route takeover gave up: ${still.length} paths still busy`)
        }
      }
      routeRetryTimer = setTimeout(retry, 500)
    }

    bootLog(`routes ready: ${unregisters.length} paths${busyRoutes.length ? ` (${busyRoutes.length} queued for takeover)` : ''}`)
    return () => {
      for (const u of unregisters) {
        try { u() } catch { }
        pendingUnregisters.delete(u)
      }
    }
  }, 'cardverse: web routes')
}

function syncPositions(state) {
  state.order.forEach((id, i) => {
    const card = state.cards[id]
    if (card) card.position = i
  })
}

function scanDiskSessions() {
  const home = process.env.DSH_HOME || path.join(os_home(), '.dsh')
  const sessionsRoot = path.join(home, 'sessions')
  const indexDir = path.join(home, 'storages', 'session_projcache', 'sessions')
  const rows = []
  try {
    const folders = fs.readdirSync(sessionsRoot, { withFileTypes: true }).filter((d) => d.isDirectory())
    for (const folder of folders) {
      let ids = []
      try {
        ids = fs.readdirSync(path.join(sessionsRoot, folder.name), { withFileTypes: true })
          .filter((e) => e.isDirectory() && e.name.startsWith('session-'))
          .map((e) => e.name)
      } catch { continue }
      for (const sessionId of ids) {

        const bare = sessionId.replace(/^session-/, '')
        let title = '', cwd = '', updatedAt = 0
        for (const name of [`${sessionId}.json`, `${bare}.json`]) {
          try {
            const parsed = JSON.parse(fs.readFileSync(path.join(indexDir, name), 'utf8'))
            const t = parsed?.record?.rows?.title?.val
            title = typeof t === 'string' ? t : ''
            cwd = parsed?.record?.identity?.cwd ?? ''
            const at = parsed?.record?.rows?.sessionListMetadata?.val?.lastPromptAt
            updatedAt = typeof at === 'number' ? at : (parsed?.record?.identity?.createdAt ?? 0)
            break
          } catch { }
        }
        rows.push({ id: sessionId, title: title || bare.slice(0, 12), cwd, updatedAt })
      }
    }
  } catch { }

  rows.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  return rows
}

function getSessionController(ctx) {

  const cached = ctx[Symbol.for('cardverse.sessionController')]
  if (cached) return cached

  try {
    const via = ctx.get?.('sessionController')
    if (via) return via
  } catch { }

  try {
    const direct = ctx.sessionController
    if (direct) return direct
  } catch { }
  return undefined
}

function registerCardTools(ctx, state) {
  const tools = ctx.tools
  if (tools === undefined) {
    bootLog('no tools service; card awareness not registered')
    return () => {}
  }

  const disposers = []

  const listTool = tools.register({
    name: 'cards_list',
    description: 'List every card in the CardVerse workspace board: id, title, kind (hall/workspace), bound model, current session and all sessions of that workspace, and position. The first card is the broadcast hall (群发大厅) and cannot move.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { detail: { type: 'string' } },
        required: ['detail'],
      },
      render: () => [{ type: 'text', text: 'listed cards' }],
    },
    execute: async () => {
      const lines = []
      for (const id of state.order) {
        const c = state.cards[id]
        if (!c) continue
        const sessions = c.sessions.length ? c.sessions.join(', ') : '（无）'
        lines.push(`${c.position}. ${c.title} [${c.kind}]${c.locked ? ' 🔒' : ''} model=${c.model ?? '-'} 当前会话=${c.session ?? '-'} 会话列表=[${sessions}]`)
      }
      return { detail: lines.join('\n') }
    },
  })
  disposers.push(listTool)

  const readTool = tools.register({
    name: 'cards_read',
    description: 'Read the trail (conversation history) of another card. Pass the card id (from cards_list) to see its recent trail entries. Use this to know what other workspaces are doing.',
    parameters: {
      type: 'object',
      properties: {
        card: { type: 'string', description: 'Card id, e.g. "ws-2". Empty = all recent.' },
        limit: { type: 'number', description: 'Max entries, default 20.' },
      },
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { detail: { type: 'string' } },
        required: ['detail'],
      },
      render: () => [{ type: 'text', text: 'read card trail' }],
    },
    execute: async (args) => {
      const limit = Math.max(1, Math.min(100, Number(args.limit) || 20))
      const card = args.card ? state.cards[String(args.card)] : undefined
      const trail = trailRecent(limit, card ? card.id : undefined)
      return { detail: trail || '（还没有轨迹）' }
    },
  })
  disposers.push(readTool)

  const postTool = tools.register({
    name: 'card_post',
    description: 'Post a message to a card (workspace). If the card has a current session, the message is dispatched into that conversation. Also records to the trail. Use it to reply to the boss in the hall or to send work to another workspace.',
    parameters: {
      type: 'object',
      properties: {
        card: { type: 'string', description: 'Card id, e.g. "hall" or "ws-1".' },
        text: { type: 'string', description: 'Message text.' },
        who: { type: 'string', description: 'Your name for the hall chat log (e.g. "WorkBuddy", "Trae"). Default "agent".' },
      },
      required: ['card', 'text'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { detail: { type: 'string' } },
        required: ['detail'],
      },
      render: (args) => [{ type: 'text', text: `posted to ${String(args.card ?? '')}` }],
    },
    execute: async (args) => {
      const card = state.cards[String(args.card ?? '')]
      if (!card) return { detail: 'no such card' }
      const text = String(args.text ?? '').trim()
      if (!text) return { detail: 'empty text' }
      const who = String(args.who || 'agent').slice(0, 32)
      const sc = getSessionController(ctx)
      let dispatched = false
      if (card.kind === 'workspace' && card.session && sc) {
        dispatched = dispatchPrompt(sc, card.session, text)
      }
      if (card.kind === 'hall') {

        if (!Array.isArray(state.hall)) state.hall = []
        const msg = { who, text: text.slice(0, 2000), ts: Date.now() }
        state.hall.push(msg)
        if (state.hall.length > 300) state.hall.splice(0, state.hall.length - 300)
        saveState(state)
        pushEvent({ kind: 'hall', hall: msg })
      }
      trailAppend('model', card.title, who, text)
      pushEvent({ kind: 'post', card: card.id, text })
      return { detail: dispatched ? `sent to ${card.title} (session ${card.session})` : `recorded on ${card.title}${card.kind === 'hall' ? '（群聊已上墙，cards_read 可读）' : ''}` }
    },
  })
  disposers.push(postTool)

  return () => { for (const d of disposers) { try { d?.() } catch { } } }
}

const trailCache = []

function trailAppendCached(kind, cardTitle, who, text) {
  const entry = { ts: Date.now(), kind, card: cardTitle, who, text: String(text ?? '').slice(0, 4000) }
  trailCache.push(entry)
  if (trailCache.length > 500) trailCache.shift()
}

function recordTrail(kind, cardTitle, who, text) {
  trailAppend(kind, cardTitle, who, text)
  trailAppendCached(kind, cardTitle, who, text)
}

function trailRecent(limit, cardId) {

  if (cardId === 'hall' && stateRef) {
    const hall = Array.isArray(stateRef.hall) ? stateRef.hall : []
    return hall.slice(-limit).map((m) =>
      `[${new Date(m.ts).toLocaleTimeString('zh-CN', { hour12: false })}] 群聊 · ${m.who}: ${m.text}`
    ).join('\n')
  }
  let rows = trailCache
  if (cardId) {
    const card = stateRef.cards[cardId]
    const title = card?.title ?? cardId
    rows = rows.filter((r) => r.card === title)
  }
  return rows.slice(-limit).map((r) =>
    `[${new Date(r.ts).toLocaleTimeString('zh-CN', { hour12: false })}] ${r.card} · ${r.who}: ${r.text}`
  ).join('\n')
}

function bootLog(line) {
  try {
    const dir = path.join(process.env.DSH_HOME || path.join(os_home(), '.dsh'), 'dsh-cardverse')
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir, 'boot.log'), `${new Date().toISOString()} ${line}\n`)
  } catch { }
}

let stateRef = null

export function apply(ctx) {
  bootLog('apply begin (plugin activated)')
  ensureDirs()

  writeBootFlag()
  const state = loadState()
  stateRef = state
  syncPositions(state)

  trailInit()
  const trailServer = startTrailServer()
  trailServerRef = trailServer

  registerRoutes(ctx, state)

  startBountyPoller()

  retireTimer = setInterval(() => {
    if (flagSaysSuperseded()) standDown('superseded by newer instance (boot flag)')
  }, 1500)

  try {
    ctx.inject?.(['tools'], (scoped) => {
      try {
        const dispose = registerCardTools(scoped, state)
        bootLog('card tools registered via scoped fiber')
        recordTrail('sys', '群发大厅', 'system', '卡片工具已注册（cards_list/cards_read/card_post）')
        ctx.on('dispose', () => { try { dispose() } catch { } })
      } catch (error) {
        bootLog(`tools register failed: ${String(error)}`)
      }
    })
  } catch (error) {
    bootLog(`tools inject failed: ${String(error)}`)
  }

  try {
    ctx.inject?.(['sessionController'], (scoped) => {
      ctx[Symbol.for('cardverse.sessionController')] = scoped.sessionController
      bootLog('sessionController acquired; broadcast dispatch enabled')
      recordTrail('sys', '群发大厅', 'system', 'sessionController 已接入，群发派发启用')
    })
  } catch (error) {
    bootLog(`sessionController inject failed: ${String(error)}`)
  }

  try {
    ctx.inject?.(['workspaceRegistry'], (scoped) => {
      ctx[Symbol.for('cardverse.workspaceRegistry')] = scoped.workspaceRegistry
      bootLog('workspaceRegistry acquired; session adopt groups correctly')
    })
  } catch (error) {
    bootLog(`workspaceRegistry inject failed: ${String(error)}`)
  }

  try {
    ctx.inject?.(['agent'], (scoped) => {
      try {

        try { globalThis[Symbol.for('cardverse.streamDetach')]?.() } catch { }
        const detach = scoped.agent.on?.('assistant-stream', (payload) => {
          const sessionId = payload?.agent?.session?.id
          if (!sessionId) return
          const frame = payload?.frame
          if (frame?.type !== 'end') {
            const chunk = frame?.chunk
            if (chunk?.type === 'text-delta' && typeof chunk.text === 'string') {
              streamBuffer(sessionId, chunk.text)
            }
          } else {
            flushStreamToTrail(sessionId)
          }
        })
        globalThis[Symbol.for('cardverse.streamDetach')] = typeof detach === 'function' ? detach : null
        bootLog('assistant-stream listener attached')
      } catch (error) {
        bootLog(`stream listener failed: ${String(error)}`)
      }
    })
  } catch (error) {
    bootLog(`agent inject failed: ${String(error)}`)
  }

  return () => {
    bootLog('apply dispose (plugin deactivated)')
    supersededFlag = true
    if (retireTimer) clearInterval(retireTimer)
    if (routeRetryTimer) clearTimeout(routeRetryTimer)
    if (trailTimer) clearTimeout(trailTimer)
    if (bountyTimer) clearInterval(bountyTimer)
    try { trailServerRef?.closeAllConnections?.() } catch { }
    try { trailServer?.closeAllConnections?.() } catch { }
    try { trailServerRef?.close?.() } catch { }
    try { trailServer?.close?.() } catch { }
    for (const res of sseClients) { try { res.end() } catch { } }
    sseClients.clear()
    for (const un of pendingUnregisters) { try { un() } catch { } }
    pendingUnregisters.clear()
  }
}

const streamBuffers = new Map()

function streamBuffer(sessionId, text) {
  let buf = streamBuffers.get(sessionId)
  if (!buf) { buf = { text: '' }; streamBuffers.set(sessionId, buf) }
  buf.text += text
  if (buf.text.length > 60000) buf.text = buf.text.slice(-60000)
}

function flushStreamToTrail(sessionId) {
  const buf = streamBuffers.get(sessionId)
  streamBuffers.delete(sessionId)
  if (!buf || !buf.text.trim()) return

  const card = Object.values(stateRef?.cards ?? {}).find(
    (c) => c.kind === 'workspace' && c.sessions.includes(sessionId),
  )
  const cardTitle = card?.title ?? '（外部会话）'
  recordTrail('model', cardTitle, sessionId, buf.text)
  pushEvent({ kind: 'stream-end', card: card?.id ?? null, session: sessionId, preview: buf.text.slice(0, 200) })

  mirrorToWechat(cardTitle, buf.text)
}
