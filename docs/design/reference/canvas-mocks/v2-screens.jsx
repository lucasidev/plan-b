// v2 — Pantallas principales: Inicio, Planificar, Mi carrera.
// Reseñas, Rankings, Ayuda, Sobre van en v2-screens-2.jsx.

const V2_DIFF_CLS = d => d>=4 ? 'diff-hi' : d===3 ? 'diff-mid' : 'diff-lo';

// Pill compacta de modalidad (color por tipo)
function V2Mod({ mod }) {
  const palette = {
    '1c': ['oklch(0.93 0.06 70)', 'oklch(0.45 0.12 60)'],
    '2c': ['oklch(0.93 0.05 250)', 'oklch(0.42 0.12 260)'],
    'anual': ['oklch(0.94 0.05 145)', 'oklch(0.42 0.09 145)'],
    'bim1': ['oklch(0.94 0.04 30)', 'oklch(0.45 0.13 30)'],
    'bim2': ['oklch(0.94 0.04 30)', 'oklch(0.45 0.13 30)'],
  };
  const [bg, fg] = palette[mod] || ['var(--line)', 'var(--ink-3)'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px', borderRadius:999,
      background:bg, color:fg,
      fontSize:10.5, fontWeight:500,
      fontFamily:'var(--font-mono)', letterSpacing:'0.02em',
    }}>{V2_MOD_LABEL[mod] || mod}</span>
  );
}

// Mini progress bar
function V2Progress({ value, max, tone = 'neutral' }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const color =
    tone === 'warm' ? 'var(--accent)' :
    tone === 'good' ? 'oklch(0.55 0.15 145)' :
    'var(--ink-2)';
  return (
    <div style={{
      height:5, background:'var(--line-2)', borderRadius:3, overflow:'hidden',
    }}>
      <div style={{height:'100%', width:`${pct*100}%`, background:color}}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1 · INICIO
// ════════════════════════════════════════════════════════════════
function V2Inicio() {
  const cursando = V2_ACTIVE.filter(s => s.week > 0);
  const futuras  = V2_ACTIVE.filter(s => s.week === 0);
  const weekPct  = V2_PERIOD.weekOfYear / V2_PERIOD.weeksInYear;

  return (
    <V2Shell active="inicio"
      pageEyebrow="Inicio"
      pageTitle={`Hola ${V2_USER.name.split(' ')[0]}.`}
      pageSub={`Vas por la semana ${V2_PERIOD.weekOfYear} del año. ${cursando.length} materias cursando, ${futuras.length} arrancan más adelante.`}
    >
      {/* PROGRESO DEL AÑO */}
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--line)',
        borderRadius:14, padding:'16px 20px', marginBottom:18,
        display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center',
      }}>
        <div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4,
          }}>Período {V2_PERIOD.year}</div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600,
            letterSpacing:'-0.02em', lineHeight:1, color:'var(--ink)',
          }}>
            sem {V2_PERIOD.weekOfYear}<span style={{color:'var(--ink-3)', fontSize:14}}>/{V2_PERIOD.weeksInYear}</span>
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <V2Progress value={V2_PERIOD.weekOfYear} max={V2_PERIOD.weeksInYear} tone="warm"/>
          <div style={{
            display:'flex', justifyContent:'space-between',
            fontSize:11, color:'var(--ink-3)', fontFamily:'var(--font-mono)',
            letterSpacing:'0.04em',
          }}>
            <span>mar 2026</span>
            <span>2c arranca · sem 17</span>
            <span>nov 2026</span>
          </div>
        </div>
        <button className="btn secondary" style={{padding:'8px 14px', fontSize:12.5}}>
          Editar período
        </button>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={{display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:16}}>
        {/* COLUMNA IZQ — materias en curso + futuras */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {/* En curso */}
          <div className="card">
            <div className="h2" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <span>En curso <small style={{color:'var(--ink-3)', fontWeight:400, marginLeft:6}}>{cursando.length} materias</small></span>
              <button className="btn ghost" style={{padding:'4px 8px', fontSize:11.5}}>Ver todas →</button>
            </div>
            <div style={{display:'flex', flexDirection:'column'}}>
              {cursando.map((s, i) => (
                <div key={s.code} style={{
                  display:'grid',
                  gridTemplateColumns:'1fr auto 100px',
                  gap:14, alignItems:'center',
                  padding:'12px 0',
                  borderTop: i ? '1px solid var(--line)' : 'none',
                }}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
                        letterSpacing:'0.04em',
                      }}>{s.code}</span>
                      <V2Mod mod={s.mod}/>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                      }}>com {s.com}</span>
                    </div>
                    <div style={{fontSize:14, color:'var(--ink)', fontWeight:500, lineHeight:1.3}}>
                      {s.name}
                    </div>
                    <div style={{
                      fontSize:11.5, color:'var(--ink-3)', marginTop:3,
                    }}>
                      {s.prof} · {s.next}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {s.note != null ? (
                      <div>
                        <div style={{
                          fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600,
                          color:'var(--ink)', letterSpacing:'-0.02em', lineHeight:1,
                        }}>{s.note}</div>
                        <div style={{fontSize:10, color:'var(--ink-3)', marginTop:2}}>nota parcial</div>
                      </div>
                    ) : (
                      <div style={{fontSize:11, color:'var(--ink-4)', fontStyle:'italic'}}>sin notas</div>
                    )}
                  </div>
                  <div>
                    <div style={{
                      fontSize:10, color:'var(--ink-3)',
                      fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                      display:'flex', justifyContent:'space-between', marginBottom:3,
                    }}>
                      <span>sem {s.week}/{s.weeks}</span>
                      <span>{Math.round(s.attendance*100)}%</span>
                    </div>
                    <V2Progress value={s.week} max={s.weeks} tone={s.week/s.weeks > 0.8 ? 'warm' : 'neutral'}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Para más adelante */}
          {futuras.length > 0 && (
            <div className="card">
              <div className="h2" style={{marginBottom:10}}>Más adelante</div>
              <div style={{display:'flex', flexDirection:'column'}}>
                {futuras.map((s, i) => (
                  <div key={s.code} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'9px 0',
                    borderTop: i ? '1px solid var(--line)' : 'none',
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
                      }}>{s.code}</span>
                      <V2Mod mod={s.mod}/>
                      <span style={{fontSize:13, color:'var(--ink-2)'}}>{s.name}</span>
                    </div>
                    <span style={{
                      fontSize:11.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)',
                    }}>{s.next}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DER — reseñar pendientes + planificar futuro */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {/* Reseñá lo que cursaste — módulo contextual */}
          <div className="card" style={{
            background:'linear-gradient(180deg, var(--accent-soft) 0%, var(--bg-card) 100%)',
            borderColor:'oklch(0.85 0.07 55)',
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--accent-ink)',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6,
            }}>Reseñá lo que cursaste</div>
            <div style={{
              fontSize:15, fontWeight:500, lineHeight:1.35, color:'var(--ink)',
              marginBottom:14,
            }}>
              {V2_TO_REVIEW.length} materias cerradas en 2025 esperando tu opinión.
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {V2_TO_REVIEW.map(m => (
                <div key={m.code} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'var(--bg-card)', border:'1px solid var(--line)',
                  borderRadius:8, padding:'9px 12px',
                }}>
                  <div style={{minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:2}}>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                      }}>{m.code}</span>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                      }}>· {m.closed}</span>
                    </div>
                    <div style={{fontSize:12.5, color:'var(--ink)', fontWeight:500, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                      {m.name}
                    </div>
                    <div style={{fontSize:10.5, color:'var(--ink-3)'}}>{m.prof} · nota {m.note}</div>
                  </div>
                  <button className="btn secondary" style={{padding:'5px 10px', fontSize:11.5, flexShrink:0, marginLeft:10}}>
                    Reseñar →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA secundario — planificar */}
          <div className="card">
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6,
            }}>Pensando en lo que viene</div>
            <div style={{fontSize:14, color:'var(--ink-2)', lineHeight:1.5, marginBottom:12}}>
              Armá un borrador de 2027 y comparalo con vos antes de inscribirte.
            </div>
            <button className="btn secondary" style={{padding:'8px 14px', fontSize:12.5, width:'100%', justifyContent:'center'}}>
              Planificar 2027 →
            </button>
          </div>

          {/* Notificaciones recientes */}
          <div className="card">
            <div className="h2" style={{marginBottom:10}}>Movimientos</div>
            <div style={{display:'flex', flexDirection:'column'}}>
              {[
                ['hace 2h',  'Brandt respondió a tu reseña de ISW301',   '·'],
                ['hace 1d',  'Nueva reseña en INT302 (4★)',              '·'],
                ['hace 3d',  'Iturralde subió la fecha del parcial',     '·'],
              ].map(([t, body], i) => (
                <div key={i} style={{
                  padding:'8px 0',
                  borderTop: i ? '1px solid var(--line)' : 'none',
                  display:'grid', gridTemplateColumns:'56px 1fr', gap:10,
                }}>
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
                    letterSpacing:'0.04em',
                  }}>{t}</span>
                  <span style={{fontSize:12.5, color:'var(--ink-2)', lineHeight:1.4}}>
                    {body}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · PLANIFICAR (tabs En curso / Borradores)
// ════════════════════════════════════════════════════════════════
function V2Planificar({ tab = 'curso' }) {
  return (
    <V2Shell active="planificar"
      pageEyebrow="Planificar"
      pageTitle="Tu período, ajustable."
      pageSub="Editá lo que estás cursando, o armá borradores del próximo. La modalidad la define la cátedra; vos elegís comisión y horario."
      pageRight={
        <>
          <button className="btn secondary" style={{padding:'7px 12px', fontSize:12.5}}>Comparar</button>
          <button className="btn" style={{padding:'7px 14px', fontSize:12.5}}>+ Nuevo borrador</button>
        </>
      }
    >
      <V2Tabs active={tab} items={[
        { id:'curso',     label:'En curso (2026)',  tag:'5' },
        { id:'borrador1', label:'Borrador 2027',    tag:'4' },
        { id:'borrador2', label:'2027 · alternativa' },
      ]}/>

      {tab === 'curso' ? <V2PlanificarEnCurso/> : <V2PlanificarBorrador/>}
    </V2Shell>
  );
}

function V2PlanificarEnCurso() {
  return (
    <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:16}}>
      {/* selección */}
      <div className="card">
        <div className="h2" style={{marginBottom:10, display:'flex', justifyContent:'space-between'}}>
          <span>Materias del año</span>
          <small style={{color:'var(--ink-3)', fontWeight:400}}>{V2_ACTIVE.length}</small>
        </div>
        {V2_ACTIVE.map((s, i) => (
          <div key={s.code} style={{
            padding:'11px 0',
            borderTop: i ? '1px solid var(--line)' : 'none',
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6}}>
              <div>
                <div style={{
                  fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                  letterSpacing:'0.04em', marginBottom:2,
                }}>{s.code}</div>
                <div style={{fontSize:13, color:'var(--ink)', fontWeight:500, lineHeight:1.3}}>{s.name}</div>
              </div>
              <button style={{
                appearance:'none', border:0, background:'transparent', cursor:'pointer',
                color:'var(--ink-4)', padding:2,
              }}>×</button>
            </div>
            <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
              <V2Mod mod={s.mod}/>
              <span className="mp code">com {s.com}</span>
              <span className={`mp ${V2_DIFF_CLS(s.diff)}`}>
                <span className="dot"/>dif {s.diff}
              </span>
            </div>
          </div>
        ))}
        <button className="btn ghost" style={{
          padding:'10px 0', marginTop:8, fontSize:12.5, width:'100%',
          justifyContent:'center', color:'var(--accent-ink)',
          border:'1px dashed var(--line)',
        }}>
          + Agregar materia
        </button>
      </div>

      {/* derecha: stats + calendario simplificado */}
      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {[
            ['25h', 'semanales', null],
            ['1', 'choque', 'warn'],
            ['3.8', 'dificultad', null],
            ['52%', 'aprob. esp.', null],
          ].map(([v, l, t]) => (
            <div key={l} className="card" style={{padding:'13px 15px'}}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600,
                letterSpacing:'-0.02em', lineHeight:1,
                color: t === 'warn' ? 'var(--accent-ink)' : 'var(--ink)',
              }}>{v}</div>
              <div style={{fontSize:11, color:'var(--ink-3)', marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="h2" style={{marginBottom:8, display:'flex', justifyContent:'space-between'}}>
            <span>Distribución semanal</span>
            <small style={{color:'var(--accent-ink)', fontWeight:500}}>⚠ MOV302 ↔ MAT401</small>
          </div>
          <V2MiniCalendar/>
        </div>

        <div className="card">
          <div style={{
            fontSize:12.5, color:'var(--ink-2)', lineHeight:1.55,
            display:'grid', gridTemplateColumns:'auto 1fr', gap:14, alignItems:'center',
          }}>
            <span style={{
              width:32, height:32, borderRadius:'50%',
              background:'var(--accent-soft)', color:'var(--accent-ink)',
              display:'grid', placeItems:'center',
              fontSize:14, fontWeight:600,
            }}>?</span>
            <div>
              <div style={{fontSize:13, color:'var(--ink)', fontWeight:500, marginBottom:2}}>
                ¿Aprobaste alguna materia libre o por examen?
              </div>
              Sacala del año para liberar el horario.{' '}
              <button className="linkbtn" style={{color:'var(--accent-ink)'}}>
                Marcar como aprobada
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function V2PlanificarBorrador() {
  return (
    <div>
      <div style={{
        background:'linear-gradient(90deg, var(--accent-soft) 0%, transparent 100%)',
        border:'1px solid oklch(0.85 0.07 55)',
        borderRadius:14, padding:'14px 18px', marginBottom:16,
        display:'flex', justifyContent:'space-between', alignItems:'center', gap:18,
      }}>
        <div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--accent-ink)',
            letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:3,
          }}>Borrador · 2027</div>
          <div style={{fontSize:14, color:'var(--ink)', lineHeight:1.45}}>
            Cuando se acerque la inscripción podés <b>activarlo</b> y se vuelve tu período en curso.
          </div>
        </div>
        <button className="btn accent" style={{padding:'8px 14px', fontSize:12.5}}>
          Empezar este período
        </button>
      </div>

      <V2PlanificarEnCurso/>
    </div>
  );
}

function V2MiniCalendar() {
  const days = ['Lun','Mar','Mié','Jue','Vie'];
  const blocks = [
    { day:0, h:14, dur:4, code:'INT302', mod:'1c', warn:false },
    { day:0, h:18, dur:4, code:'ISW302', mod:'1c', warn:false },
    { day:1, h:18, dur:4, code:'MAT401', mod:'an', warn:true },
    { day:1, h:19, dur:3, code:'MOV302', mod:'1c', warn:true },
    { day:2, h:18, dur:4, code:'ISW302', mod:'1c', warn:false },
    { day:3, h:19, dur:3, code:'SEG302', mod:'1c', warn:false },
    { day:4, h:14, dur:4, code:'INT302', mod:'1c', warn:false },
    { day:4, h:19, dur:3, code:'MOV302', mod:'1c', warn:false },
  ];
  const palette = {
    'ISW302': ['#fbe8e1', '#7a3922'],
    'INT302': ['#eef0e0', '#475020'],
    'MOV302': ['#e0eef4', '#1e4d6b'],
    'SEG302': ['#eee1f2', '#4a2c5a'],
    'MAT401': ['#f5edd9', '#6b4f1b'],
  };

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'40px repeat(5, 1fr)', gap:0,
      fontFamily:'var(--font-mono)', fontSize:10,
    }}>
      <div></div>
      {days.map(d => (
        <div key={d} style={{
          padding:'6px 8px', color:'var(--ink-3)',
          borderBottom:'1px solid var(--line)',
          textAlign:'center',
        }}>{d}</div>
      ))}
      {Array.from({length:9}, (_, i) => 13 + i).map((h, hi) => (
        <React.Fragment key={h}>
          <div style={{
            padding:'4px 8px', color:'var(--ink-4)',
            textAlign:'right', fontSize:9.5,
            borderTop: hi ? '1px dashed var(--line)' : 'none',
          }}>{h}:00</div>
          {days.map((_, di) => {
            const blk = blocks.find(b => b.day === di && b.h === h);
            return (
              <div key={di} style={{
                position:'relative', minHeight:24,
                borderTop: hi ? '1px dashed var(--line)' : 'none',
                borderLeft: di === 0 ? '1px solid var(--line)' : 'none',
                borderRight: '1px solid var(--line)',
              }}>
                {blk && (
                  <div style={{
                    position:'absolute', inset:'2px',
                    height: blk.dur * 24 - 4,
                    background: (palette[blk.code] || ['#eee','#444'])[0],
                    color: (palette[blk.code] || ['#eee','#444'])[1],
                    borderRadius:6, padding:'4px 6px',
                    fontWeight:600, fontSize:10,
                    outline: blk.warn ? '1.5px solid var(--accent-ink)' : 'none',
                    outlineOffset:-1.5, zIndex: blk.warn ? 2 : 1,
                  }}>{blk.code}</div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3 · MI CARRERA (tabs Plan / Grafo / Materias / Docentes)
// ════════════════════════════════════════════════════════════════
function V2MiCarrera({ tab = 'plan' }) {
  return (
    <V2Shell active="carrera"
      pageEyebrow="Mi carrera"
      pageTitle={`${V2_USER.career} · UNSTA`}
      pageSub={`${Math.round(V2_USER.progress*100)}% del plan completado · 18 aprobadas · 5 cursando · 14 pendientes`}
      pageRight={<button className="btn secondary" style={{padding:'7px 12px', fontSize:12.5}}>Exportar plan</button>}
    >
      <V2Tabs active={tab} items={[
        { id:'plan',      label:'Plan de estudios' },
        { id:'grafo',     label:'Correlativas' },
        { id:'materias',  label:'Catálogo' },
        { id:'docentes',  label:'Docentes' },
        { id:'historial', label:'Historial' },
      ]}/>

      {tab === 'plan' && <V2CarreraPlan/>}
      {tab === 'grafo' && <V2CarreraGrafo/>}
      {tab === 'materias' && <V2CarreraCatalogo/>}
      {tab === 'docentes' && <V2CarreraDocentes/>}
      {tab === 'historial' && <V2CarreraHistorial/>}
    </V2Shell>
  );
}

function V2CarreraPlan() {
  // Plan en grilla por año, con estado y modalidad. Modalidad como SOURCE OF TRUTH.
  const plan = [
    { year:1, items:[
      ['MAT101','Análisis Matemático I',  'anual', 'AP', 9],
      ['ALG101','Álgebra y Geometría',    'anual', 'AP', 8],
      ['PRG101','Programación I',          '1c',   'AP', 9],
      ['PRG102','Programación II',         '2c',   'AP', 8],
      ['SOC101','Inglés Técnico',          '1c',   'AP', 8],
      ['SOC102','Sistemas y Organizaciones','2c',  'AP', 7],
    ]},
    { year:2, items:[
      ['MAT201','Análisis II',             'anual', 'AP', 7],
      ['MAT202','Probabilidad y Estad.',   '2c',    'AP', 8],
      ['PRG201','Estructuras de Datos',    '1c',    'AP', 9],
      ['BD201', 'Bases de Datos I',        '2c',    'AP', 8],
      ['SO201', 'Sistemas Operativos',     '1c',    'AP', 7],
      ['HW201', 'Arquitectura de Comp.',   '2c',    'AP', 6],
    ]},
    { year:3, items:[
      ['ISW301','Ingeniería de SW I',      '1c',    'AP', 8],
      ['BD301', 'Bases de Datos II',       '2c',    'AP', 7],
      ['COM301','Comunicación de Datos',   '2c',    'AP', 6],
      ['ECO301','Economía',                '1c',    'AP', 7],
      ['DER301','Derecho Informático',     '2c',    'PD', null],
      ['LEG301','Legislación',             '1c',    'PD', null],
    ]},
    { year:4, items:[
      ['ISW302','Ingeniería de SW II',     '1c',    'CU', null],
      ['INT302','Inteligencia Artificial', '1c',    'CU', null],
      ['SEG302','Seguridad Informática',   '1c',    'CU', null],
      ['QUI201','Química General',         '2c',    'CU', null],
      ['MAT401','Matemática Aplicada',     'anual', 'CU', null],
      ['MOV302','Apps Móviles',            '2c',    'PD', null],
    ]},
    { year:5, items:[
      ['PFC501','Proyecto Final',          'anual', 'PD', null],
      ['ETI501','Ética Profesional',       '1c',    'PD', null],
      ['GES501','Gestión de Proyectos',    '2c',    'PD', null],
      ['EMP501','Emprendedorismo',         '1c',    'PD', null],
    ]},
  ];

  const stateCfg = {
    AP: ['Aprobada', 'oklch(0.94 0.05 145)', 'oklch(0.42 0.09 145)'],
    CU: ['Cursando', 'oklch(0.93 0.06 70)',  'oklch(0.45 0.12 60)'],
    PD: ['Pendiente','transparent',          'var(--ink-3)'],
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:16}}>
      {/* leyenda */}
      <div style={{
        display:'flex', gap:18, alignItems:'center',
        padding:'10px 16px', background:'var(--bg-card)',
        border:'1px solid var(--line)', borderRadius:10,
        fontSize:12, color:'var(--ink-3)', flexWrap:'wrap',
      }}>
        <span style={{fontFamily:'var(--font-mono)', fontSize:10.5, letterSpacing:'0.08em', textTransform:'uppercase'}}>
          Leyenda
        </span>
        {Object.entries(stateCfg).map(([k, [label, bg, fg]]) => (
          <span key={k} style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <span style={{
              width:14, height:14, borderRadius:3,
              background:bg, border: bg === 'transparent' ? '1px dashed var(--line-2)' : 'none',
            }}/>
            <span style={{color:'var(--ink-2)'}}>{label}</span>
          </span>
        ))}
        <span style={{flex:1}}/>
        <span style={{fontSize:11.5}}>
          Modalidad de cada materia definida por la cátedra (anual / cuatrimestral)
        </span>
      </div>

      {plan.map(({year, items}) => (
        <div key={year} className="card">
          <div className="h2" style={{
            marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'baseline',
          }}>
            <span>{year}° año <small style={{color:'var(--ink-3)', fontWeight:400, marginLeft:6}}>{items.length} materias</small></span>
            <small style={{color:'var(--ink-3)'}}>
              {items.filter(i=>i[3]==='AP').length} aprobadas · {items.filter(i=>i[3]==='CU').length} cursando
            </small>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
            {items.map(([code, name, mod, st, note]) => {
              const [label, bg, fg] = stateCfg[st];
              return (
                <div key={code} style={{
                  padding:'10px 12px',
                  background: st === 'AP' ? bg : st === 'CU' ? bg : 'var(--bg-card)',
                  border:`1px solid ${st === 'PD' ? 'var(--line)' : 'transparent'}`,
                  borderRadius:8, color: st === 'PD' ? 'var(--ink-3)' : fg,
                  display:'flex', flexDirection:'column', gap:4,
                  opacity: st === 'PD' ? 0.7 : 1,
                }}>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.04em',
                  }}>
                    <span>{code}</span>
                    <V2Mod mod={mod}/>
                  </div>
                  <div style={{
                    fontSize:13, fontWeight:500, lineHeight:1.3,
                    color: st === 'PD' ? 'var(--ink-3)' : 'var(--ink)',
                  }}>{name}</div>
                  {note != null && (
                    <div style={{
                      fontFamily:'var(--font-mono)', fontSize:10.5, color:fg,
                      letterSpacing:'0.04em',
                    }}>nota {note}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function V2CarreraGrafo() {
  return (
    <div className="card" style={{minHeight:380, display:'grid', placeItems:'center', color:'var(--ink-3)', textAlign:'center'}}>
      <div>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
          letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8,
        }}>placeholder</div>
        <div style={{fontSize:15, color:'var(--ink-2)'}}>
          Grafo interactivo de correlativas — reuso del componente del v1.
        </div>
      </div>
    </div>
  );
}

function V2CarreraCatalogo() {
  const items = V2_ACTIVE.concat(V2_TO_REVIEW.map(r => ({...r, mod:'1c', com:'-', diff:3})));
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
      {items.map(s => (
        <div key={s.code} className="card" style={{padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            }}>{s.code}</span>
            {s.mod && <V2Mod mod={s.mod}/>}
            <span style={{flex:1}}/>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color:'var(--ink)',
            }}>4.2 ★</span>
          </div>
          <div style={{fontSize:14.5, fontWeight:500, color:'var(--ink)', lineHeight:1.3, marginBottom:4}}>
            {s.name}
          </div>
          <div style={{fontSize:12, color:'var(--ink-3)'}}>
            {s.prof} · 24 reseñas · dif {s.diff}/5
          </div>
        </div>
      ))}
    </div>
  );
}

function V2CarreraDocentes() {
  const docs = [
    ['Federico Brandt','ISW I, ISW II', 4.1, 87],
    ['Mario Iturralde','IA I, Probabilidad', 3.4, 124],
    ['Diego Castro','Móviles, Web', 4.4, 56],
    ['Andrea Sosa','Seguridad, Comunicación', 4.0, 92],
    ['Luis Reynoso','Mat. Aplicada', 3.8, 38],
    ['Marcela Castellanos','Bases de Datos', 4.3, 71],
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
      {docs.map(([n, mat, r, c]) => (
        <div key={n} className="card" style={{padding:'14px 16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
            <div>
              <div style={{fontSize:14, fontWeight:500, color:'var(--ink)'}}>{n}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:2}}>{mat}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600, color:'var(--ink)',
                letterSpacing:'-0.02em', lineHeight:1,
              }}>{r}</div>
              <div style={{fontSize:10, color:'var(--ink-3)', marginTop:2}}>/5 · {c} reseñas</div>
            </div>
          </div>
          <V2Progress value={r} max={5} tone={r >= 4 ? 'good' : 'neutral'}/>
        </div>
      ))}
    </div>
  );
}

window.V2Inicio = V2Inicio;
window.V2Planificar = V2Planificar;
window.V2MiCarrera = V2MiCarrera;
window.V2Mod = V2Mod;
window.V2Progress = V2Progress;
