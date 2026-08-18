// v2 — Reseñas, Rankings, Ayuda, Sobre.

// ════════════════════════════════════════════════════════════════
// 4 · RESEÑAS (tabs Leer / Escribir / Mis reseñas)
// ════════════════════════════════════════════════════════════════
function V2Resenas({ tab = 'leer' }) {
  return (
    <V2Shell active="resenas"
      pageEyebrow="Reseñas"
      pageTitle="Lo que cuentan los que ya cursaron."
      pageSub="Reseñas anónimas, validadas con tu estado académico. Aportá lo tuyo cuando cierres una materia."
      pageRight={<button className="btn accent" style={{padding:'7px 14px', fontSize:12.5}}>+ Nueva reseña</button>}
    >
      <V2Tabs active={tab} items={[
        { id:'leer',     label:'Explorar' },
        { id:'escribir', label:'Pendientes', tag:'3' },
        { id:'mias',     label:'Mis reseñas', tag:'7' },
      ]}/>

      {tab === 'leer'     && <V2ResenasLeer/>}
      {tab === 'escribir' && <V2ResenasEscribir/>}
      {tab === 'mias'     && <V2ResenasMias/>}
    </V2Shell>
  );
}

function V2ResenasLeer() {
  const reviews = [
    { mat:'Ingeniería de Software II', code:'ISW302', prof:'Brandt', rating:4.5, year:'2025·1c',
      title:'TPs largos pero útiles', body:'Las consignas reflejan situaciones reales. Brandt corrige con criterio. Estudien Git desde el día 1.',
      diff:4, util:5, votes:34 },
    { mat:'Inteligencia Artificial I', code:'INT302', prof:'Iturralde', rating:2.5, year:'2025·1c',
      title:'Material desactualizado', body:'El programa habla de redes neuronales como novedad. Si buscás algo moderno, complementá con cursos online.',
      diff:5, util:2, votes:48 },
    { mat:'Bases de Datos II', code:'BD301', prof:'Castellanos', rating:4.0, year:'2025·2c',
      title:'Difícil pero justa', body:'Castellanos exige pero te explica todo si vas a consulta. Los TPs son la mitad de la nota final.',
      diff:4, util:5, votes:22 },
    { mat:'Apps Móviles', code:'MOV302', prof:'Castro', rating:5.0, year:'2025·2c',
      title:'La mejor del año', body:'Hicimos una app de punta a punta. Castro está al día con Flutter y SwiftUI. Recomendadísima.',
      diff:3, util:5, votes:67 },
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:18}}>
      {/* filtros */}
      <aside style={{display:'flex', flexDirection:'column', gap:14, fontSize:12.5}}>
        {[
          ['Año', ['Todos','5°','4°','3°','2°','1°']],
          ['Modalidad', ['Todas','Anual','Cuatri 1','Cuatri 2']],
          ['Calificación', ['Todas','4★+','3★+','Bajas']],
        ].map(([title, opts]) => (
          <div key={title}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8,
            }}>{title}</div>
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              {opts.map((o, i) => (
                <button key={o} style={{
                  appearance:'none', border:0, background: i===0 ? 'var(--bg-card)' : 'transparent',
                  boxShadow: i===0 ? 'var(--shadow-card)' : 'none',
                  color: i===0 ? 'var(--ink)' : 'var(--ink-2)',
                  textAlign:'left', padding:'5px 10px', borderRadius:6,
                  fontSize:12.5, cursor:'pointer', fontFamily:'inherit',
                }}>{o}</button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* lista */}
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {reviews.map((r, i) => (
          <article key={i} className="card" style={{padding:'16px 18px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)'}}>{r.code}</span>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)'}}>· {r.year}</span>
                </div>
                <div style={{fontSize:14.5, fontWeight:500, color:'var(--ink)'}}>{r.mat}</div>
                <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{r.prof}</div>
              </div>
              <div style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'4px 10px', background:'var(--bg-elev)', borderRadius:6,
              }}>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600,
                  color: r.rating >= 4 ? 'oklch(0.55 0.15 145)' : r.rating >= 3 ? 'var(--ink)' : 'var(--accent-ink)',
                }}>{r.rating.toFixed(1)}</span>
                <span style={{fontSize:11, color:'var(--ink-3)'}}>★</span>
              </div>
            </div>
            <div style={{fontSize:13.5, fontWeight:500, color:'var(--ink)', marginBottom:5}}>"{r.title}"</div>
            <div style={{fontSize:13, color:'var(--ink-2)', lineHeight:1.5, marginBottom:12}}>{r.body}</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:14}}>
              <div style={{display:'flex', gap:14, fontSize:11.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>
                <span>dif {r.diff}/5</span>
                <span>útil {r.util}/5</span>
                <span>{r.votes} votos</span>
              </div>
              <div style={{display:'flex', gap:6}}>
                <button className="btn ghost" style={{padding:'4px 10px', fontSize:11.5}}>👍 Útil</button>
                <button className="btn ghost" style={{padding:'4px 10px', fontSize:11.5}}>Reportar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function V2ResenasEscribir() {
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:18}}>
      <div className="card" style={{padding:'20px 22px'}}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
          letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6,
        }}>Reseñando · ISW301 · 2025·2c</div>
        <h2 style={{fontSize:20, fontWeight:600, margin:'0 0 4px', letterSpacing:'-0.02em'}}>Ingeniería de Software I</h2>
        <p style={{fontSize:13, color:'var(--ink-3)', margin:'0 0 22px'}}>Federico Brandt · nota final 8</p>

        {/* sliders calif */}
        <div style={{display:'flex', flexDirection:'column', gap:14, marginBottom:24}}>
          {[
            ['Recomendación general', 4],
            ['Dificultad', 4],
            ['Material y consignas', 5],
            ['Calidad docente', 4],
          ].map(([label, val]) => (
            <div key={label} style={{display:'grid', gridTemplateColumns:'180px 1fr 32px', gap:14, alignItems:'center'}}>
              <span style={{fontSize:13, color:'var(--ink-2)'}}>{label}</span>
              <div style={{display:'flex', gap:4}}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} style={{
                    flex:1, height:28, borderRadius:5,
                    background: n <= val ? 'var(--accent-soft)' : 'var(--line-2)',
                    border:`1px solid ${n <= val ? 'var(--accent)' : 'var(--line)'}`,
                    fontFamily:'var(--font-mono)', fontSize:11,
                    color: n <= val ? 'var(--accent-ink)' : 'var(--ink-3)',
                    cursor:'pointer',
                  }}>{n}</button>
                ))}
              </div>
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:13, color:'var(--ink)', textAlign:'right',
              }}>{val}/5</span>
            </div>
          ))}
        </div>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:12, color:'var(--ink-3)', marginBottom:6}}>Título de la reseña</div>
          <input value="TPs largos pero útiles" readOnly style={{
            width:'100%', padding:'9px 12px',
            border:'1px solid var(--line)', borderRadius:8,
            fontSize:13.5, fontFamily:'inherit', background:'var(--bg-card)',
            color:'var(--ink)',
          }}/>
        </div>

        <div style={{marginBottom:18}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
            <span style={{fontSize:12, color:'var(--ink-3)'}}>Tu experiencia</span>
            <span style={{fontSize:11, color:'var(--ink-4)', fontFamily:'var(--font-mono)'}}>312 / 1000</span>
          </div>
          <textarea readOnly style={{
            width:'100%', minHeight:120, padding:'10px 12px',
            border:'1px solid var(--line)', borderRadius:8,
            fontSize:13, fontFamily:'inherit', resize:'vertical',
            lineHeight:1.5, color:'var(--ink-2)', background:'var(--bg-card)',
          }} value="Las consignas reflejan situaciones reales que vas a encontrar trabajando. Brandt corrige con criterio y da feedback útil. Recomiendo arrancar con Git desde el día 1, los TPs son grupales y se complica si no manejás bien el versionado."/>
        </div>

        <div style={{marginBottom:22}}>
          <div style={{fontSize:12, color:'var(--ink-3)', marginBottom:8}}>Etiquetas (opcional)</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {['#tps-grupales','#git','#feedback-útil','#carga-pesada','#asistencia-clave'].map(t => (
              <span key={t} style={{
                padding:'4px 10px', background:'var(--bg-elev)',
                border:'1px solid var(--line)', borderRadius:999,
                fontSize:11.5, color:'var(--ink-2)', fontFamily:'var(--font-mono)',
              }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button className="btn ghost" style={{padding:'8px 14px', fontSize:12.5}}>Guardar borrador</button>
          <button className="btn accent" style={{padding:'8px 18px', fontSize:12.5}}>Publicar reseña</button>
        </div>
      </div>

      {/* sidebar pendientes */}
      <aside style={{display:'flex', flexDirection:'column', gap:14}}>
        <div className="card">
          <div className="h2" style={{marginBottom:10}}>Pendientes</div>
          <div style={{display:'flex', flexDirection:'column', gap:1}}>
            {V2_TO_REVIEW.map((m, i) => (
              <div key={m.code} style={{
                padding:'10px 0',
                borderTop: i ? '1px solid var(--line)' : 'none',
                cursor:'pointer',
                background: i === 0 ? 'transparent' : 'transparent',
              }}>
                <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:3}}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)'}}>{m.code}</span>
                  {i === 0 && <span style={{
                    fontSize:9.5, padding:'1px 6px', borderRadius:3,
                    background:'var(--accent-soft)', color:'var(--accent-ink)',
                    fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                  }}>EDITANDO</span>}
                </div>
                <div style={{fontSize:13, color:'var(--ink)', fontWeight:500}}>{m.name}</div>
                <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>{m.prof}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{background:'var(--bg-elev)'}}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6,
          }}>Reseñás de manera anónima.</div>
          <div style={{fontSize:12, color:'var(--ink-2)', lineHeight:1.5}}>
            Los docentes ven solo agregados (rating promedio, tags más usados). Tu nombre nunca aparece.
          </div>
        </div>
      </aside>
    </div>
  );
}

function V2ResenasMias() {
  const mine = [
    { code:'PRG201', mat:'Estructuras de Datos', year:'2024·1c', rating:5, votes:42, status:'pub' },
    { code:'BD201',  mat:'Bases de Datos I',     year:'2024·2c', rating:4, votes:18, status:'pub' },
    { code:'SO201',  mat:'Sistemas Operativos',  year:'2024·1c', rating:3, votes:8,  status:'pub' },
    { code:'ECO301', mat:'Economía',             year:'2025·1c', rating:4, votes:0,  status:'draft' },
  ];
  return (
    <div className="card" style={{padding:0}}>
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 100px 80px 80px 100px',
        padding:'10px 18px', borderBottom:'1px solid var(--line)',
        fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
        letterSpacing:'0.08em', textTransform:'uppercase',
      }}>
        <span>Materia</span><span>Año</span><span>Rating</span><span>Útiles</span><span></span>
      </div>
      {mine.map((m, i) => (
        <div key={m.code} style={{
          display:'grid', gridTemplateColumns:'1fr 100px 80px 80px 100px',
          padding:'14px 18px', alignItems:'center',
          borderTop: i ? '1px solid var(--line)' : 'none',
        }}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)'}}>{m.code}</span>
              {m.status === 'draft' && <span style={{
                fontSize:9.5, padding:'1px 6px', borderRadius:3,
                background:'var(--line)', color:'var(--ink-3)',
                fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
              }}>BORRADOR</span>}
            </div>
            <div style={{fontSize:13.5, fontWeight:500, color:'var(--ink)', marginTop:2}}>{m.mat}</div>
          </div>
          <span style={{fontSize:12, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>{m.year}</span>
          <span style={{fontSize:13, color:'var(--ink)', fontFamily:'var(--font-mono)'}}>{m.rating} ★</span>
          <span style={{fontSize:13, color:'var(--ink-2)', fontFamily:'var(--font-mono)'}}>{m.votes}</span>
          <button className="btn ghost" style={{padding:'4px 10px', fontSize:11.5, justifySelf:'end'}}>Editar</button>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5 · RANKINGS
// ════════════════════════════════════════════════════════════════
function V2Rankings() {
  return (
    <V2Shell active="rankings"
      pageEyebrow="Rankings"
      pageTitle="Quién la rompe este año."
      pageSub="Top docentes, materias y comisiones según las reseñas de la comunidad. Filtrá por carrera y año."
      pageRight={
        <select style={{
          padding:'7px 12px', border:'1px solid var(--line)', borderRadius:8,
          background:'var(--bg-card)', fontSize:12.5, fontFamily:'inherit', color:'var(--ink-2)',
        }}>
          <option>Ing. en Sistemas · 2025</option>
          <option>Toda la facultad · 2025</option>
        </select>
      }
    >
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
        <V2RankCard
          title="Mejores docentes"
          items={[
            ['Diego Castro','Móviles · Web', 4.8, 142],
            ['Marcela Castellanos','BD I, BD II', 4.6, 188],
            ['Ana Pérez','Programación I', 4.5, 211],
            ['Federico Brandt','ISW I, ISW II', 4.1, 87],
            ['Luis Reynoso','Mat. Aplicada', 3.8, 38],
          ]}
        />
        <V2RankCard
          title="Materias mejor valoradas"
          items={[
            ['Apps Móviles','MOV302', 4.7, 67],
            ['Estructuras de Datos','PRG201', 4.4, 124],
            ['Programación I','PRG101', 4.3, 213],
            ['Ingeniería de SW II','ISW302', 4.1, 34],
            ['Inteligencia Artif. I','INT302', 2.9, 48],
          ]}
        />
        <V2RankCard
          title="Comisiones recomendadas"
          items={[
            ['ISW302 · Brandt A','Lun-Mié 18hs', 4.5, 18],
            ['INT302 · Iturralde A','Lun-Vie 14hs', 3.1, 24],
            ['SEG302 · Sosa B','Jue 19hs', 4.2, 11],
            ['MAT401 · Reynoso A','Mar 18hs', 3.8, 22],
            ['QUI201 · Méndez A','sin reseñas aún', null, 0],
          ]}
        />
      </div>

      {/* sub-ranking: mejores combinaciones */}
      <div className="card" style={{marginTop:16}}>
        <div className="h2" style={{marginBottom:14, display:'flex', justifyContent:'space-between'}}>
          <span>Combinaciones más cursadas en 4° año</span>
          <small style={{color:'var(--ink-3)', fontWeight:400}}>basado en planes activos · 2026</small>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:1}}>
          {[
            ['ISW302 + INT302 + SEG302', 'Carga alta, todas en 1c', '47 alumnos', 0.62],
            ['ISW302 + MAT401 + MOV302', 'Equilibrada, año mixto',   '38 alumnos', 0.51],
            ['INT302 + QUI201 + SEG302', 'Suave en 1c, fuerte en 2c','21 alumnos', 0.28],
          ].map(([combo, desc, n, share], i) => (
            <div key={combo} style={{
              display:'grid', gridTemplateColumns:'30px 1fr 100px 200px',
              alignItems:'center', gap:14, padding:'12px 0',
              borderTop: i ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{
                fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600,
                color:'var(--ink-3)', letterSpacing:'-0.02em',
              }}>#{i+1}</span>
              <div>
                <div style={{fontSize:13.5, fontWeight:500, color:'var(--ink)'}}>{combo}</div>
                <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{desc}</div>
              </div>
              <span style={{fontSize:12, color:'var(--ink-2)', fontFamily:'var(--font-mono)'}}>{n}</span>
              <div>
                <V2Progress value={share} max={1} tone="warm"/>
                <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:3, textAlign:'right'}}>
                  {Math.round(share*100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </V2Shell>
  );
}

function V2RankCard({ title, items }) {
  return (
    <div className="card">
      <div className="h2" style={{marginBottom:12}}>{title}</div>
      <div style={{display:'flex', flexDirection:'column'}}>
        {items.map(([name, sub, rating, count], i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'24px 1fr auto',
            gap:10, padding:'10px 0', alignItems:'center',
            borderTop: i ? '1px solid var(--line)' : 'none',
          }}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
              color: i < 3 ? 'var(--accent-ink)' : 'var(--ink-4)',
            }}>{i+1}</span>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13, fontWeight:500, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{name}</div>
              <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>{sub}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
                color: rating == null ? 'var(--ink-4)' : rating >= 4 ? 'oklch(0.55 0.15 145)' : rating >= 3 ? 'var(--ink)' : 'var(--accent-ink)',
              }}>{rating == null ? '—' : `${rating} ★`}</div>
              <div style={{fontSize:10, color:'var(--ink-3)', marginTop:1}}>{count} reseñas</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6 · AYUDA
// ════════════════════════════════════════════════════════════════
function V2Ayuda() {
  return (
    <V2Shell active="ayuda"
      pageEyebrow="Ayuda"
      pageTitle="¿Cómo te ayudamos?"
      pageSub="Tutoriales rápidos, atajos y un canal directo si te trabaste."
    >
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16}}>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {[
            ['Cómo funciona el período', '"Período" es tu año lectivo. La modalidad de cada materia (anual, cuatrimestral, bimestral) la define la cátedra y plan-b la hereda.'],
            ['Cómo armar un borrador', 'En Planificar > + Nuevo borrador. Mové materias, comparalo con tu borrador anterior, activalo cuando llegue la inscripción.'],
            ['Cómo se calcula la dificultad', 'Promedio ponderado de las reseñas del último año, con peso doble para reseñas de alumnos que aprobaron.'],
            ['Por qué tus reseñas son anónimas', 'Validamos que estés cursando o hayas aprobado, pero los docentes solo ven agregados, nunca tu identidad.'],
            ['Atajos del teclado', '⌘K búsqueda · ⌘N nueva reseña · G+I inicio · G+P planificar · G+R reseñas'],
          ].map(([q, a]) => (
            <details key={q} className="card" style={{padding:0}}>
              <summary style={{
                padding:'14px 18px', cursor:'pointer',
                fontSize:14, fontWeight:500, color:'var(--ink)',
                listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <span>{q}</span>
                <span style={{color:'var(--ink-3)', fontSize:18}}>+</span>
              </summary>
              <div style={{padding:'0 18px 16px', fontSize:13, color:'var(--ink-2)', lineHeight:1.55}}>
                {a}
              </div>
            </details>
          ))}
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:12}}>
          <div className="card" style={{
            background:'linear-gradient(180deg, var(--accent-soft) 0%, var(--bg-card) 100%)',
            borderColor:'oklch(0.85 0.07 55)',
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--accent-ink)',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6,
            }}>Hablá con nosotros</div>
            <div style={{fontSize:14, color:'var(--ink)', lineHeight:1.5, marginBottom:14}}>
              ¿Algo no cierra o ves un dato mal? Lo respondemos en menos de 24h.
            </div>
            <button className="btn accent" style={{padding:'8px 14px', fontSize:12.5, width:'100%', justifyContent:'center'}}>
              Abrir chat de soporte
            </button>
            <div style={{
              marginTop:10, fontSize:11.5, color:'var(--ink-3)',
              fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
            }}>o escribinos a hola@plan-b.app</div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:10}}>Recursos</div>
            <div style={{display:'flex', flexDirection:'column'}}>
              {[
                ['Guía rápida (PDF, 4 páginas)', '↗'],
                ['Política de moderación', '↗'],
                ['Términos y privacidad',   '↗'],
                ['Estado del servicio',     '✓'],
              ].map(([l, ico], i) => (
                <a key={l} href="#" style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0', borderTop: i ? '1px solid var(--line)' : 'none',
                  fontSize:13, color:'var(--ink-2)', textDecoration:'none',
                }}>
                  <span>{l}</span>
                  <span style={{color:'var(--ink-3)'}}>{ico}</span>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 7 · SOBRE PLAN-B
// ════════════════════════════════════════════════════════════════
function V2Sobre() {
  return (
    <V2Shell active="sobre"
      pageEyebrow="Sobre plan-b"
      pageTitle="Estamos haciendo la app que nos hubiera gustado tener."
      pageSub="plan-b es una herramienta de planificación académica hecha por estudiantes, para estudiantes."
    >
      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:18}}>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'24px 28px'}}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8,
            }}>Manifiesto</div>
            <p style={{fontSize:15.5, color:'var(--ink)', lineHeight:1.55, margin:'0 0 14px', textWrap:'pretty'}}>
              La universidad te da un PDF con materias y una fecha de inscripción.
              Lo que pasa entre medio — qué cursar, con quién, en qué orden, cuántas
              juntas se aguantan — lo resolvés solo o preguntando en grupos de WhatsApp.
            </p>
            <p style={{fontSize:14.5, color:'var(--ink-2)', lineHeight:1.6, margin:'0 0 14px', textWrap:'pretty'}}>
              plan-b junta esa info en un lugar. Tu plan, las reseñas reales de
              quienes ya cursaron, los choques de horario, los docentes que recomiendan
              tus compañeros. Para que decidir tu próximo cuatrimestre deje de ser una
              apuesta.
            </p>
            <p style={{fontSize:13.5, color:'var(--ink-3)', lineHeight:1.6, margin:0, fontStyle:'italic'}}>
              No estamos afiliados oficialmente a ninguna universidad. Es una herramienta independiente, hecha
              por alumnos en sus ratos libres. Cada facu que sumamos la cargamos nosotros.
            </p>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:14}}>Lo que viene</div>
            <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'14px 18px', fontSize:13.5}}>
              {[
                ['ahora',         'Reseñas validadas, planificador con detección de choques, rankings.'],
                ['próximo mes',   'Importación automática del SIU. Comparador de comisiones lado a lado.'],
                ['más adelante',  'Recomendaciones personalizadas según tu plan y desempeño. App móvil.'],
                ['sueños',        'Otras carreras, otras universidades. Comunidad de exalumnos.'],
              ].map(([when, what]) => (
                <React.Fragment key={when}>
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
                    letterSpacing:'0.04em', textTransform:'uppercase', paddingTop:2,
                  }}>{when}</span>
                  <span style={{color:'var(--ink-2)', lineHeight:1.5}}>{what}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:12}}>
          <div className="card">
            <div className="h2" style={{marginBottom:12}}>Equipo</div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {[
                ['JM', 'Juan Manuel R.', 'Ing. en Sistemas · 5° año'],
                ['SC', 'Sofía C.',       'Ing. en Sistemas · 4° año'],
                ['MV', 'Matías V.',      'Diseño · 3° año'],
              ].map(([init, name, role]) => (
                <div key={name} style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    background:'var(--accent-soft)', color:'var(--accent-ink)',
                    display:'grid', placeItems:'center',
                    fontWeight:600, fontSize:12,
                  }}>{init}</div>
                  <div style={{lineHeight:1.3, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:500, color:'var(--ink)'}}>{name}</div>
                    <div style={{fontSize:11, color:'var(--ink-3)'}}>{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:12}}>Números</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
              {[
                ['1.247', 'alumnos'],
                ['3.812', 'reseñas'],
                ['87',    'docentes'],
                ['v0.2',  'versión'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{
                    fontFamily:'var(--font-mono)', fontSize:20, fontWeight:600,
                    letterSpacing:'-0.02em', color:'var(--ink)', lineHeight:1,
                  }}>{n}</div>
                  <div style={{fontSize:11, color:'var(--ink-3)', marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{textAlign:'center', padding:'18px 16px'}}>
            <div style={{fontSize:12, color:'var(--ink-3)', marginBottom:10}}>
              <V2Logo/> es código abierto.
            </div>
            <a href="#" style={{fontSize:12.5, color:'var(--accent-ink)', textDecoration:'none', fontWeight:500}}>
              github.com/plan-b →
            </a>
          </div>
        </aside>
      </div>
    </V2Shell>
  );
}

// ════════════════════════════════════════════════════════════════
// 8 · AJUSTES (config de app)
// ════════════════════════════════════════════════════════════════
function V2Ajustes() {
  return (
    <V2Shell active="ajustes"
      pageEyebrow="Ajustes"
      pageTitle="Cómo se comporta plan-b."
      pageSub="Notificaciones, privacidad, apariencia. Tus datos personales viven en Mi perfil."
    >
      <div style={{display:'flex', flexDirection:'column', gap:14, maxWidth:720}}>
        <div className="card">
          <div className="h2" style={{marginBottom:14}}>Notificaciones</div>
          {[
            ['Apertura de inscripción del próximo período', true],
            ['Reseñas nuevas en materias que estás cursando', true],
            ['Cuando un docente responde tu reseña', true],
            ['Resumen semanal de movimientos', false],
            ['Newsletter de plan-b (1 por mes)', false],
          ].map(([l, on], i) => (
            <V2Toggle key={l} label={l} on={on} first={i === 0}/>
          ))}
        </div>

        <div className="card">
          <div className="h2" style={{marginBottom:14}}>Privacidad</div>
          {[
            ['Mostrar tu progreso a docentes', false, 'Solo agregados anónimos'],
            ['Permitir que tus reseñas se citen', true, 'Sin tu nombre'],
            ['Aparecer en rankings de la facultad', true, null],
          ].map(([l, on, sub], i) => (
            <V2Toggle key={l} label={l} on={on} sub={sub} first={i === 0}/>
          ))}
        </div>

        <div className="card">
          <div className="h2" style={{marginBottom:14}}>Apariencia</div>
          <V2Row k="Tema" v={
            <div style={{display:'flex', gap:6}}>
              {['Claro','Oscuro','Auto'].map((t, i) => (
                <button key={t} style={{
                  appearance:'none', border:'1px solid var(--line)',
                  background: i === 0 ? 'var(--bg-elev)' : 'var(--bg-card)',
                  padding:'5px 12px', borderRadius:6, fontSize:12,
                  fontFamily:'inherit', cursor:'pointer',
                  color: i === 0 ? 'var(--ink)' : 'var(--ink-3)',
                }}>{t}</button>
              ))}
            </div>
          } first/>
          <V2Row k="Densidad" v="Regular"/>
          <V2Row k="Idioma" v="Español (Argentina)"/>
        </div>

        <div className="card">
          <div className="h2" style={{marginBottom:14}}>Datos</div>
          <V2Row k="Exportar todos mis datos" v={<button className="linkbtn" style={{color:'var(--accent-ink)'}}>Descargar .json →</button>} first/>
          <V2Row k="Borrar mi cuenta" v={<button className="linkbtn" style={{color:'var(--st-failed-fg)'}}>Iniciar baja →</button>}/>
        </div>
      </div>
    </V2Shell>
  );
}

function V2Toggle({ label, on, sub, first }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center', gap:14,
      padding:'11px 0',
      borderTop: first ? 'none' : '1px solid var(--line)',
    }}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:13.5, color:'var(--ink)'}}>{label}</div>
        {sub && <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:2}}>{sub}</div>}
      </div>
      <span style={{
        width:34, height:18, borderRadius:99,
        background: on ? 'var(--accent)' : 'var(--line)',
        position:'relative', flexShrink:0, transition:'background .15s',
      }}>
        <span style={{
          position:'absolute', top:2, left: on ? 18 : 2,
          width:14, height:14, borderRadius:'50%', background:'#fff',
          transition:'left .15s',
        }}/>
      </span>
    </div>
  );
}

function V2Row({ k, v, first }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center', gap:14,
      padding:'11px 0',
      borderTop: first ? 'none' : '1px solid var(--line)',
      fontSize:13,
    }}>
      <span style={{color:'var(--ink-2)'}}>{k}</span>
      <span style={{color:'var(--ink)'}}>{v}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 9 · MI PERFIL (identidad del usuario)
// ════════════════════════════════════════════════════════════════
function V2Perfil() {
  return (
    <V2Shell active="perfil"
      pageEyebrow="Mi perfil"
      pageTitle={V2_USER.name}
      pageSub="Esto solo lo ves vos. En reseñas siempre aparecés como anónimo."
      pageRight={<button className="btn secondary" style={{padding:'7px 12px', fontSize:12.5}}>Editar</button>}
    >
      <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:18}}>
        <aside style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{textAlign:'center', padding:'24px 18px'}}>
            <div style={{
              width:72, height:72, borderRadius:'50%',
              background:'var(--accent-soft)', color:'var(--accent-ink)',
              display:'grid', placeItems:'center',
              fontSize:26, fontWeight:600, margin:'0 auto 10px',
            }}>{V2_USER.initials}</div>
            <div style={{fontSize:15, fontWeight:500, color:'var(--ink)'}}>{V2_USER.name}</div>
            <div style={{fontSize:12, color:'var(--ink-3)', marginTop:3}}>lourdes.aguero@unsta.edu.ar</div>
            <div style={{
              marginTop:10, display:'inline-flex', alignItems:'center', gap:5,
              padding:'3px 9px', borderRadius:999,
              background:'oklch(0.94 0.05 145)', color:'oklch(0.42 0.09 145)',
              fontSize:10.5, fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
            }}>✓ verificado UNSTA</div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:10}}>Tu actividad</div>
            <V2Row k="Reseñas escritas" v="7" first/>
            <V2Row k="Útiles recibidas" v="68"/>
            <V2Row k="Miembro desde" v="Mar 2024"/>
          </div>
        </aside>

        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="h2" style={{marginBottom:10}}>Datos académicos</div>
            <V2Row k="Universidad" v="UNSTA" first/>
            <V2Row k="Carrera" v={V2_USER.career}/>
            <V2Row k="Plan" v="2018"/>
            <V2Row k="Año en curso" v={`${V2_USER.year}° año · ${Math.round(V2_USER.progress*100)}% completado`}/>
            <V2Row k="Cohorte" v="2022"/>
            <V2Row k="Legajo" v="UNSTA-23814"/>
            <V2Row k="Estado" v={
              <span style={{
                padding:'2px 8px', borderRadius:999,
                background:'oklch(0.94 0.05 145)', color:'oklch(0.42 0.09 145)',
                fontSize:11, fontFamily:'var(--font-mono)',
              }}>regular</span>
            }/>
          </div>

          <div className="card" style={{
            background:'linear-gradient(180deg, var(--accent-soft) 0%, var(--bg-card) 100%)',
            borderColor:'oklch(0.85 0.07 55)',
          }}>
            <div className="h2" style={{marginBottom:8}}>Cómo te ven en reseñas</div>
            <div style={{
              background:'var(--bg-card)', border:'1px solid var(--line)',
              borderRadius:8, padding:'12px 14px',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <div style={{
                width:26, height:26, borderRadius:'50%',
                background:'var(--bg-elev)', color:'var(--ink-3)',
                display:'grid', placeItems:'center', fontSize:13,
              }}>?</div>
              <div style={{flex:1, fontSize:12.5, color:'var(--ink-2)'}}>
                <b style={{color:'var(--ink)'}}>Anónimo</b> · 4° año · Sistemas · cursó 2025·1c
              </div>
              <span style={{
                fontSize:9.5, padding:'2px 7px', borderRadius:3,
                background:'oklch(0.94 0.05 145)', color:'oklch(0.42 0.09 145)',
                fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
              }}>VERIFICADO QUE CURSÓ</span>
            </div>
            <p style={{fontSize:12, color:'var(--ink-2)', margin:'10px 0 0', lineHeight:1.5}}>
              Tu nombre, mail y legajo nunca se asocian a lo que escribís.
            </p>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

window.V2Resenas = V2Resenas;
window.V2Rankings = V2Rankings;
window.V2Ayuda = V2Ayuda;
window.V2Sobre = V2Sobre;
window.V2Ajustes = V2Ajustes;
window.V2Perfil = V2Perfil;
