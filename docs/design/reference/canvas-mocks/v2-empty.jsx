// v2 — Estados vacíos.
// Cada empty state vive en la pantalla que le corresponde, no en una sección aparte.
// Convención visual: card centrada en el contenido, tipo "marca de agua" suave,
// con texto en 3 niveles (kicker mono · titular · línea explicativa) + CTA.

function V2EmptyState({ kicker, title, body, cta, ghost, art }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:18, textAlign:'center',
      padding:'48px 32px',
      maxWidth:480, margin:'0 auto',
      minHeight:360,
    }}>
      {art && <div style={{marginBottom:6}}>{art}</div>}
      {kicker && (
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11,
          color:'var(--ink-3)', letterSpacing:'0.08em',
          textTransform:'uppercase',
        }}>{kicker}</div>
      )}
      <h2 style={{
        fontSize:22, fontWeight:600, color:'var(--ink)',
        margin:0, lineHeight:1.25, letterSpacing:'-0.01em',
      }}>{title}</h2>
      <p style={{
        fontSize:14, color:'var(--ink-2)', margin:0,
        lineHeight:1.55, maxWidth:380,
      }}>{body}</p>
      {(cta || ghost) && (
        <div style={{display:'flex', gap:8, marginTop:6}}>
          {cta && (
            <button style={{
              padding:'8px 14px', borderRadius:8,
              border:'1px solid var(--accent)',
              background:'var(--accent)', color:'var(--accent-on)',
              fontFamily:'inherit', fontSize:13, fontWeight:500,
              cursor:'pointer',
            }}>{cta}</button>
          )}
          {ghost && (
            <button style={{
              padding:'8px 14px', borderRadius:8,
              border:'1px solid var(--line)',
              background:'var(--bg-card)', color:'var(--ink-2)',
              fontFamily:'inherit', fontSize:13,
              cursor:'pointer',
            }}>{ghost}</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── arts: dibujos minimalistas con tokens ────────────────────────
const Art = {
  Period: () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="14" y="20" width="52" height="46" rx="6" stroke="var(--line)" strokeWidth="1.5"/>
      <rect x="14" y="20" width="52" height="10" rx="6" fill="oklch(0.92 0.045 60)"/>
      <line x1="14" y1="30" x2="66" y2="30" stroke="var(--line)" strokeWidth="1.5"/>
      <circle cx="24" cy="14" r="2" fill="var(--ink-3)"/>
      <circle cx="56" cy="14" r="2" fill="var(--ink-3)"/>
      <line x1="24" y1="11" x2="24" y2="22" stroke="var(--ink-3)" strokeWidth="1.5"/>
      <line x1="56" y1="11" x2="56" y2="22" stroke="var(--ink-3)" strokeWidth="1.5"/>
      {/* dashed grid */}
      <line x1="14" y1="42" x2="66" y2="42" stroke="var(--line)" strokeDasharray="2 3"/>
      <line x1="14" y1="54" x2="66" y2="54" stroke="var(--line)" strokeDasharray="2 3"/>
      <line x1="32" y1="30" x2="32" y2="66" stroke="var(--line)" strokeDasharray="2 3"/>
      <line x1="48" y1="30" x2="48" y2="66" stroke="var(--line)" strokeDasharray="2 3"/>
    </svg>
  ),
  Plan: () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="16" y="16" width="48" height="60" rx="4" fill="var(--bg-elev)" stroke="var(--line)" strokeWidth="1.5"/>
      <line x1="24" y1="28" x2="56" y2="28" stroke="var(--line)" strokeWidth="1.5"/>
      <line x1="24" y1="36" x2="48" y2="36" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 3"/>
      <line x1="24" y1="44" x2="56" y2="44" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 3"/>
      <line x1="24" y1="52" x2="40" y2="52" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 3"/>
      <circle cx="60" cy="60" r="10" fill="oklch(0.92 0.045 60)" stroke="var(--accent)" strokeWidth="1.5"/>
      <line x1="60" y1="56" x2="60" y2="64" stroke="var(--accent-ink)" strokeWidth="1.5"/>
      <line x1="56" y1="60" x2="64" y2="60" stroke="var(--accent-ink)" strokeWidth="1.5"/>
    </svg>
  ),
  Done: () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="30" fill="oklch(0.92 0.035 145)" stroke="oklch(0.42 0.06 145)" strokeWidth="1.5"/>
      <path d="M28 41 L36 49 L52 32" stroke="oklch(0.42 0.06 145)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Pen: () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M22 50 L22 58 L30 58 L58 30 L50 22 Z" fill="var(--bg-elev)" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M50 22 L58 30" stroke="var(--accent)" strokeWidth="1.5"/>
      <line x1="20" y1="64" x2="60" y2="64" stroke="var(--line)" strokeWidth="1.5"/>
      <circle cx="48" cy="20" r="3" fill="var(--accent)"/>
    </svg>
  ),
  Search: () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="34" cy="34" r="20" stroke="var(--line)" strokeWidth="1.5" fill="var(--bg-elev)"/>
      <line x1="48" y1="48" x2="62" y2="62" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="28" y1="28" x2="40" y2="40" stroke="var(--ink-3)" strokeWidth="1.5"/>
      <line x1="40" y1="28" x2="28" y2="40" stroke="var(--ink-3)" strokeWidth="1.5"/>
    </svg>
  ),
  Bell: () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M40 20 C32 20 26 26 26 34 L26 46 L22 52 L58 52 L54 46 L54 34 C54 26 48 20 40 20 Z" fill="var(--bg-elev)" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="40" cy="16" r="2.5" fill="var(--ink-3)"/>
      <path d="M35 56 C35 59 37 61 40 61 C43 61 45 59 45 56" stroke="var(--line)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M28 32 L36 40 L52 24" stroke="oklch(0.42 0.06 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

// ── empty states que envuelven al shell real ─────────────────────

function V2InicioVacio() {
  return (
    <V2Shell active="inicio">
      <div style={{padding:'24px 32px'}}>
        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          minHeight:560,
          display:'grid', placeItems:'center',
        }}>
          <V2EmptyState
            art={<Art.Period/>}
            kicker="Bienvenido a plan-b"
            title="Todavía no tenés ningún período cargado"
            body="Un período es un año lectivo (ej. 2026). Adentro ponés las cursadas que estás haciendo y vamos llevando el seguimiento. Empezá creando el actual."
            cta="Crear período 2026"
            ghost="Ver tutorial"
          />
        </div>
      </div>
    </V2Shell>
  );
}

function V2PlanificarVacio() {
  return (
    <V2Shell active="planificar">
      <div style={{padding:'24px 32px'}}>
        {/* tabs visibles para mantener contexto */}
        <div style={{
          display:'flex', gap:18, borderBottom:'1px solid var(--line)',
          marginBottom:24,
        }}>
          {['En curso · 2026', 'Borradores · 0'].map((t,i)=>(
            <div key={i} style={{
              padding:'10px 0', fontSize:13.5,
              color: i===1 ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: i===1 ? 600 : 400,
              borderBottom: i===1 ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom:-1,
            }}>{t}</div>
          ))}
        </div>

        <div style={{
          background:'var(--bg-card)',
          border:'1px dashed var(--line)',
          borderRadius:12,
          minHeight:440,
          display:'grid', placeItems:'center',
        }}>
          <V2EmptyState
            art={<Art.Plan/>}
            kicker="Planificar"
            title="Probá un cuatrimestre antes de inscribirte"
            body="Armá un borrador con materias, docentes y comisiones. Plan-b te avisa de choques de horario, carga estimada y reseñas relevantes. Después decidís."
            cta="Crear primer borrador"
            ghost="Cómo funciona"
          />
        </div>
      </div>
    </V2Shell>
  );
}

function V2ResenasPendientesVacio() {
  return (
    <V2Shell active="resenas">
      <div style={{padding:'24px 32px'}}>
        <div style={{
          display:'flex', gap:18, borderBottom:'1px solid var(--line)',
          marginBottom:24,
        }}>
          {['Explorar', 'Pendientes · 0', 'Mis reseñas · 8'].map((t,i)=>(
            <div key={i} style={{
              padding:'10px 0', fontSize:13.5,
              color: i===1 ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: i===1 ? 600 : 400,
              borderBottom: i===1 ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom:-1,
            }}>{t}</div>
          ))}
        </div>

        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          minHeight:440,
          display:'grid', placeItems:'center',
        }}>
          <V2EmptyState
            art={<Art.Done/>}
            kicker="Al día"
            title="No tenés reseñas pendientes"
            body="Reseñaste todas las cursadas que cerraste. Cuando termine 2026·1c te avisamos para que cuentes cómo te fue."
            ghost="Editar mis reseñas"
          />
        </div>
      </div>
    </V2Shell>
  );
}

function V2MisResenasVacio() {
  return (
    <V2Shell active="resenas">
      <div style={{padding:'24px 32px'}}>
        <div style={{
          display:'flex', gap:18, borderBottom:'1px solid var(--line)',
          marginBottom:24,
        }}>
          {['Explorar', 'Pendientes · 2', 'Mis reseñas · 0'].map((t,i)=>(
            <div key={i} style={{
              padding:'10px 0', fontSize:13.5,
              color: i===2 ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: i===2 ? 600 : 400,
              borderBottom: i===2 ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom:-1,
            }}>{t}</div>
          ))}
        </div>

        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          minHeight:440,
          display:'grid', placeItems:'center',
        }}>
          <V2EmptyState
            art={<Art.Pen/>}
            kicker="Tu primera reseña"
            title="Todavía no escribiste ninguna"
            body="Tus reseñas son anónimas hacia afuera y le sirven a quienes vienen detrás. Tenés 2 cursadas listas para reseñar."
            cta="Escribir primera reseña"
            ghost="Cómo escribir buenas reseñas"
          />
        </div>
      </div>
    </V2Shell>
  );
}

function V2BusquedaVacia() {
  return (
    <div style={{position:'relative'}}>
      <V2Inicio/>

      <div style={{
        position:'absolute', inset:0,
        background:'oklch(0.18 0.02 60 / 0.32)',
        backdropFilter:'blur(2px)',
        zIndex:50,
      }}/>

      <div style={{
        position:'absolute',
        top:14, left:'50%', transform:'translateX(-50%)',
        width:520, zIndex:60,
        background:'var(--bg-card)',
        border:'1px solid var(--line)',
        borderRadius:10,
        boxShadow:'0 12px 40px oklch(0.18 0.02 60 / 0.18)',
        overflow:'hidden',
      }}>
        {/* input con query que no devolvió nada */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 16px',
          borderBottom:'1px solid var(--line)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--ink-3)', flexShrink:0}}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input value="quimica organica III" readOnly style={{
            flex:1, border:'none', outline:'none', background:'none',
            fontFamily:'inherit', fontSize:14, color:'var(--ink)',
          }}/>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            padding:'2px 6px', border:'1px solid var(--line)', borderRadius:4,
          }}>esc</span>
        </div>

        <div style={{padding:'48px 24px 32px'}}>
          <V2EmptyState
            art={<Art.Search/>}
            kicker="Sin coincidencias"
            title={<>Nada para "quimica organica III"</>}
            body="No es una materia, docente o comisión de tu carrera. Probá con menos palabras o revisá si la materia se llama distinto en tu plan."
            ghost="Sugerir materia faltante"
          />
        </div>
      </div>
    </div>
  );
}

function V2NotifVacio() {
  return (
    <div style={{position:'relative'}}>
      <V2Inicio/>

      <div style={{
        position:'absolute', inset:0,
        background:'oklch(0.18 0.02 60 / 0.18)',
        zIndex:50,
      }}/>

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
        <span style={{
          position:'absolute', top:-7, right:62,
          width:12, height:12, transform:'rotate(45deg)',
          background:'var(--bg-card)',
          borderTop:'1px solid var(--line)',
          borderLeft:'1px solid var(--line)',
        }}/>

        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px 12px',
        }}>
          <span style={{fontSize:15, fontWeight:600, color:'var(--ink)'}}>
            Notificaciones
          </span>
        </div>

        <div style={{padding:'8px 24px 32px'}}>
          <V2EmptyState
            art={<Art.Bell/>}
            kicker="Al día"
            title="No hay nada nuevo"
            body="Cuando alguien marque útil tu reseña, un docente responda o aparezca algo relevante para tu plan, te avisamos acá."
            ghost="Configurar notificaciones"
          />
        </div>

        <div style={{
          padding:'10px 16px',
          borderTop:'1px solid var(--line)',
          textAlign:'center',
          background:'var(--bg-elev)',
        }}>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:11,
            color:'var(--ink-3)', letterSpacing:'0.06em',
            textTransform:'uppercase',
          }}>0 sin leer</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  V2EmptyState,
  V2InicioVacio,
  V2PlanificarVacio,
  V2ResenasPendientesVacio,
  V2MisResenasVacio,
  V2BusquedaVacia,
  V2NotifVacio,
});
