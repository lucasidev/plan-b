// plan-b admin — shell + componentes base.
// Internal tool. Densidad alta, tablas, mono para IDs, sin marketing.

const ADM_USER = {
  name: 'Lautaro Maza',
  initials: 'LM',
  role: 'plan-b · ops',
};

const ADM_NAV = [
  { group: 'General', items: [
    { id:'dash',  label:'Dashboard',     ic:'◇' },
  ]},
  { group: 'Datos académicos', items: [
    { id:'uni',   label:'Universidades', ic:'⊙', tag:'12' },
    { id:'car',   label:'Carreras',      ic:'⌬', tag:'47' },
    { id:'mat',   label:'Materias',      ic:'▦', tag:'1.2k' },
    { id:'doc',   label:'Docentes',      ic:'☉', tag:'380' },
    { id:'com',   label:'Comisiones',    ic:'⊞' },
    { id:'imp',   label:'Importador',    ic:'↓' },
  ]},
  { group: 'Moderación', items: [
    { id:'rep',   label:'Reportes',      ic:'!', tag:'14' },
    { id:'usr',   label:'Usuarios',      ic:'☻' },
  ]},
  { group: 'Operación', items: [
    { id:'mig',   label:'Migraciones',   ic:'⇄' },
    { id:'log',   label:'Audit log',     ic:'≡' },
  ]},
];

function AdmLogo() {
  return (
    <span style={{display:'inline-flex', alignItems:'baseline', gap:7}}>
      <span style={{fontWeight:600, fontSize:14, letterSpacing:'-0.01em'}}>
        plan-b<span style={{display:'inline-block', width:5, height:5, background:'var(--accent)', borderRadius:'50%', marginLeft:2, transform:'translateY(-3px)'}}/>
      </span>
      <span className="pill" style={{fontFamily:'IBM Plex Mono,monospace', fontSize:9, letterSpacing:'0.12em', background:'var(--ink)', color:'#fff', padding:'2px 7px', borderRadius:3, textTransform:'uppercase', fontWeight:600}}>
        admin
      </span>
    </span>
  );
}

// Shell común para todas las pantallas de admin.
// active = id de nav. crumbs = array. pageTitle / pageEyebrow / pageSub / actions.
function AdmShell({ active, crumbs = [], pageEyebrow, pageTitle, pageSub, actions, children, contentPad = '22px 28px 40px' }) {
  return (
    <div className="adm">
      {/* Sidebar */}
      <aside className="adm-sb">
        <div className="brand">
          <AdmLogo/>
        </div>
        <nav style={{display:'flex', flexDirection:'column'}}>
          {ADM_NAV.map(g => (
            <React.Fragment key={g.group}>
              <div className="group">{g.group}</div>
              {g.items.map(it => (
                <div key={it.id} className={'it ' + (active === it.id ? 'active' : '')}>
                  <span className="ic">{it.ic}</span>
                  <span style={{flex:1}}>{it.label}</span>
                  {it.tag && <span className="tag">{it.tag}</span>}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div className="me">
          <div className="av">{ADM_USER.initials}</div>
          <div>
            {ADM_USER.name}
            <small>{ADM_USER.role}</small>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-main">
        <header className="adm-tb">
          <div className="crumbs">
            {crumbs.length === 0 ? <b>—</b> : crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">/</span>}
                {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="spacer"/>
          <div className="search">
            <span style={{opacity:0.6}}>⌕</span>
            <span style={{flex:1}}>Saltar a uni, carrera, materia, usuario…</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="ic-btn" title="Notificaciones internas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </button>
        </header>

        <div className="adm-content" style={{padding: contentPad}}>
          {(pageTitle || pageEyebrow) && (
            <div className="adm-ph">
              <div>
                {pageEyebrow && <div className="eyebrow">{pageEyebrow}</div>}
                {pageTitle && <h1>{pageTitle}</h1>}
                {pageSub && <p>{pageSub}</p>}
              </div>
              {actions && <div className="actions">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Tabla genérica ───────────────────────────────────────────────
// columns: [{ key, label, w, align, cell?(row) }]
function AdmTable({ columns, rows, dense }) {
  const grid = columns.map(c => c.w || '1fr').join(' ');
  return (
    <div className="adm-table" style={dense ? {'--adm-row-h':'30px'} : {}}>
      <div className="thead" style={{gridTemplateColumns:grid}}>
        {columns.map(c => (
          <div key={c.key} className={c.align || ''}>{c.label}</div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="tr" style={{gridTemplateColumns:grid}}>
          {columns.map(c => (
            <div key={c.key} className={(c.align || '') + (c.mono ? ' mono' : '') + (c.muted ? ' muted' : '')}>
              {c.cell ? c.cell(r) : r[c.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Filtros barra (chips) ─────────────────────────────────────────
function AdmFilters({ children }) {
  return (
    <div style={{display:'flex', gap:7, marginBottom:14, alignItems:'center', flexWrap:'wrap'}}>
      {children}
    </div>
  );
}
function AdmFilterChip({ label, value, on }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 9px', background: on ? 'var(--ink)' : 'var(--adm-bg-card)',
      color: on ? '#fff' : 'var(--ink-2)',
      border:'1px solid ' + (on ? 'var(--ink)' : 'var(--adm-line)'),
      borderRadius:5, fontSize:11.5, cursor:'pointer',
    }}>
      <span>{label}</span>
      {value != null && <span style={{fontFamily:'IBM Plex Mono,monospace', fontSize:10, opacity:0.7}}>{value}</span>}
    </div>
  );
}

// ── Botón agrupado por icono ─────────────────────────────────────
function AdmIcon({ d, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

window.AdmShell = AdmShell;
window.AdmTable = AdmTable;
window.AdmFilters = AdmFilters;
window.AdmFilterChip = AdmFilterChip;
window.AdmIcon = AdmIcon;
window.ADM_USER = ADM_USER;
