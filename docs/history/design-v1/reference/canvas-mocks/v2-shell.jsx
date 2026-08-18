// v2 — Producto rediseñado.
// Shell común: sidebar 5 + footer (cuenta · ayuda · sobre) + topbar (search + bell + 1 CTA).
// Modelo: Período = año lectivo. Modalidad heredada del plan (anual / 1c / 2c / etc).
// Estado de cada período: planificado → en curso → pasado.

// ── Datos compartidos (placeholder realista) ────────────────────
const V2_USER = {
  name: 'Lourdes Agüero',
  initials: 'LA',
  career: 'Ing. en Sistemas',
  uni: 'UNSTA',
  year: 4,
  progress: 0.62, // 62% del plan
};

const V2_PERIOD = {
  year: 2026,
  weekOfYear: 18,
  weeksInYear: 32,
  label: '2026 · en curso',
};

// Materias activas del período en curso. Modalidad heredada del plan.
const V2_ACTIVE = [
  { code:'ISW302', name:'Ingeniería de Software II', mod:'1c',  com:'A', prof:'Brandt',    diff:4, week:8,  weeks:16, next:'Parcial · 12 may',     attendance:0.92, note:null },
  { code:'INT302', name:'Inteligencia Artificial I', mod:'1c',  com:'A', prof:'Iturralde', diff:5, week:8,  weeks:16, next:'TP1 entrega · 6 may',  attendance:0.88, note:7 },
  { code:'MAT401', name:'Matemática Aplicada',       mod:'anual', com:'A', prof:'Reynoso', diff:4, week:18, weeks:32, next:'Parcial · 22 may',    attendance:0.94, note:8 },
  { code:'SEG302', name:'Seguridad Informática',     mod:'1c',  com:'B', prof:'Sosa',      diff:3, week:8,  weeks:16, next:'TP2 · 18 may',         attendance:0.81, note:null },
  { code:'QUI201', name:'Química General',           mod:'2c',  com:'A', prof:'Méndez',    diff:3, week:0,  weeks:16, next:'arranca el 5 ago',    attendance:null, note:null },
];

// Materias recién cerradas — pendientes de reseñar
const V2_TO_REVIEW = [
  { code:'ISW301', name:'Ingeniería de Software I',  prof:'Brandt',    closed:'2025·2c', note:8 },
  { code:'BD301',  name:'Bases de Datos',            prof:'Castellanos', closed:'2025·2c', note:7 },
  { code:'COM301', name:'Comunicación de Datos',     prof:'Sosa',      closed:'2025·2c', note:6 },
];

// Modalidad → label mostrable
const V2_MOD_LABEL = {
  '1c': 'Cuatri 1', '2c': 'Cuatri 2',
  '1s': 'Sem 1',    '2s': 'Sem 2',
  'anual': 'Anual', 'bim1':'Bim 1', 'bim2':'Bim 2',
  'bim3':'Bim 3',   'bim4':'Bim 4',
};

const V2_NAV = [
  { id:'inicio',    label:'Inicio',     icon:'◇' },
  { id:'planificar',label:'Planificar', icon:'◐' },
  { id:'resenas',   label:'Reseñas',    icon:'✎' },
  { id:'carrera',   label:'Mi carrera', icon:'▦' },
  { id:'rankings',  label:'Rankings',   icon:'★' },
];

const V2_NAV_FOOT = [
  { id:'ajustes', label:'Ajustes',       icon:'⚙' },
  { id:'ayuda',   label:'Ayuda',         icon:'?' },
  { id:'sobre',   label:'Sobre plan-b',  icon:'i' },
];

// ── Pieces UI ──────────────────────────────────────────────────
function V2Logo() {
  return (
    <span style={{display:'inline-flex', alignItems:'baseline', gap:1, fontWeight:600, fontSize:15, letterSpacing:'-0.01em'}}>
      plan-b
      <span style={{
        width:6, height:6, background:'var(--accent)', borderRadius:'50%',
        display:'inline-block', transform:'translateY(-3px)', marginLeft:2,
      }}/>
    </span>
  );
}

function V2Bell({ count }) {
  return (
    <button style={{
      appearance:'none', border:0, background:'transparent', cursor:'pointer',
      width:36, height:36, borderRadius:8,
      display:'grid', placeItems:'center',
      color:'var(--ink-2)', position:'relative',
    }}
    onMouseEnter={e=>e.currentTarget.style.background='var(--line-2)'}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
      {count > 0 && (
        <span style={{
          position:'absolute', top:6, right:6,
          width:14, height:14, borderRadius:7,
          background:'var(--accent)', color:'#fff',
          fontSize:9, fontWeight:600, fontFamily:'var(--font-mono)',
          display:'grid', placeItems:'center',
          border:'2px solid var(--bg)',
        }}>{count}</span>
      )}
    </button>
  );
}

function V2Search() {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:9,
      background:'var(--bg-card)', border:'1px solid var(--line)',
      borderRadius:8, padding:'7px 12px',
      width:'100%', maxWidth:420,
      color:'var(--ink-3)', fontSize:13,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
      </svg>
      <span style={{flex:1}}>Buscar materia, docente, reseña…</span>
      <span style={{
        fontFamily:'var(--font-mono)', fontSize:10,
        padding:'2px 6px', background:'var(--bg)', borderRadius:4,
        border:'1px solid var(--line)', color:'var(--ink-3)',
      }}>⌘K</span>
    </div>
  );
}

// ── Shell v2 ───────────────────────────────────────────────────
function V2Shell({ active, children, pageTitle, pageEyebrow, pageSub, pageRight }) {
  return (
    <div style={{
      width:'100%', height:'100%',
      display:'grid', gridTemplateColumns:'232px 1fr',
      background:'var(--bg)', color:'var(--ink)',
      fontFamily:'var(--font-ui)', fontSize:14,
      overflow:'hidden',
    }}>
      {/* SIDEBAR */}
      <aside style={{
        background:'var(--bg)', borderRight:'1px solid var(--line)',
        display:'flex', flexDirection:'column',
        padding:'18px 14px',
      }}>
        {/* brand */}
        <div style={{
          padding:'4px 8px 16px',
          borderBottom:'1px solid var(--line)',
        }}>
          <V2Logo/>
        </div>

        {/* nav principal */}
        <nav style={{display:'flex', flexDirection:'column', gap:1, marginTop:14}}>
          {V2_NAV.map(it => (
            <V2NavItem key={it.id} {...it} active={active === it.id}/>
          ))}
        </nav>

        {/* footer del sidebar */}
        <div style={{marginTop:'auto', display:'flex', flexDirection:'column'}}>
          <nav style={{display:'flex', flexDirection:'column', gap:1, paddingBottom:10}}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-4)',
              letterSpacing:'0.12em', textTransform:'uppercase',
              padding:'14px 8px 6px',
            }}>Otros</div>
            {V2_NAV_FOOT.map(it => (
              <V2NavItem key={it.id} {...it} active={active === it.id} muted/>
            ))}
          </nav>

          {/* avatar / cuenta — abre menú con Perfil + Cerrar sesión */}
          <V2AvatarMenu/>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {/* TOPBAR */}
        <header style={{
          display:'flex', alignItems:'center', gap:18,
          padding:'12px 28px',
          borderBottom:'1px solid var(--line)',
          background:'var(--bg)',
        }}>
          {/* contexto del período */}
          <div style={{display:'flex', alignItems:'center', gap:9}}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>período</span>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
              color:'var(--ink)',
            }}>{V2_PERIOD.year}</span>
          </div>

          {/* search */}
          <div style={{flex:1, display:'flex', justifyContent:'center'}}>
            <V2Search/>
          </div>

          {/* notif + cta */}
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <V2Bell count={3}/>
            <button className="btn accent" style={{padding:'8px 14px', fontSize:13}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6}}>
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
              Escribir reseña
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{
          flex:1, overflow:'auto',
          padding:'28px 32px',
        }}>
          {(pageTitle || pageEyebrow) && (
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-end',
              marginBottom:24, gap:24,
            }}>
              <div>
                {pageEyebrow && (
                  <div style={{
                    fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
                    letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6,
                  }}>{pageEyebrow}</div>
                )}
                {pageTitle && (
                  <h1 style={{
                    fontSize:28, fontWeight:600, letterSpacing:'-0.025em',
                    margin:0, lineHeight:1.1,
                  }}>{pageTitle}</h1>
                )}
                {pageSub && (
                  <p style={{
                    fontSize:13.5, color:'var(--ink-3)', margin:'8px 0 0',
                    maxWidth:'62ch', lineHeight:1.5,
                  }}>{pageSub}</p>
                )}
              </div>
              {pageRight && <div style={{display:'flex', gap:8, alignItems:'center'}}>{pageRight}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function V2NavItem({ id, label, icon, active, muted, tag }) {
  return (
    <button style={{
      appearance:'none', border:0, cursor:'pointer',
      background: active ? 'var(--bg-card)' : 'transparent',
      boxShadow: active ? 'var(--shadow-card)' : 'none',
      color: active ? 'var(--ink)' : (muted ? 'var(--ink-3)' : 'var(--ink-2)'),
      textAlign:'left', padding:'7px 10px',
      borderRadius:8, fontSize: muted ? 13 : 13.5,
      fontFamily:'inherit',
      display:'flex', alignItems:'center', gap:10,
      transition:'background .12s',
    }}>
      <span style={{
        width:18, textAlign:'center',
        fontSize: muted ? 11 : 13,
        color: active ? 'var(--accent-ink)' : 'inherit',
        opacity: 0.85,
        fontFamily: muted ? 'var(--font-mono)' : 'inherit',
      }}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {tag && (
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10,
          background: active ? 'var(--bg-elev)' : 'var(--line)',
          color:'var(--ink-3)', padding:'1px 5px', borderRadius:3,
        }}>{tag}</span>
      )}
    </button>
  );
}

// Avatar con menú: Perfil + Cerrar sesión
function V2AvatarMenu({ open: forceOpen }) {
  const [open, setOpen] = React.useState(false);
  const isOpen = forceOpen ?? open;
  return (
    <div style={{position:'relative', borderTop:'1px solid var(--line)'}}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          appearance:'none', border:0, cursor:'pointer',
          background: isOpen ? 'var(--line-2)' : 'transparent',
          display:'flex', alignItems:'center', gap:10, width:'100%',
          padding:'10px 8px', color:'inherit', fontFamily:'inherit', fontSize:13,
        }}
        onMouseEnter={e => !isOpen && (e.currentTarget.style.background='var(--line-2)')}
        onMouseLeave={e => !isOpen && (e.currentTarget.style.background='transparent')}>
        <div style={{
          width:30, height:30, borderRadius:'50%',
          background:'var(--accent-soft)', color:'var(--accent-ink)',
          display:'grid', placeItems:'center',
          fontWeight:600, fontSize:11.5, flexShrink:0,
        }}>{V2_USER.initials}</div>
        <div style={{lineHeight:1.2, minWidth:0, textAlign:'left', flex:1}}>
          <div style={{
            fontWeight:500, fontSize:13, color:'var(--ink)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{V2_USER.name}</div>
          <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>
            {V2_USER.year}° año · {Math.round(V2_USER.progress*100)}%
          </div>
        </div>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{color:'var(--ink-3)', opacity:0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .15s'}}>
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 6px)', left:8, right:8,
          background:'var(--bg-card)',
          border:'1px solid var(--line)', borderRadius:10,
          boxShadow:'var(--shadow-card-h)',
          padding:6, zIndex:10,
          display:'flex', flexDirection:'column', gap:1,
        }}>
          <V2MenuRow icon="◔" label="Mi perfil"/>
          <div style={{height:1, background:'var(--line)', margin:'4px 0'}}/>
          <V2MenuRow icon="↗" label="Cerrar sesión" tone="muted"/>
        </div>
      )}
    </div>
  );
}

function V2MenuRow({ icon, label, tone }) {
  return (
    <button style={{
      appearance:'none', border:0, background:'transparent', cursor:'pointer',
      display:'flex', alignItems:'center', gap:10,
      padding:'8px 10px', borderRadius:6,
      fontFamily:'inherit', fontSize:13,
      color: tone === 'muted' ? 'var(--ink-3)' : 'var(--ink-2)',
      textAlign:'left',
    }}
    onMouseEnter={e=>e.currentTarget.style.background='var(--line-2)'}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <span style={{width:16, textAlign:'center', fontSize:12, opacity:0.8}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
    </button>
  );
}

// Tabs reutilizables (Planificar, Mi carrera, Reseñas)
function V2Tabs({ active, items }) {
  return (
    <div style={{
      display:'flex', gap:4,
      borderBottom:'1px solid var(--line)',
      marginBottom:24,
    }}>
      {items.map(it => (
        <button key={it.id} style={{
          appearance:'none', border:0, background:'transparent',
          cursor:'pointer', fontFamily:'inherit',
          padding:'10px 14px', fontSize:13.5,
          color: active === it.id ? 'var(--ink)' : 'var(--ink-3)',
          fontWeight: active === it.id ? 500 : 400,
          borderBottom:`2px solid ${active === it.id ? 'var(--accent)' : 'transparent'}`,
          marginBottom:-1,
          display:'flex', alignItems:'center', gap:7,
        }}>
          {it.label}
          {it.tag != null && (
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:10,
              padding:'1px 6px', borderRadius:4,
              background: active === it.id ? 'var(--accent-soft)' : 'var(--line)',
              color: active === it.id ? 'var(--accent-ink)' : 'var(--ink-3)',
            }}>{it.tag}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// helper: dot circular para metas
function V2Dot({ color = 'var(--ink-3)', size = 6 }) {
  return <span style={{width:size, height:size, borderRadius:'50%', background:color, display:'inline-block'}}/>;
}

window.V2_USER = V2_USER;
window.V2_PERIOD = V2_PERIOD;
window.V2_ACTIVE = V2_ACTIVE;
window.V2_TO_REVIEW = V2_TO_REVIEW;
window.V2_MOD_LABEL = V2_MOD_LABEL;
window.V2Shell = V2Shell;
window.V2Tabs = V2Tabs;
window.V2Dot = V2Dot;
window.V2Logo = V2Logo;
window.V2AvatarMenu = V2AvatarMenu;
