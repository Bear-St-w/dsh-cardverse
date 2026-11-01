(function () {
const PREFIX = '/.cardverse'

function reportFailure(scope, error) {
  try {
    const payload = JSON.stringify({
      scope,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && typeof error.stack === 'string' ? error.stack : '',
    })
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(`${PREFIX}/client-error`, new Blob([payload], { type: 'application/json' }))
      return
    }
    void fetch(`${PREFIX}/client-error`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
  } catch { }
}

window.__ModuleLoader__.load({
  id: 'dsh-cardverse',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    const name = 'dsh-cardverse'
    const inject = ['slots', 'uiConversation']

    const CSS = `
.cvp-root{--cvp-hue:220;display:flex;flex-direction:column;height:100%;overflow:hidden;color:var(--dsw-alias-fg-l1,#e2e8f2);font-family:system-ui,"Segoe UI","Microsoft YaHei",sans-serif;position:relative}
.cvp-root::before{content:"";position:absolute;inset:0;pointer-events:none;background:
 radial-gradient(900px 480px at 12% -8%, hsla(var(--cvp-hue),82%,64%,.16), transparent 62%),
 radial-gradient(760px 420px at 88% 108%, hsla(calc(var(--cvp-hue) + 52),78%,58%,.13), transparent 58%),
 radial-gradient(520px 380px at 70% -12%, hsla(calc(var(--cvp-hue) - 40),86%,72%,.09), transparent 55%)}
.cvp-top{position:relative;z-index:2;display:flex;align-items:center;gap:10px;padding:8px 16px;font-size:12px;color:#8fa3c8;flex:none;user-select:none}
.cvp-top .sp{flex:1}
.cvp-link{color:hsl(var(--cvp-hue),85%,72%);cursor:pointer;transition:opacity .15s}
.cvp-link:hover{opacity:.75}
.cvp-glassselect{appearance:none;border:1px solid hsla(var(--cvp-hue),60%,70%,.22);background:hsla(var(--cvp-hue),45%,26%,.42);backdrop-filter:blur(14px) saturate(1.5);color:#dbe4f0;border-radius:8px;padding:4px 10px;font-size:11.5px;outline:none;cursor:pointer}
.cvp-board{position:relative;flex:1;z-index:1;overflow:auto;contain:strict}
.cvp-board::-webkit-scrollbar{width:10px;height:10px}
.cvp-board::-webkit-scrollbar-track{background:transparent}
.cvp-board::-webkit-scrollbar-thumb{background:hsla(var(--cvp-hue),60%,60%,.28);border-radius:5px;border:2px solid transparent;background-clip:padding-box}
.cvp-board::-webkit-scrollbar-thumb:hover{background:hsla(var(--cvp-hue),75%,70%,.45);border:2px solid transparent;background-clip:padding-box}
.cvp-board::-webkit-scrollbar-corner{background:transparent}
.cvp-card{position:absolute;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;
 background:linear-gradient(150deg,hsla(var(--cvp-hue),48%,30%,.34),hsla(var(--cvp-hue),52%,16%,.44));
 backdrop-filter:blur(22px) saturate(1.7);
 -webkit-backdrop-filter:blur(22px) saturate(1.7);
 border:1px solid hsla(var(--cvp-hue),70%,78%,.16);
 box-shadow:0 12px 40px hsla(226,60%,4%,.42), inset 0 1px 0 hsla(0,0%,100%,.11), inset 0 -18px 34px hsla(var(--cvp-hue),70%,50%,.05);
 transition:box-shadow .25s ease,border-color .25s ease;will-change:transform}
.cvp-card:hover{border-color:hsla(var(--cvp-hue),85%,80%,.32)}
.cvp-card.dragging{box-shadow:0 30px 70px hsla(226,60%,4%,.6), inset 0 1px 0 hsla(0,0%,100%,.14);border-color:hsla(var(--cvp-hue),95%,82%,.5);z-index:40;cursor:grabbing!important;backdrop-filter:none;-webkit-backdrop-filter:none;background:linear-gradient(150deg,hsla(var(--cvp-hue),48%,30%,.75),hsla(var(--cvp-hue),52%,16%,.88))}
@media (prefers-reduced-transparency: reduce){.cvp-card,.cvp-glassselect,.cvp-bty,.cvp-sel,.cvp-tick{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:linear-gradient(150deg,hsla(var(--cvp-hue),45%,22%,.92),hsla(var(--cvp-hue),50%,12%,.96))!important}}
@media (prefers-reduced-motion: reduce){.cvp-ev{animation:none}.cvp-card{transition:none}}
.cvp-card.hall{background:linear-gradient(150deg,hsla(40,88%,56%,.15),hsla(28,70%,30%,.28)),linear-gradient(150deg,hsla(var(--cvp-hue),48%,30%,.34),hsla(var(--cvp-hue),52%,16%,.44))}
.cvp-hd{display:flex;align-items:center;gap:7px;padding:9px 12px;flex:none;user-select:none;border-bottom:1px solid hsla(var(--cvp-hue),60%,70%,.10);background:hsla(var(--cvp-hue),60%,40%,.10)}
.cvp-hd .dot{width:7px;height:7px;border-radius:50%;background:hsl(152,72%,56%);box-shadow:0 0 8px hsl(152,72%,56%);flex:none}
.cvp-hd .dot.busy{background:hsl(38,96%,56%);box-shadow:0 0 9px hsl(38,96%,56%);animation:cvpP .85s infinite alternate}
.cvp-hd .t{font-weight:600;font-size:12.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.2px}
.cvp-hd .badge{font-size:10.5px;color:hsla(var(--cvp-hue),40%,86%,.75);background:hsla(var(--cvp-hue),70%,60%,.13);border:1px solid hsla(var(--cvp-hue),70%,70%,.14);border-radius:6px;padding:1px 7px;flex:none;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.cvp-hd .badge:hover{border-color:hsla(var(--cvp-hue),85%,80%,.4)}
.cvp-hd .badge{cursor:pointer;user-select:none}
.cvp-hd .grip{flex:none;color:hsla(0,0%,100%,.22);font-size:14px;cursor:grab;padding:0 4px;line-height:1}
.cvp-hd .grip:hover{color:hsla(0,0%,100%,.45)}
.cvp-bd{flex:1;overflow-y:auto;padding:9px 11px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain;content-visibility:auto;contain-intrinsic-size:auto 320px}
.cvp-bd::-webkit-scrollbar{width:5px}
.cvp-bd::-webkit-scrollbar-thumb{background:hsla(var(--cvp-hue),60%,60%,.25);border-radius:3px}
.cvp-ev{border-radius:9px;padding:6px 9px;font-size:12px;line-height:1.55;white-space:pre-wrap;word-break:break-word;animation:cvpIn .18s ease both;background:hsla(var(--cvp-hue),65%,62%,.08);border-left:2px solid hsla(var(--cvp-hue),75%,66%,.55)}
.cvp-ev.tool{border-left-color:hsl(276,72%,68%)}
.cvp-ev.sys{background:hsla(40,80%,50%,.10);border-left-color:hsl(40,90%,60%);font-size:11px;color:#cbb98f}
.cvp-ev .meta{font-size:10px;color:hsla(226,30%,72%,.8);margin-bottom:2px;display:flex;gap:6px}
.cvp-ev .meta .tool{color:hsl(276,80%,76%)}
.cvp-sel{width:100%;appearance:none;border:1px solid hsla(var(--cvp-hue),60%,70%,.20);background:hsla(var(--cvp-hue),50%,20%,.45);backdrop-filter:blur(10px);color:#d7dfef;border-radius:7px;padding:4px 8px;font-size:11px;outline:none;cursor:pointer;margin-bottom:6px;flex:none}
.cvp-sel:disabled{opacity:.45;cursor:not-allowed}
.cvp-rowline{font-size:10.5px;color:hsla(226,25%,62%,.8);flex:none;cursor:pointer;user-select:none;padding:2px 0}
.cvp-rowline:hover{color:hsl(var(--cvp-hue),80%,75%)}
.cvp-rowline b{color:hsla(226,40%,80%,.9);font-weight:600}
.cvp-files{flex:none;border:1px solid hsla(var(--cvp-hue),60%,70%,.14);border-radius:9px;background:hsla(var(--cvp-hue),50%,16%,.30);overflow:hidden;margin-bottom:2px}
.cvp-files .cvp-fbar{display:flex;align-items:center;gap:6px;padding:4px 8px;font-size:10.5px;color:hsla(226,25%,66%,.85);border-bottom:1px solid hsla(var(--cvp-hue),60%,70%,.10);cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden}
.cvp-files .cvp-fbar:hover{color:hsl(var(--cvp-hue),80%,75%)}
.cvp-files .cvp-fbar b{color:hsla(226,40%,80%,.95);font-weight:600}
.cvp-files .cvp-flist{max-height:150px;overflow-y:auto;padding:3px 0}
.cvp-files .cvp-flist::-webkit-scrollbar{width:5px}
.cvp-files .cvp-flist::-webkit-scrollbar-thumb{background:hsla(var(--cvp-hue),60%,60%,.25);border-radius:3px}
.cvp-fi{display:flex;align-items:center;gap:6px;padding:2px 8px;font-size:11px;color:#c9d3e6;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cvp-fi:hover{background:hsla(var(--cvp-hue),70%,60%,.14)}
.cvp-fi .ic{flex:none;width:13px;text-align:center;opacity:.8;font-size:10px}
.cvp-fi .nm{flex:1;overflow:hidden;text-overflow:ellipsis}
.cvp-fi .sz{flex:none;font-size:9.5px;color:hsla(226,20%,55%,.75)}
.cvp-fview{border-top:1px solid hsla(var(--cvp-hue),60%,70%,.10);max-height:180px;overflow:auto;font-size:10.5px;line-height:1.5;padding:6px 9px;white-space:pre-wrap;word-break:break-word;color:#b9c4da;background:hsla(226,40%,6%,.35)}
.cvp-fview::-webkit-scrollbar{width:5px}
.cvp-fview::-webkit-scrollbar-thumb{background:hsla(var(--cvp-hue),60%,60%,.25);border-radius:3px}
.cvp-fview .close{color:hsl(4,80%,70%);cursor:pointer;font-size:10px;float:right;padding:0 3px}
.cvp-fview .close:hover{color:hsl(4,95%,80%)}
.cvp-ft{padding:7px 10px;border-top:1px solid hsla(var(--cvp-hue),60%,70%,.10);display:flex;gap:6px;flex:none}
.cvp-ft input{flex:1;background:hsla(var(--cvp-hue),55%,16%,.55);border:1px solid hsla(var(--cvp-hue),60%,70%,.18);backdrop-filter:blur(8px);border-radius:9px;color:#e6ecf7;padding:6px 10px;font-size:12px;outline:none;min-width:0;transition:border-color .18s ease,box-shadow .18s ease}
.cvp-ft input:focus{border-color:hsla(var(--cvp-hue),90%,74%,.55);box-shadow:0 0 0 3px hsla(var(--cvp-hue),80%,60%,.12)}
.cvp-ft input:disabled{opacity:.5}
.cvp-btn{border:1px solid hsla(var(--cvp-hue),70%,72%,.30);background:linear-gradient(150deg,hsla(var(--cvp-hue),80%,62%,.75),hsla(var(--cvp-hue),85%,48%,.65));color:#fff;border-radius:9px;padding:6px 14px;font-size:12px;cursor:pointer;transition:transform .14s ease,filter .14s ease;backdrop-filter:blur(8px)}
.cvp-btn:hover{filter:brightness(1.14);transform:translateY(-1px)}
.cvp-btn:active{transform:scale(.95)}
.cvp-btn:disabled{filter:grayscale(.65) brightness(.7);cursor:default;transform:none}
.cvp-btn.gold{background:linear-gradient(150deg,hsla(42,95%,58%,.92),hsla(28,90%,50%,.85));border-color:hsla(42,95%,70%,.5);color:#241a06;font-weight:700}
.cvp-empty{color:hsla(226,25%,62%,.7);font-size:11px;text-align:center;margin:auto;padding:0 10px;line-height:1.7}
.cvp-bty{border:1px solid hsla(40,80%,60%,.30);background:hsla(40,85%,50%,.10);backdrop-filter:blur(14px);border-radius:12px;padding:9px 11px;margin-bottom:6px;flex:none}
.cvp-bty .bt{font-weight:700;color:hsl(42,95%,68%);font-size:12px;margin-bottom:2px}
.cvp-bty .bs{font-size:11px;color:hsla(40,50%,70%,.85)}
.cvp-tick{position:fixed;left:50%;transform:translateX(-50%) translateY(8px);bottom:70px;background:hsla(226,45%,18%,.72);backdrop-filter:blur(18px) saturate(1.6);border:1px solid hsla(var(--cvp-hue),70%,70%,.25);color:#e6ecf7;border-radius:12px;padding:8px 18px;font-size:12.5px;box-shadow:0 10px 36px hsla(226,60%,4%,.5);pointer-events:none;opacity:0;transition:opacity .24s ease,transform .24s ease;z-index:80;max-width:70vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cvp-tick.show{opacity:1;transform:translateX(-50%) translateY(0)}
@keyframes cvpIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes cvpP{from{opacity:1}to{opacity:.35}}
`

    function installStyles() {
      const style = document.createElement('style')
      style.id = 'dsh-cardverse-style'
      style.textContent = CSS
      document.head.appendChild(style)
      return () => { try { document.head.removeChild(style) } catch { } }
    }

    async function post(sub, body) {
      const res = await fetch(`${PREFIX}${sub}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })
      return res.json().catch(() => ({}))
    }
    async function get(sub) {
      const res = await fetch(`${PREFIX}${sub}`)
      return res.json().catch(() => ({}))
    }

    function simplifyTrajectory(snapshot) {
      try {
        const nodes = Array.isArray(snapshot?.eventNodes) ? snapshot.eventNodes : []
        const evs = []
        for (const node of nodes) {
          if (node?.kind !== 'assistant') continue
          const when = typeof node.time === 'number' ? new Date(node.time).toLocaleTimeString('zh-CN', { hour12: false }) : ''
          const texts = (node.blocks ?? []).filter((b) => b.kind === 'text' && b.text).map((b) => b.text).join('\n')
          if (texts) evs.push({ when, kind: 'model', text: texts.slice(0, 500) })
          for (const block of (node.blocks ?? [])) {
            if (block.kind !== 'tool-call') continue
            evs.push({ when, kind: 'tool', tool: block.name, args: String(block.argsRaw ?? '').slice(0, 260) })
          }
        }
        const list = evs.slice(-40)

        const last = list[list.length - 1]
        const fp = `${list.length}:${last ? `${last.kind}:${last.tool ?? ''}:${(last.text ?? last.args ?? '').length}:${(last.text ?? last.args ?? '').slice(-24)}` : ''}`
        return { list, fp }
      } catch { return { list: [], fp: '' } }
    }

    function WorkspaceCard({ ctx, card, onMove, onTicker, onRefresh }) {
      const [evs, setEvs] = React.useState([])
      const [busy, setBusy] = React.useState(false)
      const [draft, setDraft] = React.useState('')
      const [avail, setAvail] = React.useState(null)
      const [models, setModels] = React.useState(null)
      const [selOpen, setSelOpen] = React.useState(false)
      const [mdlOpen, setMdlOpen] = React.useState(false)
      const [efforts, setEfforts] = React.useState(null)
      const [effOpen, setEffOpen] = React.useState(false)
      const [files, setFiles] = React.useState(null)
      const [fpath, setFpath] = React.useState('')
      const [fview, setFview] = React.useState(null)
      const bodyRef = React.useRef(null)
      const dragRef = React.useRef(null)

      const loadFiles = (sub) => {
        get(`/files?card=${encodeURIComponent(card.id)}&path=${encodeURIComponent(sub ?? fpath)}`).then((j) => {
          if (j.ok) { setFiles(j); setFpath(sub ?? fpath) }
          else onTicker(j.error || '读目录失败')
        }).catch(() => {})
      }
      const openFile = (name) => {
        const p = fpath ? `${fpath}/${name}` : name
        get(`/file?card=${encodeURIComponent(card.id)}&path=${encodeURIComponent(p)}`).then((j) => {
          if (j.ok) setFview({ name, text: j.text ?? '', truncated: j.truncated, binary: j.binary })
          else onTicker(j.error || '读文件失败')
        }).catch(() => {})
      }
      const intoDir = (name) => {
        const next = fpath ? `${fpath}/${name}` : name
        setFview(null)
        loadFiles(next)
      }
      const fmtSize = (n) => n >= 1048576 ? `${(n / 1048576).toFixed(1)}MB` : n >= 1024 ? `${(n / 1024).toFixed(1)}KB` : `${n}B`
      React.useEffect(() => { loadFiles(''); }, [card.id, card.dir])

      React.useEffect(() => {
        let dispose = () => {}
        let disposed = false
        let trailTimer = null
        if (card.session) {
          try {
            const target = ctx.uiConversation.binding(card.session).target('trajectory')
            let lastFp = ''
            const push = () => {
              const { list, fp } = simplifyTrajectory(target.getSnapshot())
              if (disposed || fp === lastFp || list.length === 0) return
              lastFp = fp
              setEvs(list)

              clearTimeout(trailTimer)
              trailTimer = setTimeout(() => {
                void post('/trail', { session: card.session, card: card.id, title: card.title, events: list.slice(-8) }).catch(() => {})
              }, 800)
            }
            push()
            dispose = target.subscribe(push)
          } catch { }
        } else {
          setEvs([])
        }
        return () => {
          disposed = true
          clearTimeout(trailTimer)
          dispose()
        }
      }, [card.session, card.id, card.title])

      React.useEffect(() => {
        const el = bodyRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, [evs.length])

      const openSession = () => { if (card.session) ctx.uiWorkspace?.openSession?.(card.session) }

      const loadSessions = () => {
        post('/session', { id: card.id, action: 'list' }).then((j) => {
          if (j.ok) { setAvail(j.available ?? []); setSelOpen(true) }
        }).catch(() => {})
      }
      const pickSession = (sid) => {
        setSelOpen(false)
        if (!sid) return
        post('/session', { id: card.id, action: 'use', sessionId: sid }).then((j) => {
          if (j.ok) { onTicker(`「${card.title}」已切换会话`); onRefresh() }
          else onTicker(j.error || '切换失败')
        })
      }

      const loadModels = () => {
        if (busy) { onTicker('会话正在忙，稍候再换'); return }
        get('/models').then((j) => { if (j.ok) { setModels(j.models); setMdlOpen(true) } }).catch(() => {})
      }
      const pendingModel = React.useRef(null)

      const pickModel = (mid) => {
        setMdlOpen(false)
        if (!mid) return
        const m = (models ?? []).find((x) => x.id === mid)
        if (!m) return
        if ((m.efforts ?? []).length > 0) {

          pendingModel.current = m
          setEfforts(m.efforts)
          setEffOpen(true)
        } else {
          submitBind(m, null)
        }
      }
      const pickEffort = (eid) => {
        setEffOpen(false)
        const m = pendingModel.current
        pendingModel.current = null
        if (!m) return

        submitBind(m, eid && eid !== 'default' ? eid : null)
      }
      const settleEffort = () => {

        setTimeout(() => { if (pendingModel.current) pickEffort(null) }, 60)
      }
      const submitBind = (m, effort) => {
        post('/bind', { id: card.id, provider: m.provider, model: m.model, label: m.label, effort }).then((j) => {
          if (j.ok) {
            const what = j.idempotent ? '本来就是这个模型' : j.switched ? '模型已切换' : '模型已绑定（无会话，未切换）'
            onTicker(`「${card.title}」${what}${effort ? ` · ${effort}` : ''}`)
          } else {

            onTicker(j.error || '切换失败')
          }
          onRefresh()
        })
      }

      const send = () => {
        const text = draft.trim()
        if (!text) return
        setDraft('')
        setBusy(true)
        post('/post', { card: card.id, text }).then((j) => {
          if (!j.ok) onTicker(j.detail || j.error || '发送失败')
        }).finally(() => setBusy(false))
      }

      const onDown = (e) => {
        if (e.button !== 0) return
        if (e.target.closest('.badge') || e.target.closest('.cvp-sel') || e.target.closest('.cvp-files') || e.target.tagName === 'SELECT') return
        const el = e.currentTarget.closest('.cvp-card')
        const d = { startX: e.clientX, startY: e.clientY, origX: card.x, origY: card.y, el, moved: false, dx: 0, dy: 0 }
        dragRef.current = d
        el.classList.add('dragging')

        const move = (ev) => {
          const dd = dragRef.current
          if (!dd) return
          dd.dx = ev.clientX - dd.startX
          dd.dy = ev.clientY - dd.startY
          if (Math.abs(dd.dx) > 3 || Math.abs(dd.dy) > 3) dd.moved = true

          if (!dd.raf) {
            dd.raf = requestAnimationFrame(() => {
              dd.raf = 0
              dd.el.style.transform = `translate(${dd.dx}px,${dd.dy}px)`
            })
          }
        }
        const up = () => {
          const dd = dragRef.current
          dragRef.current = null
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          if (!dd) return
          if (dd.raf) cancelAnimationFrame(dd.raf)
          dd.el.classList.remove('dragging')
          dd.el.style.transform = ''
          if (!dd.moved) { openSession(); return }
          onMove(card.id, dd.origX + dd.dx, dd.origY + dd.dy)
        }
        window.addEventListener('pointermove', move, { passive: true })
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
        e.preventDefault()
      }

      const style = { left: `${card.x}px`, top: `${card.y}px`, width: `${card.w}px`, height: `${card.h}px` }

      return h('div', { className: 'cvp-card workspace', style, 'data-card': card.id },
        h('div', { className: 'cvp-hd', onPointerDown: onDown },
          h('span', { className: `dot${busy ? ' busy' : ''}` }),
          h('span', { className: 't', title: card.dir || '' }, card.title),
          h('span', { className: 'badge', title: `${card.modelLabel || card.model || '未绑定模型'}（点击换）`, onClick: loadModels },
            card.modelLabel || card.model || '选模型'),
          h('span', { className: 'grip' }, '⠿'),
        ),
        h('div', { className: 'cvp-bd', ref: bodyRef },
          selOpen && h('select', { className: 'cvp-sel', value: '', autoFocus: true,
            onChange: (e) => pickSession(e.target.value), onBlur: () => setSelOpen(false) },
            h('option', { value: '' }, '— 选一个会话 —'),
            (avail ?? []).map((s) => h('option', { key: s.id, value: s.id }, `${s.title} · ${s.cwd ?? ''}`)),
          ),
          mdlOpen && h('select', { className: 'cvp-sel', value: '', autoFocus: true,
            onChange: (e) => pickModel(e.target.value), onBlur: () => setMdlOpen(false) },
            h('option', { value: '' }, '— 选一个模型 —'),
            (models ?? []).map((m) => h('option', { key: m.id, value: m.id }, `${m.label}${(m.efforts ?? []).length ? ' ·有档位' : ''}`)),
          ),
          effOpen && h('select', { className: 'cvp-sel', value: '', autoFocus: true,
            onChange: (e) => pickEffort(e.target.value), onBlur: settleEffort },
            h('option', { value: 'default' }, '推理档位：不选=默认'),
            (efforts ?? []).map((e) => h('option', { key: e.id, value: e.id }, e.name)),
          ),
          h('div', { className: 'cvp-rowline', onClick: loadSessions },
            h('b', null, '会话'), '：', card.session ? `${card.session.slice(0, 14)}…（点击换）` : '未选择（点击选）',
          ),
          h('div', { className: 'cvp-rowline', onClick: loadModels },
            h('b', null, '模型'), '：', card.modelLabel || card.model || '未选择（点击选）',
          ),
          files && h('div', { className: 'cvp-files' },
            h('div', { className: 'cvp-fbar', onClick: () => (files.open ? setFiles({ ...files, open: false }) : setFiles({ ...files, open: true })) },
              h('span', null, files.open ? '▾' : '▸'),
              h('b', null, '文件'),
              h('span', null, fpath ? ` /${fpath}` : ' · 工作目录'),
              h('span', { style: { marginLeft: 'auto', opacity: .7 } }, `${(files.items ?? []).filter((x) => !x.dir).length} 个文件`),
            ),
            files.open && h('div', { className: 'cvp-flist' },
              fpath && h('div', { className: 'cvp-fi', onClick: () => { setFview(null); loadFiles(fpath.includes('/') ? fpath.slice(0, fpath.lastIndexOf('/')) : '') } },
                h('span', { className: 'ic' }, '↩'), h('span', { className: 'nm' }, '…（上一级）'),
              ),
              (files.items ?? []).map((f) => h('div', {
                key: f.name, className: 'cvp-fi',
                onClick: () => (f.dir ? intoDir(f.name) : openFile(f.name)),
                title: f.dir ? `进 ${f.name}` : `看 ${f.name}（${fmtSize(f.size)}）`,
              },
                h('span', { className: 'ic' }, f.dir ? '▸' : '·'),
                h('span', { className: 'nm' }, f.name),
                h('span', { className: 'sz' }, f.dir ? '' : fmtSize(f.size)),
              )),
              (files.items ?? []).length === 0 && h('div', { className: 'cvp-fi', style: { opacity: .55, cursor: 'default' } }, '（空目录）'),
            ),
            fview && h('div', { className: 'cvp-fview' },
              h('span', { className: 'close', onClick: () => setFview(null), title: '关闭预览' }, '×'),
              h('b', null, fview.name, fview.binary ? '（二进制）' : fview.truncated ? '（已截断）' : ''),
              '\n', fview.text || '（空文件）',
            ),
          ),
          evs.slice(-14).map((ev, i) => h('div', { key: i, className: `cvp-ev ${ev.kind}` },
            h('div', { className: 'meta' },
              h('span', null, ev.when),
              ev.kind === 'tool' && h('span', { className: 'tool' }, ev.tool),
            ),
            ev.kind === 'tool' ? (ev.args || '') : (ev.text || ''),
          )),
        ),
        h('div', { className: 'cvp-ft' },
          h('input', {
            placeholder: card.session ? `发到 ${card.title}` : '先选会话',
            value: draft,
            disabled: !card.session,
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send() },
          }),
          h('button', { className: 'cvp-btn', onClick: send, disabled: busy || !card.session }, '发送'),
        ),
      )
    }
    WorkspaceCard.__lastLen = new Map()

    function HallCard({ card, bounty, onGrab, onBroadcast, busy, hall }) {
      const [draft, setDraft] = React.useState('')
      const hallRef = React.useRef(null)
      const send = () => {
        const text = draft.trim()
        if (!text) return
        setDraft('')
        onBroadcast(text)
      }
      React.useEffect(() => {
        const el = hallRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, [(hall ?? []).length])
      const b = bounty
      const msgs = hall ?? []
      const style = { left: `${card.x}px`, top: `${card.y}px`, width: `${card.w}px`, height: `${card.h}px` }
      return h('div', { className: 'cvp-card hall', style },
        h('div', { className: 'cvp-hd' },
          h('span', { className: 'dot' }),
          h('span', { className: 't' }, '群发大厅'),
          h('span', { className: 'badge' }, '锁定首位'),
        ),
        h('div', { className: 'cvp-bd' },
          h('div', { className: 'cvp-bty' },
            b == null
              ? h('div', null,
                  h('div', { className: 'bt' }, '当前悬赏'),
                  h('div', { className: 'bs' }, '暂无悬赏 · 等老板发'),
                )
              : h('div', null,
                  h('div', { className: 'bt' }, b.text),
                  h('div', { className: 'bs' },
                    `${b.points} 分 · ` +
                    (b.status === 'waiting' ? `${b.open_hhmm} 开放`
                      : b.status === 'open' ? '开放中！'
                      : `${b.winner} 抢到（${b.win_ms}ms）`)),
                  b.status === 'open' && h('div', { style: { marginTop: 7 } },
                    h('button', { className: 'cvp-btn gold', onClick: onGrab, disabled: busy }, '抢！'),
                  ),
                ),
          ),
          h('div', { className: 'cvp-rowline' },
            h('b', null, '群聊'), '：', msgs.length ? `${msgs.length} 条消息` : '暂无消息——发一句全员都能看到',
          ),
          h('div', { ref: hallRef, style: { flex: '1 1 auto', minHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, contentVisibility: 'auto' } },
            msgs.map((m, i) => h('div', { key: `${m.ts}-${i}`, className: `cvp-ev ${m.who === '老板' ? 'user' : 'model'}` },
              h('div', { className: 'meta' },
                h('span', null, `${new Date(m.ts).toLocaleTimeString('zh-CN', { hour12: false })}`),
                h('span', { style: { fontWeight: 600 } }, m.who),
              ),
              String(m.text ?? '').slice(0, 600),
            )),
          ),
        ),
        h('div', { className: 'cvp-ft' },
          h('input', {
            placeholder: '群发：全员可见（回车发送）',
            value: draft,
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send() },
          }),
          h('button', { className: 'cvp-btn gold', onClick: send, disabled: busy }, '群发'),
        ),
      )
    }

    function CardVerseView(props) {
      const ctx = props.ctx
      const [state, setState] = React.useState(null)
      const [bounty, setBounty] = React.useState(null)
      const [hall, setHall] = React.useState([])
      const [busy, setBusy] = React.useState(false)
      const [tick, setTick] = React.useState('')
      const [tickShow, setTickShow] = React.useState(false)

      const ticker = (text) => {
        setTick(text)
        setTickShow(true)
        clearTimeout(CardVerseView.__t)
        CardVerseView.__t = setTimeout(() => setTickShow(false), 2600)
      }

      const refresh = React.useCallback(() => {
        get('/state').then((j) => {
          if (!j.ok) return

          const local = dragGuard.current
          if (local && j.cards[local.id]) {
            j.cards[local.id] = { ...j.cards[local.id], x: local.x, y: local.y }
          }
          setState(j)
        }).catch(() => {})
      }, [])

      React.useEffect(() => { refresh() }, [refresh])

      React.useEffect(() => {
        const iv = setInterval(refresh, 60_000)
        return () => clearInterval(iv)
      }, [refresh])

      React.useEffect(() => {
        let es
        try {
          es = new EventSource(`${PREFIX}/events`)
          es.onmessage = (ev) => {
            try {
              const d = JSON.parse(ev.data)
              if (d.kind === 'bounty') { setBounty(d.bounty); if (d.text) ticker(d.text) }
              if (d.kind === 'cards' || d.kind === 'theme') refresh()
              if (d.kind === 'hall' && d.hall) setHall((cur) => [...(cur ?? []), d.hall].slice(-300))
            } catch { }
          }
        } catch { }

        const iv = setInterval(() => {
          get('/bounty').then((j) => { if (j.bounty !== undefined) setBounty(j.bounty) }).catch(() => {})
        }, 8_000)
        const ivHall = setInterval(() => {
          get('/hall?limit=60').then((j) => { if (j.ok) setHall(j.messages ?? []) }).catch(() => {})
        }, 15_000)
        return () => { clearInterval(iv); clearInterval(ivHall); try { es?.close() } catch { } }
      }, [])

      React.useEffect(() => {
        get('/hall?limit=60').then((j) => { if (j.ok) setHall(j.messages ?? []) }).catch(() => {})
      }, [])

      React.useEffect(() => {
        document.body.classList.add('cvp-active')
        return () => { document.body.classList.remove('cvp-active') }
      }, [])

      const grab = () => {
        setBusy(true)
        post('/bounty/grab', {}).then((j) => {
          ticker(j.ok ? `抢到了！${j.points}分 · ${j.win_ms}ms` : (j.err || '没抢到'))
          setTimeout(() => { get('/bounty').then((j) => setBounty(j.bounty)).catch(() => {}) }, 700)
        }).finally(() => setBusy(false))
      }

      const broadcast = (text) => {
        setBusy(true)
        post('/broadcast', { text }).then((j) => {
          ticker(j.dispatched && j.dispatched.length ? `已群发 ${j.dispatched.length} 个工作区` : '没有工作区绑定了会话')
        }).finally(() => setBusy(false))
      }

      const dragGuard = React.useRef(null)
      const saveTimer = React.useRef(null)
      const latestCards = React.useRef(null)
      latestCards.current = state?.cards ?? null

      const moveCard = (id, x, y) => {
        if (!state) return
        const cards = { ...state.cards }
        cards[id] = { ...cards[id], x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)) }
        setState({ ...state, cards })
        dragGuard.current = { id, x: cards[id].x, y: cards[id].y }

        clearTimeout(moveCard.__t)
        moveCard.__t = setTimeout(() => { dragGuard.current = null }, 3000)

        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          const all = latestCards.current
          if (!all) return
          const positions = {}
          for (const [cid, c] of Object.entries(all)) {
            if (c.kind === 'workspace') positions[cid] = { x: c.x, y: c.y, w: c.w, h: c.h }
          }
          void post('/move', { positions }).catch(() => {})
        }, 3000)
      }

      const setTheme = (tid) => {
        if (!state) return
        setState({ ...state, theme: tid })
        post('/theme', { theme: tid }).catch(() => {})
      }

      if (!state) {
        return h('div', { className: 'cvp-root' },
          h('div', { style: { margin: 'auto', color: 'hsla(226,25%,62%,.8)' } }, 'CardVerse 加载中'),
        )
      }

      const themeHue = ({ aurora: 220, emerald: 152, sunset: 16, orchid: 276, ocean: 195, rose: 340 })[state.theme ?? 'aurora'] ?? 220
      const trailPort = state.trail?.port ?? 5002

      return h('div', { className: 'cvp-root', style: { '--cvp-hue': themeHue } },
        h('div', { className: 'cvp-top' },
          h('span', null, `CardVerse · ${state.order.length} 卡`),
          h('span', { className: 'cvp-link', onClick: () => window.open(`http://127.0.0.1:${trailPort}`, '_blank') }, `轨迹存档 127.0.0.1:${trailPort}`),
          h('span', { className: 'sp' }),
          h('span', { className: 'cvp-link', title: '重新加载卡片界面（代码更新后点这里，等同刷新）', onClick: () => { const u = new URL(window.location.href); u.searchParams.set('cvp', String(Date.now())); window.location.replace(u.toString()) } }, '重载界面'),
          h('span', null, '主题'),
          h('select', { className: 'cvp-glassselect', value: state.theme ?? 'aurora', onChange: (e) => setTheme(e.target.value) },
            (state.themes ?? [{ id: 'aurora', label: '极光' }]).map((t) => h('option', { key: t.id, value: t.id }, t.label)),
          ),
        ),
        h('div', { className: 'cvp-board' },
          state.order.map((id) => {
            const card = state.cards[id]
            if (!card) return null
            if (card.kind === 'hall') {
              return h(HallCard, { key: id, card, bounty, onGrab: grab, onBroadcast: broadcast, busy, hall })
            }
            return h(WorkspaceCard, { key: id, ctx, card, onMove: moveCard, onTicker: ticker, onRefresh: refresh })
          }),
        ),
        h('div', { className: `cvp-tick${tickShow ? ' show' : ''}` }, tick),
      )
    }

    function apply(ctx) {
      ctx.effect(() => {
        const removeStyles = installStyles()

        const hideComposer = document.createElement('style')
        hideComposer.textContent = 'body.cvp-active [data-composer-seat]{display:none!important}'
        document.head.appendChild(hideComposer)

        let disposeView = () => {}
        try {
          disposeView = ctx.slots.inject('conversation.view', () => ctx.slots.register({
            name: 'conversation.view',
            id: 'cardverse',
            order: 5,
            label: () => '卡片',
            children: {},
            inject: () => ({}),
          }, (props) => h(CardVerseView, { ...props, ctx })),
          )
        } catch (error) {
          reportFailure('view-register', error)
        }

        return () => {
          disposeView()
          try { document.head.removeChild(hideComposer) } catch { }
          document.body.classList.remove('cvp-active')
          removeStyles()
        }
      })
    }

    return { name, inject, apply }
  },
})
})()
