// v2 — Notificaciones (panel del bell del topbar).
// Overlay sobre Inicio. Patrón visual igual al dropdown de búsqueda.

const V2_NOTIF_DATA = {
  unreadCount: 4,
  hoy: [
    {
      id: 'n1',
      unread: true,
      kind: 'util',
      icon: '★',
      tone: 'apricot',
      title: <><b>3 estudiantes</b> marcaron útil tu reseña de <b>ISW301</b></>,
      sub: 'Llevás 12 reseñas con marca de utilidad este cuatri',
      time: 'hace 2 h',
    },
    {
      id: 'n2',
      unread: true,
      kind: 'reply',
      icon: '↳',
      tone: 'sage',
      title: <><b>Alejandro Brandt</b> respondió a tu pregunta en <b>Algoritmos II</b></>,
      sub: '"Sobre el parcial integrador, lo importante es que entiendan…"',
      time: 'hace 4 h',
    },
  ],
  semana: [
    {
      id: 'n3',
      unread: true,
      kind: 'nueva',
      icon: '◧',
      tone: 'apricot',
      title: <>Nueva reseña de <b>ISW302</b> — la tenés en tu plan</>,
      sub: '★★★★☆ · "Buen seguimiento. Bibliografía bien curada"',
      time: 'martes',
    },
    {
      id: 'n4',
      unread: true,
      kind: 'recordatorio',
      icon: '!',
      tone: 'amber',
      title: <>Cerró el cuatrimestre <b>2025·1c</b> — te faltan reseñar <b>2 cursadas</b></>,
      sub: 'Reseñalas mientras tenés fresco. 5 min cada una',
      time: 'lunes',
    },
    {
      id: 'n5',
      unread: false,
      kind: 'plan',
      icon: '+',
      tone: 'sage',
      title: <>Se abrió una nueva comisión de <b>BD202</b> los miércoles 19—22</>,
      sub: 'Encaja con tu plan en borrador para 2025·2c',
      time: 'lunes',
    },
  ],
  antes: [
    {
      id: 'n6',
      unread: false,
      kind: 'sistema',
      icon: '◌',
      tone: 'neutral',
      title: <>plan-b actualizó las correlativas según el último plan oficial UTN</>,
      sub: 'Se actualizaron 4 materias de tu carrera',
      time: '24 abr',
    },
    {
      id: 'n7',
      unread: false,
      kind: 'util',
      icon: '★',
      tone: 'apricot',
      title: <><b>Tu reseña de Brandt</b> alcanzó las <b>50 marcas útiles</b></>,
      sub: 'Es la 7ma más útil del docente',
      time: '21 abr',
    },
    {
      id: 'n8',
      unread: false,
      kind: 'reply',
      icon: '↳',
      tone: 'sage',
      title: <><b>María Castro</b> respondió a tu pregunta en <b>Aplicaciones Móviles</b></>,
      sub: '"Para el trabajo final pueden elegir libre…"',
      time: '18 abr',
    },
  ],
};

const V2_NOTIF_TONES = {
  apricot: { bg: 'oklch(0.92 0.045 60)', fg: 'var(--accent-ink)' },
  sage:    { bg: 'oklch(0.92 0.035 145)', fg: 'oklch(0.42 0.06 145)' },
  amber:   { bg: 'oklch(0.92 0.06 80)',  fg: 'oklch(0.45 0.12 70)' },
  neutral: { bg: 'var(--bg-elev)',       fg: 'var(--ink-3)' },
};

function V2NotifItem({ n }) {
  const tone = V2_NOTIF_TONES[n.tone] || V2_NOTIF_TONES.neutral;
  return (
    <div style={{
      position:'relative',
      padding:'12px 16px 12px 28px',
      borderTop:'1px solid var(--line)',
      cursor:'pointer',
      background: n.unread ? 'oklch(0.985 0.01 60)' : 'var(--bg-card)',
    }}
    onMouseEnter={e => e.currentTarget.style.background='var(--bg-elev)'}
    onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'oklch(0.985 0.01 60)' : 'var(--bg-card)'}>
      {/* dot unread */}
      {n.unread && (
        <span style={{
          position:'absolute', left:14, top:20,
          width:6, height:6, borderRadius:'50%',
          background:'var(--accent)',
        }}/>
      )}

      <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
        {/* icon avatar */}
        <span style={{
          flexShrink:0,
          width:28, height:28, borderRadius:6,
          background: tone.bg, color: tone.fg,
          display:'grid', placeItems:'center',
          fontSize:14, fontFamily:'var(--font-mono)',
          marginTop:1,
        }}>{n.icon}</span>

        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize:13.5, lineHeight:1.45, color:'var(--ink)',
          }}>{n.title}</div>
          <div style={{
            fontSize:12, color:'var(--ink-3)', marginTop:3,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{n.sub}</div>
        </div>

        <span style={{
          flexShrink:0,
          fontFamily:'var(--font-mono)', fontSize:10.5,
          color:'var(--ink-3)', whiteSpace:'nowrap',
          marginTop:3,
        }}>{n.time}</span>
      </div>
    </div>
  );
}

function V2NotifGroup({ label, items }) {
  return (
    <div>
      <div style={{
        padding:'10px 16px 6px',
        fontFamily:'var(--font-mono)', fontSize:10.5,
        color:'var(--ink-3)', letterSpacing:'0.06em',
        textTransform:'uppercase',
        background:'var(--bg-elev)',
        borderTop:'1px solid var(--line)',
      }}>{label}</div>
      {items.map(n => <V2NotifItem key={n.id} n={n}/>)}
    </div>
  );
}

function V2Notif() {
  const d = V2_NOTIF_DATA;

  return (
    <div style={{position:'relative'}}>
      <V2Inicio/>

      {/* backdrop sutil */}
      <div style={{
        position:'absolute', inset:0,
        background:'oklch(0.18 0.02 60 / 0.18)',
        zIndex:50,
      }}/>

      {/* dropdown anclado al bell del topbar (esquina sup-derecha) */}
      <div style={{
        position:'absolute',
        top:54, right:18,
        width:420, zIndex:60,
        background:'var(--bg-card)',
        border:'1px solid var(--line)',
        borderRadius:10,
        boxShadow:'0 12px 40px oklch(0.18 0.02 60 / 0.18)',
        overflow:'hidden',
      }}>
        {/* tail apuntando al bell */}
        <span style={{
          position:'absolute', top:-7, right:62,
          width:12, height:12, transform:'rotate(45deg)',
          background:'var(--bg-card)',
          borderTop:'1px solid var(--line)',
          borderLeft:'1px solid var(--line)',
        }}/>

        {/* header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px 12px',
        }}>
          <div style={{display:'flex', alignItems:'baseline', gap:8}}>
            <span style={{fontSize:15, fontWeight:600, color:'var(--ink)'}}>
              Notificaciones
            </span>
            {d.unreadCount > 0 && (
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:11,
                color:'var(--accent-ink)',
                padding:'1px 6px', borderRadius:4,
                background:'oklch(0.92 0.045 60)',
              }}>{d.unreadCount}</span>
            )}
          </div>
          <div style={{display:'flex', gap:4}}>
            <button title="Ajustes de notificaciones" style={{
              width:26, height:26, borderRadius:6,
              border:'none', background:'none', cursor:'pointer',
              color:'var(--ink-3)',
              display:'grid', placeItems:'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background='var(--bg-elev)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* tabs */}
        <div style={{
          display:'flex', gap:4,
          padding:'0 12px 8px',
        }}>
          <button style={{
            padding:'6px 10px', borderRadius:6,
            border:'1px solid var(--line)',
            background:'var(--bg-card)',
            fontFamily:'inherit', fontSize:12,
            color:'var(--ink)', fontWeight:500,
            cursor:'pointer',
          }}>Todas</button>
          <button style={{
            padding:'6px 10px', borderRadius:6,
            border:'1px solid transparent',
            background:'none',
            fontFamily:'inherit', fontSize:12,
            color:'var(--ink-3)',
            cursor:'pointer',
          }}>No leídas · {d.unreadCount}</button>
          <span style={{flex:1}}/>
          <button style={{
            padding:'6px 8px', borderRadius:6,
            border:'none', background:'none',
            fontFamily:'inherit', fontSize:11.5,
            color:'var(--ink-3)',
            cursor:'pointer',
          }}>Marcar todas leídas</button>
        </div>

        {/* lista scrollable */}
        <div style={{maxHeight:480, overflowY:'auto'}}>
          <V2NotifGroup label="Hoy" items={d.hoy}/>
          <V2NotifGroup label="Esta semana" items={d.semana}/>
          <V2NotifGroup label="Antes" items={d.antes}/>
        </div>

        {/* footer */}
        <div style={{
          padding:'10px 16px',
          borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between',
          background:'var(--bg-elev)',
        }}>
          <button style={{
            border:'none', background:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:12.5,
            color:'var(--accent-ink)', fontWeight:500,
          }}>Ver todas</button>
          <button style={{
            border:'none', background:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:12.5,
            color:'var(--ink-3)',
          }}>Configurar notificaciones</button>
        </div>
      </div>
    </div>
  );
}

window.V2Notif = V2Notif;
