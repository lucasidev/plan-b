// v2 — Estados de error.
//
// Convención visual:
// - Página completa (404, 5xx) → shell completo con bloque card centrada,
//   texto en 3 niveles (kicker mono · titular · body) + CTA primario + ghost.
// - Banner persistente (offline) → barra top con tono ámbar, no rojo.
// - Inline (conflicto, correlativa, dup) → card amber dentro de la pantalla.
// - Modal de confirmación se hace en la siguiente ronda (modales).

const ErrPalette = {
  amberBg:   'oklch(0.96 0.04 75)',
  amberLine: 'oklch(0.78 0.12 75)',
  amberInk:  'oklch(0.42 0.14 75)',
  amberMuted:'oklch(0.55 0.10 75)',
  redBg:     'oklch(0.95 0.04 30)',
  redLine:   'oklch(0.78 0.12 30)',
  redInk:    'oklch(0.42 0.14 30)',
  redMuted:  'oklch(0.55 0.10 30)',
};

// ── Pieza reusable: card de error en pantalla ───────────────────
function V2ErrorCard({ kicker, code, title, body, cta, ghost, art }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:18, textAlign:'center',
      padding:'48px 32px',
      maxWidth:520, margin:'0 auto',
      minHeight:480,
    }}>
      {art && <div style={{marginBottom:6}}>{art}</div>}
      {(kicker || code) && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          fontFamily:'var(--font-mono)', fontSize:11,
          color:'var(--ink-3)', letterSpacing:'0.08em',
          textTransform:'uppercase',
        }}>
          {code && <span style={{
            padding:'3px 8px', borderRadius:4,
            background:'var(--bg-elev)', border:'1px solid var(--line)',
            color:'var(--ink)', fontWeight:600,
          }}>{code}</span>}
          {kicker && <span>{kicker}</span>}
        </div>
      )}
      <h2 style={{
        fontSize:22, fontWeight:600, color:'var(--ink)',
        margin:0, lineHeight:1.25, letterSpacing:'-0.01em',
      }}>{title}</h2>
      <p style={{
        fontSize:14, color:'var(--ink-2)', margin:0,
        lineHeight:1.55, maxWidth:420,
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

// ── Banner inline reutilizable ──────────────────────────────────
function V2InlineAlert({ tone='amber', icon='!', title, body, actions }) {
  const c = tone === 'red'
    ? { bg: ErrPalette.redBg,   line: ErrPalette.redLine,   ink: ErrPalette.redInk,   muted: ErrPalette.redMuted }
    : { bg: ErrPalette.amberBg, line: ErrPalette.amberLine, ink: ErrPalette.amberInk, muted: ErrPalette.amberMuted };

  return (
    <div style={{
      display:'flex', gap:12, alignItems:'flex-start',
      padding:'12px 14px',
      background:c.bg,
      border:`1px solid ${c.line}`,
      borderRadius:10,
    }}>
      <span aria-hidden="true" style={{
        flexShrink:0, marginTop:1,
        width:22, height:22, borderRadius:'50%',
        background:c.line, color:'white',
        display:'grid', placeItems:'center',
        fontSize:13, fontWeight:700,
        fontFamily:'var(--font-mono)',
      }}>{icon}</span>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13.5, fontWeight:600, color:c.ink, lineHeight:1.4}}>
          {title}
        </div>
        {body && <div style={{
          fontSize:12.5, color:c.muted,
          marginTop:3, lineHeight:1.5,
        }}>{body}</div>}
        {actions && <div style={{
          display:'flex', gap:10, marginTop:10,
        }}>{actions}</div>}
      </div>
    </div>
  );
}

// ── arts ────────────────────────────────────────────────────────
const ErrArt = {
  Lost: () => (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
      <rect x="14" y="20" width="56" height="48" rx="6" fill="var(--bg-elev)" stroke="var(--line)" strokeWidth="1.5"/>
      <line x1="14" y1="32" x2="70" y2="32" stroke="var(--line)" strokeWidth="1.5"/>
      <circle cx="22" cy="26" r="2" fill="var(--ink-3)"/>
      <circle cx="30" cy="26" r="2" fill="var(--ink-3)"/>
      <circle cx="38" cy="26" r="2" fill="var(--ink-3)"/>
      <text x="42" y="56" textAnchor="middle"
        fontFamily="ui-monospace, monospace" fontSize="18" fontWeight="600"
        fill="var(--ink-3)">404</text>
    </svg>
  ),
  Crash: () => (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
      <circle cx="42" cy="42" r="28" fill={ErrPalette.amberBg} stroke={ErrPalette.amberLine} strokeWidth="1.5"/>
      <line x1="32" y1="32" x2="52" y2="52" stroke={ErrPalette.amberInk} strokeWidth="2" strokeLinecap="round"/>
      <line x1="52" y1="32" x2="32" y2="52" stroke={ErrPalette.amberInk} strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 70 Q34 64 42 64 Q50 64 56 70" stroke="var(--ink-3)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// 1 · 404 · No encontrado
// ════════════════════════════════════════════════════════════════
function V2Error404() {
  return (
    <V2Shell active="">
      <div style={{padding:'24px 32px'}}>
        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          minHeight:560,
          display:'grid', placeItems:'center',
        }}>
          <V2ErrorCard
            art={<ErrArt.Lost/>}
            code="404"
            kicker="No encontrado"
            title="No encontramos lo que buscabas"
            body="Esta materia, docente o página puede haber cambiado de URL, salido del plan o no existir más. Si llegaste por un link viejo, avisanos."
            cta="Volver al inicio"
            ghost="Reportar link roto"
          />
        </div>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · 5xx · Algo se rompió
// ════════════════════════════════════════════════════════════════
function V2Error5xx() {
  return (
    <V2Shell active="">
      <div style={{padding:'24px 32px'}}>
        <div style={{
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          minHeight:560,
          display:'grid', placeItems:'center',
        }}>
          <V2ErrorCard
            art={<ErrArt.Crash/>}
            code="500"
            kicker="Error del servidor"
            title="Algo se rompió de nuestro lado"
            body="Nuestro sistema falló al procesar tu pedido. No es tu conexión. Probá de nuevo en unos segundos — si sigue fallando, avisanos."
            cta="Reintentar"
            ghost="Reportar el problema"
          />
          <div style={{
            position:'absolute',
            fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-4)',
            letterSpacing:'0.04em',
          }}/>
        </div>
        <div style={{
          marginTop:12, textAlign:'center',
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-4)',
          letterSpacing:'0.04em',
        }}>
          ref · ERR_8F3A2C1B · 14:32 · 7 mayo 2026
        </div>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 3 · Sin conexión · banner top + estado degradado
// ════════════════════════════════════════════════════════════════
function V2OfflineBanner() {
  return (
    <V2Shell active="inicio">
      {/* banner persistente top */}
      <div style={{
        background:ErrPalette.amberBg,
        borderBottom:`1px solid ${ErrPalette.amberLine}`,
        padding:'10px 28px',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span aria-hidden="true" style={{
          width:18, height:18, borderRadius:'50%',
          background:ErrPalette.amberLine, color:'white',
          display:'grid', placeItems:'center',
          fontSize:10, fontWeight:700, fontFamily:'var(--font-mono)',
        }}>!</span>
        <span style={{fontSize:13, fontWeight:600, color:ErrPalette.amberInk}}>
          Sin conexión
        </span>
        <span style={{fontSize:12.5, color:ErrPalette.amberMuted}}>
          · Estás viendo lo que cargaste antes. Las acciones (reseñar, planificar) están en pausa.
        </span>
        <span style={{flex:1}}/>
        <button style={{
          padding:'4px 10px', borderRadius:6,
          background:'transparent', border:`1px solid ${ErrPalette.amberLine}`,
          color:ErrPalette.amberInk, fontSize:12, fontFamily:'inherit',
          cursor:'pointer',
        }}>Reintentar conexión</button>
      </div>

      {/* contenido degradado: simulamos Inicio con cards en estado "stale" */}
      <div style={{padding:'24px 32px'}}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
          letterSpacing:'0.06em', textTransform:'uppercase',
          marginBottom:8,
        }}>Última sincronización · hace 6 min</div>
        <h1 style={{
          fontSize:24, fontWeight:600, margin:0, marginBottom:18,
          letterSpacing:'-0.01em',
        }}>Hola, Lucía</h1>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
          <div style={{
            background:'var(--bg-card)',
            border:'1px solid var(--line)',
            borderRadius:12,
            padding:'18px 20px',
            opacity:0.86,
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
              letterSpacing:'0.06em', textTransform:'uppercase',
              marginBottom:8,
            }}>Período en curso · 2026</div>
            <div style={{fontSize:18, fontWeight:600, marginBottom:18}}>
              5 cursadas · semana 9 de 16
            </div>
            <div style={{
              height:8, borderRadius:4,
              background:'var(--bg-elev)', overflow:'hidden',
            }}>
              <div style={{height:'100%', width:'56%', background:'var(--accent)'}}/>
            </div>
            <div style={{
              marginTop:14, padding:'10px 12px',
              background:ErrPalette.amberBg,
              border:`1px dashed ${ErrPalette.amberLine}`,
              borderRadius:8, fontSize:12.5, color:ErrPalette.amberMuted,
            }}>
              No vamos a actualizar el progreso ni las reseñas hasta que vuelva la conexión.
            </div>
          </div>

          <div style={{
            background:'var(--bg-card)',
            border:'1px solid var(--line)',
            borderRadius:12,
            padding:'18px 20px',
            display:'flex', flexDirection:'column', gap:12,
            opacity:0.86,
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>Acciones</div>
            {['Escribir reseña', 'Nuevo borrador', 'Editar perfil'].map(a => (
              <div key={a} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 12px',
                border:'1px solid var(--line)',
                borderRadius:8,
                color:'var(--ink-3)', fontSize:13,
                background:'var(--bg-elev)',
              }}>
                <span>{a}</span>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:10,
                  color:'var(--ink-4)', letterSpacing:'0.06em',
                  textTransform:'uppercase',
                }}>en pausa</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 4 · Conflicto de horario en Planificar
// ════════════════════════════════════════════════════════════════
function V2ConflictoHorario() {
  return (
    <V2Shell active="planificar">
      <div style={{padding:'24px 32px'}}>
        <div style={{
          display:'flex', gap:18, borderBottom:'1px solid var(--line)',
          marginBottom:18,
        }}>
          {['En curso · 2026', 'Borrador · 2026·2c'].map((t,i)=>(
            <div key={i} style={{
              padding:'10px 0', fontSize:13.5,
              color: i===1 ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: i===1 ? 600 : 400,
              borderBottom: i===1 ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom:-1,
            }}>{t}</div>
          ))}
        </div>

        {/* alerta inline arriba */}
        <V2InlineAlert
          tone="amber"
          icon="!"
          title="2 cursadas chocan en horario"
          body={<>
            <b>BD202 (Mié 19—22)</b> y <b>ARQ301 (Mié 19—22)</b> se superponen.
            No vas a poder inscribirte a las dos. Cambiá la comisión de alguna o sacá una del borrador.
          </>}
          actions={<>
            <button style={{
              padding:'6px 12px', borderRadius:6,
              border:`1px solid ${ErrPalette.amberLine}`,
              background:'transparent', color:ErrPalette.amberInk,
              fontFamily:'inherit', fontSize:12, cursor:'pointer',
            }}>Ver alternativas de BD202</button>
            <button style={{
              padding:'6px 12px', borderRadius:6,
              border:'none', background:'transparent',
              color:ErrPalette.amberMuted, fontFamily:'inherit', fontSize:12,
              cursor:'pointer',
            }}>Sacar ARQ301 del borrador</button>
          </>}
        />

        {/* mock de grilla de horario con conflict highlight */}
        <div style={{
          marginTop:18,
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          overflow:'hidden',
        }}>
          <div style={{
            display:'grid', gridTemplateColumns:'80px repeat(5, 1fr)',
            borderBottom:'1px solid var(--line)',
            background:'var(--bg-elev)',
          }}>
            <div style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)', letterSpacing:'0.06em', textTransform:'uppercase'}}>Hora</div>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map(d => (
              <div key={d} style={{padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)', letterSpacing:'0.06em', textTransform:'uppercase'}}>{d}</div>
            ))}
          </div>
          {['08—11', '14—17', '17—20', '19—22'].map((h, ri) => (
            <div key={h} style={{
              display:'grid', gridTemplateColumns:'80px repeat(5, 1fr)',
              borderBottom:'1px solid var(--line)',
              minHeight:64,
            }}>
              <div style={{padding:'12px', fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--ink-3)'}}>{h}</div>
              {[0,1,2,3,4].map(ci => {
                const isConflict = (h === '19—22' && ci === 2);
                const filled = (
                  (h === '08—11' && ci === 0) ||
                  (h === '14—17' && ci === 1) ||
                  (h === '17—20' && ci === 3)
                );
                if (isConflict) {
                  return (
                    <div key={ci} style={{
                      padding:6,
                      background:ErrPalette.amberBg,
                      borderLeft:`2px solid ${ErrPalette.amberLine}`,
                      display:'flex', flexDirection:'column', gap:4,
                    }}>
                      <div style={{
                        padding:'4px 6px', borderRadius:4,
                        background:'var(--bg-card)', fontSize:11.5,
                        color:'var(--ink)', display:'flex', justifyContent:'space-between',
                      }}>
                        <span><b>BD202</b> · A</span>
                        <span style={{color:ErrPalette.amberInk, fontFamily:'var(--font-mono)', fontSize:10}}>!</span>
                      </div>
                      <div style={{
                        padding:'4px 6px', borderRadius:4,
                        background:'var(--bg-card)', fontSize:11.5,
                        color:'var(--ink)', display:'flex', justifyContent:'space-between',
                      }}>
                        <span><b>ARQ301</b> · B</span>
                        <span style={{color:ErrPalette.amberInk, fontFamily:'var(--font-mono)', fontSize:10}}>!</span>
                      </div>
                    </div>
                  );
                }
                if (filled) {
                  return (
                    <div key={ci} style={{padding:6}}>
                      <div style={{
                        padding:'6px 8px', borderRadius:4,
                        background:'oklch(0.92 0.045 60)',
                        fontSize:11.5, color:'var(--accent-ink)',
                      }}>cursada</div>
                    </div>
                  );
                }
                return <div key={ci}/>;
              })}
            </div>
          ))}
        </div>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 5 · Correlativa faltante (overlay sobre Materia detalle)
// ════════════════════════════════════════════════════════════════
function V2CorrelativaFaltante() {
  return (
    <div style={{position:'relative'}}>
      <V2MateriaDetalle/>

      {/* backdrop */}
      <div style={{
        position:'absolute', inset:0,
        background:'oklch(0.18 0.02 60 / 0.36)',
        zIndex:50,
      }}/>

      {/* dialog */}
      <div style={{
        position:'absolute',
        top:'50%', left:'50%', transform:'translate(-50%, -50%)',
        width:480, zIndex:60,
        background:'var(--bg-card)',
        border:'1px solid var(--line)',
        borderRadius:12,
        boxShadow:'0 16px 48px oklch(0.18 0.02 60 / 0.22)',
        overflow:'hidden',
      }}>
        <div style={{
          padding:'18px 20px 14px',
          borderBottom:'1px solid var(--line)',
          background:ErrPalette.amberBg,
          display:'flex', gap:12, alignItems:'flex-start',
        }}>
          <span aria-hidden="true" style={{
            flexShrink:0, marginTop:2,
            width:22, height:22, borderRadius:'50%',
            background:ErrPalette.amberLine, color:'white',
            display:'grid', placeItems:'center',
            fontSize:13, fontWeight:700, fontFamily:'var(--font-mono)',
          }}>!</span>
          <div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5,
              color:ErrPalette.amberMuted, letterSpacing:'0.08em',
              textTransform:'uppercase',
            }}>Correlativa faltante</div>
            <h3 style={{
              fontSize:17, fontWeight:600, margin:'4px 0 0',
              color:ErrPalette.amberInk, letterSpacing:'-0.01em',
            }}>Todavía no podés cursar ISW302</h3>
          </div>
        </div>

        <div style={{padding:'18px 20px'}}>
          <p style={{
            fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55,
            margin:0, marginBottom:14,
          }}>
            Para cursar <b>Ingeniería de Software II</b> necesitás tener aprobada
            <b> Ingeniería de Software I</b>. Hoy figura como regular en tu historial.
          </p>

          <div style={{
            display:'flex', flexDirection:'column', gap:8,
            padding:'12px 14px',
            background:'var(--bg-elev)',
            borderRadius:8, border:'1px solid var(--line)',
          }}>
            {[
              ['ISW201', 'Ingeniería de Software I', 'regular', 'amber'],
              ['ALG202', 'Algoritmos y Estructuras II', 'aprobada', 'sage'],
            ].map(([code, name, st, tone]) => (
              <div key={code} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                fontSize:13,
              }}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:11.5,
                    color:'var(--ink-3)',
                  }}>{code}</span>
                  <span style={{color:'var(--ink)'}}>{name}</span>
                </div>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:10.5,
                  letterSpacing:'0.06em', textTransform:'uppercase',
                  padding:'2px 6px', borderRadius:4,
                  background: tone === 'sage' ? 'oklch(0.92 0.035 145)' : ErrPalette.amberBg,
                  color: tone === 'sage' ? 'oklch(0.42 0.06 145)' : ErrPalette.amberInk,
                }}>{st}</span>
              </div>
            ))}
          </div>

          <p style={{
            fontSize:12.5, color:'var(--ink-3)', margin:'14px 0 0', lineHeight:1.5,
          }}>
            Podés guardar ISW302 en tu lista para más adelante o ver materias que sí podés cursar este cuatrimestre.
          </p>
        </div>

        <div style={{
          padding:'12px 20px',
          borderTop:'1px solid var(--line)',
          background:'var(--bg-elev)',
          display:'flex', gap:8, justifyContent:'flex-end',
        }}>
          <button style={{
            padding:'8px 14px', borderRadius:8,
            border:'1px solid var(--line)',
            background:'var(--bg-card)', color:'var(--ink-2)',
            fontFamily:'inherit', fontSize:13, cursor:'pointer',
          }}>Cerrar</button>
          <button style={{
            padding:'8px 14px', borderRadius:8,
            border:'1px solid var(--line)',
            background:'var(--bg-card)', color:'var(--ink)',
            fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer',
          }}>Guardar para después</button>
          <button style={{
            padding:'8px 14px', borderRadius:8,
            border:'1px solid var(--accent)',
            background:'var(--accent)', color:'var(--accent-on)',
            fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer',
          }}>Ver materias disponibles</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6 · Reseña duplicada (al intentar reseñar algo ya reseñado)
// ════════════════════════════════════════════════════════════════
function V2ResenaDuplicada() {
  return (
    <V2Shell active="resenas">
      <div style={{padding:'24px 32px', maxWidth:760, margin:'0 auto'}}>

        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11,
          color:'var(--ink-3)', letterSpacing:'0.06em',
          textTransform:'uppercase', marginBottom:8,
        }}>Reseñas / Nueva reseña</div>
        <h1 style={{
          fontSize:24, fontWeight:600, margin:0, marginBottom:6,
          letterSpacing:'-0.01em',
        }}>Reseña de una cursada</h1>
        <p style={{fontSize:14, color:'var(--ink-2)', margin:'0 0 18px'}}>
          Calificás materia + docente + comisión + cuatrimestre en una sola reseña.
        </p>

        <V2InlineAlert
          tone="amber"
          icon="!"
          title="Ya reseñaste esta cursada"
          body={<>
            <b>ISW301 con Brandt · 2025·2c · Comisión A</b> ya está reseñada.
            Una persona, una reseña por cursada. Si querés sumar algo nuevo, editala.
          </>}
          actions={<>
            <button style={{
              padding:'6px 12px', borderRadius:6,
              border:`1px solid ${ErrPalette.amberLine}`,
              background:'transparent', color:ErrPalette.amberInk,
              fontFamily:'inherit', fontSize:12, cursor:'pointer', fontWeight:500,
            }}>Editar mi reseña existente</button>
            <button style={{
              padding:'6px 12px', borderRadius:6,
              border:'none', background:'transparent',
              color:ErrPalette.amberMuted, fontFamily:'inherit', fontSize:12,
              cursor:'pointer',
            }}>Reseñar otra cursada</button>
          </>}
        />

        {/* preview de la reseña existente, deshabilitada */}
        <div style={{
          marginTop:18,
          background:'var(--bg-card)',
          border:'1px solid var(--line)',
          borderRadius:12,
          padding:'18px 20px',
          opacity:0.78,
        }}>
          <div style={{
            display:'flex', alignItems:'center', gap:10, marginBottom:12,
          }}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:10.5,
              color:'var(--ink-3)', letterSpacing:'0.08em',
              textTransform:'uppercase',
            }}>Tu reseña existente</span>
            <span style={{color:'var(--ink-3)'}}>·</span>
            <span style={{fontSize:12, color:'var(--ink-3)'}}>publicada el 12 dic 2025</span>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:6,
          }}>
            <span style={{color:'var(--accent-ink)', letterSpacing:1}}>★★★★☆</span>
            <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)'}}>
              4.0 · dificultad 4/5 · 8 hs/sem
            </span>
          </div>
          <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>
            "Brandt explica clarísimo y se nota que le importa la materia. La cursada
            tiene mucha carga pero los TPs están bien diseñados. El final integrador
            es exigente pero justo si seguiste el ritmo."
          </p>
        </div>
      </div>
    </V2Shell>
  );
}

Object.assign(window, {
  V2InlineAlert, V2ErrorCard,
  V2Error404, V2Error5xx,
  V2OfflineBanner,
  V2ConflictoHorario,
  V2CorrelativaFaltante,
  V2ResenaDuplicada,
});
