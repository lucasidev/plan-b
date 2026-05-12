// Landing — la venta. Vive separada de auth.
// Lenguaje del producto, no de "marketing site": Geist + Plex Mono, apricot, cards papel,
// mp pills. Hero corto, mock real del simulador embebido, prueba social mínima, CTAs.

function LpLogo() {
  return (
    <div style={{display:'inline-flex', alignItems:'baseline', gap:1, fontWeight:600, fontSize:16, letterSpacing:'-0.01em'}}>
      plan-b
      <span style={{
        width:6, height:6, background:'var(--accent)', borderRadius:'50%',
        display:'inline-block', transform:'translateY(-4px)', marginLeft:2,
      }}/>
    </div>
  );
}

// mini-simulador "vivo" — versión estática, mismo lenguaje visual del producto
function MiniSim() {
  const subj = [
    { code:'ISW302', name:'Ing. de Software II', diff:4, com:'A', prof:'Brandt' },
    { code:'MOV302', name:'Aplicaciones Móviles', diff:3, com:'A', prof:'Castro' },
    { code:'INT302', name:'Inteligencia Artificial I', diff:5, com:'A', prof:'Iturralde' },
    { code:'SEG302', name:'Seguridad Informática', diff:3, com:'B', prof:'Sosa' },
  ];
  const diffCls = d => d>=4 ? 'diff-hi' : d===3 ? 'diff-mid' : 'diff-lo';

  // bloques calendario simplificados
  const blocks = [
    { day:0, start:0, h:3, code:'INT302', c:'#eef0e0', f:'#475020' },
    { day:0, start:5, h:2, code:'ISW302', c:'#fbe8e1', f:'#7a3922', warn:true },
    { day:1, start:5, h:2, code:'MOV302', c:'#e0eef4', f:'#1e4d6b' },
    { day:2, start:5, h:2, code:'ISW302', c:'#fbe8e1', f:'#7a3922' },
    { day:3, start:5, h:2, code:'SEG302', c:'#eee1f2', f:'#4a2c5a' },
    { day:4, start:0, h:3, code:'INT302', c:'#eef0e0', f:'#475020' },
    { day:4, start:5, h:2, code:'MOV302', c:'#e0eef4', f:'#1e4d6b', warn:true },
  ];

  return (
    <div style={{
      background:'var(--bg-card)',
      borderRadius:18,
      boxShadow:'0 1px 2px rgba(120,40,10,0.06), 0 24px 60px -20px rgba(120,40,10,0.18)',
      overflow:'hidden',
      border:'1px solid var(--line)',
    }}>
      {/* topbar emulada */}
      <div style={{
        padding:'14px 18px', display:'flex', gap:12, alignItems:'center',
        borderBottom:'1px solid var(--line)', background:'var(--bg)',
      }}>
        <LpLogo/>
        <span style={{
          background:'var(--bg-card)', borderRadius:999, padding:'4px 10px',
          fontSize:11, color:'var(--ink-2)',
          display:'flex', gap:7, alignItems:'center',
          boxShadow:'var(--shadow-card)',
        }}>
          <span style={{width:5, height:5, background:'var(--accent)', borderRadius:'50%'}}/>
          2026·1c · borrador
        </span>
        <span style={{flex:1}}/>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
        }}>preview en vivo →</span>
      </div>

      {/* contenido */}
      <div style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:14, padding:14}}>
        {/* selección */}
        <div style={{
          background:'var(--bg-card)', borderRadius:12, padding:'12px 14px',
          border:'1px solid var(--line)',
        }}>
          <div style={{
            fontSize:12, fontWeight:600, marginBottom:10,
            display:'flex', justifyContent:'space-between',
          }}>
            Selección
            <small style={{color:'var(--ink-3)', fontWeight:400}}>4 / 6</small>
          </div>
          {subj.map(s => (
            <div key={s.code} style={{
              padding:'8px 0', borderBottom:'1px solid var(--line)',
            }}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                letterSpacing:'0.04em',
              }}>{s.code}</div>
              <div style={{fontSize:12, marginBottom:5}}>{s.name}</div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                <span className="mp code">Com {s.com}</span>
                <span className={`mp ${diffCls(s.diff)}`}>
                  <span className="dot"/>dif {s.diff}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* lado derecho: stats + calendario */}
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
            {[
              ['1', 'choque', 'var(--accent-ink)'],
              ['18h', 'semanales', 'var(--ink)'],
              ['52%', 'aprob. esp.', 'var(--ink)'],
            ].map(([v, l, c]) => (
              <div key={l} style={{
                background:'var(--bg-card)', borderRadius:10, padding:'10px 12px',
                border:'1px solid var(--line)',
              }}>
                <div style={{
                  fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600,
                  letterSpacing:'-0.02em', color:c, lineHeight:1,
                }}>{v}</div>
                <div style={{fontSize:10.5, color:'var(--ink-3)', marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>

          {/* mini calendario */}
          <div style={{
            background:'var(--bg-card)', borderRadius:10, padding:'10px 12px',
            border:'1px solid var(--line)',
          }}>
            <div style={{
              fontSize:11.5, color:'var(--ink-3)', marginBottom:6,
              display:'flex', justifyContent:'space-between',
            }}>
              <span>Distribución semanal</span>
              <span style={{color:'var(--accent-ink)'}}>⚠ 1 choque</span>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:4,
              height:150, position:'relative',
            }}>
              {['L','M','M','J','V'].map((d, i) => (
                <div key={i} style={{
                  background:'var(--bg)', borderRadius:6, position:'relative',
                  display:'flex', flexDirection:'column',
                }}>
                  <div style={{
                    fontSize:9.5, color:'var(--ink-3)', textAlign:'center',
                    padding:'3px 0', fontFamily:'var(--font-mono)',
                  }}>{d}</div>
                  {blocks.filter(b => b.day === i).map((b, j) => (
                    <div key={j} style={{
                      position:'absolute',
                      left:2, right:2,
                      top: 16 + b.start * 18,
                      height: b.h * 18 - 2,
                      background: b.c, color: b.f,
                      borderRadius:4,
                      fontSize:8.5, padding:'3px 4px',
                      fontFamily:'var(--font-mono)', fontWeight:600,
                      outline: b.warn ? '1.5px solid var(--accent-ink)' : 'none',
                      outlineOffset:-1.5,
                    }}>{b.code}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tarjeta de feature
function LpFeature({ code, title, body, demo }) {
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--line)',
      borderRadius:14, padding:'22px 22px 18px',
      display:'flex', flexDirection:'column', gap:14,
    }}>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--accent-ink)',
        letterSpacing:'0.08em', textTransform:'uppercase',
      }}>{code}</div>
      <div>
        <div style={{
          fontSize:18, fontWeight:600, letterSpacing:'-0.012em',
          color:'var(--ink)', marginBottom:6,
        }}>{title}</div>
        <div style={{fontSize:13, color:'var(--ink-2)', lineHeight:1.55}}>
          {body}
        </div>
      </div>
      {demo}
    </div>
  );
}

// Demos pequeños para las features (lenguaje del producto, no abstracto)
function DemoReview() {
  return (
    <div style={{
      background:'var(--bg)', borderRadius:10, padding:'12px 14px',
      fontSize:12, color:'var(--ink-2)', lineHeight:1.5,
    }}>
      <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:6}}>
        <span className="mp code">ISW302</span>
        <span className="mp">Brandt</span>
        <span className="mp diff-hi"><span className="dot"/>dif 4</span>
        <span style={{flex:1}}/>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink)',
        }}>4.1 ★ · 24</span>
      </div>
      "Materia exigente pero el TP final te enseña más que cualquier teórica.
      Brandt corrige rápido y devuelve feedback útil."
      <div style={{
        marginTop:8, fontSize:10.5, color:'var(--ink-3)',
        fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
      }}>
        — Anónimo · cursó 2024·2c · 7 (final)
      </div>
    </div>
  );
}

function DemoGraph() {
  // grafo mini de correlativas — 3 columnas, 6 nodos, líneas
  const nodes = [
    { x:0, y:0, code:'MAT101', state:'AP' },
    { x:0, y:1, code:'PRG101', state:'AP' },
    { x:1, y:0, code:'MAT201', state:'CU' },
    { x:1, y:1, code:'PRG201', state:'AP' },
    { x:2, y:0, code:'INT302', state:'PL' },
    { x:2, y:1, code:'ISW302', state:'AV' },
  ];
  const edges = [
    [0,2],[1,3],[2,4],[3,4],[3,5],
  ];
  const stateColor = {
    AP: ['oklch(0.94 0.05 145)', 'oklch(0.42 0.09 145)'],
    CU: ['oklch(0.93 0.06 70)',  'oklch(0.45 0.12 60)'],
    PL: ['oklch(0.92 0.05 290)', 'oklch(0.42 0.14 290)'],
    AV: ['oklch(0.94 0.012 80)', 'oklch(0.35 0.012 80)'],
  };
  const W=240, H=120, COLW=100, ROWH=56;
  const px = n => 12 + n.x * COLW;
  const py = n => 12 + n.y * ROWH;
  return (
    <div style={{
      background:'var(--bg)', borderRadius:10, padding:14,
      position:'relative', height:H, overflow:'hidden',
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{position:'absolute', inset:0}}>
        {edges.map(([a,b], i) => {
          const na = nodes[a], nb = nodes[b];
          const x1 = px(na) + 70, y1 = py(na) + 14;
          const x2 = px(nb), y2 = py(nb) + 14;
          const mx = (x1 + x2) / 2;
          return (
            <path key={i}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none" stroke="var(--line-2)" strokeWidth="1"/>
          );
        })}
      </svg>
      {nodes.map((n, i) => {
        const [bg, fg] = stateColor[n.state];
        return (
          <div key={i} style={{
            position:'absolute', left: px(n), top: py(n),
            width:70, padding:'5px 8px', borderRadius:6,
            background:bg, color:fg,
            fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600,
            display:'flex', justifyContent:'space-between',
            letterSpacing:'0.02em',
          }}>
            <span>{n.code}</span>
            <span style={{opacity:0.7}}>{n.state}</span>
          </div>
        );
      })}
    </div>
  );
}

function DemoProf() {
  return (
    <div style={{
      background:'var(--bg)', borderRadius:10, padding:'12px 14px',
      fontSize:12, color:'var(--ink-2)',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
        <div>
          <div style={{fontWeight:600, color:'var(--ink)', fontSize:13}}>Federico Brandt</div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
          }}>3 materias · 87 reseñas</div>
        </div>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600,
          color:'var(--ink)', letterSpacing:'-0.02em',
        }}>4.1<span style={{fontSize:11, color:'var(--ink-3)', marginLeft:2}}>/5</span></div>
      </div>
      {[
        ['Claridad', 0.78],
        ['Exigencia', 0.84],
        ['Buena onda', 0.62],
      ].map(([k, v]) => (
        <div key={k} style={{
          display:'grid', gridTemplateColumns:'70px 1fr 32px',
          gap:8, alignItems:'center', marginBottom:5, fontSize:11,
        }}>
          <span style={{color:'var(--ink-3)'}}>{k}</span>
          <span style={{
            height:5, background:'var(--line-2)', borderRadius:3, overflow:'hidden',
          }}>
            <span style={{
              display:'block', width:`${v*100}%`, height:'100%',
              background:'var(--accent)',
            }}/>
          </span>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:10.5,
            color:'var(--ink)', textAlign:'right',
          }}>{(v*5).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

function Landing() {
  return (
    <div style={{
      width:'100%', minHeight:'100%',
      background:'var(--bg)', color:'var(--ink)',
      fontFamily:'var(--font-ui)', fontSize:14,
      overflowY:'auto',
    }}>
      {/* topbar */}
      <header style={{
        padding:'18px 48px',
        display:'flex', alignItems:'center', gap:18,
        position:'sticky', top:0, background:'var(--bg)',
        borderBottom:'1px solid var(--line)', zIndex:5,
      }}>
        <LpLogo/>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
          letterSpacing:'0.06em', textTransform:'uppercase',
        }}>· beta abierta</span>
        <span style={{flex:1}}/>
        <nav style={{display:'flex', gap:24, fontSize:13, color:'var(--ink-2)'}}>
          <a href="#features" onClick={e=>e.preventDefault()} style={{color:'inherit', textDecoration:'none'}}>Cómo funciona</a>
          <a href="#data" onClick={e=>e.preventDefault()} style={{color:'inherit', textDecoration:'none'}}>Datos</a>
          <a href="#faq" onClick={e=>e.preventDefault()} style={{color:'inherit', textDecoration:'none'}}>Preguntas</a>
        </nav>
        <button className="btn ghost">Ingresar</button>
        <button className="btn primary">Crear cuenta</button>
      </header>

      {/* hero */}
      <section style={{
        padding:'56px 48px 24px',
        maxWidth:1280, margin:'0 auto',
        display:'grid', gridTemplateColumns:'minmax(0, 1fr) auto', gap:40,
        alignItems:'flex-end',
      }}>
        <div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
            letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16,
          }}>
            Para alumnos universitarios
          </div>
          <h1 style={{
            margin:0, fontSize:56, fontWeight:600,
            letterSpacing:'-0.025em', lineHeight:1.02,
          }}>
            Antes de inscribirte,<br/>
            mirá quiénes ya<br/>
            <span style={{color:'var(--accent-ink)'}}>pasaron por ahí.</span>
          </h1>
          <p style={{
            marginTop:20, fontSize:16, color:'var(--ink-2)',
            maxWidth:'52ch', lineHeight:1.55,
          }}>
            plan-b es una herramienta para alumnos: simulá tu cuatrimestre,
            comparás comisiones y leés reseñas verificadas de quienes ya cursaron.
            Sin nombres, sin filtros del decanato.
          </p>
          <div style={{display:'flex', gap:12, marginTop:28}}>
            <button className="btn accent" style={{padding:'10px 20px'}}>
              Crear cuenta gratis
            </button>
            <button className="btn ghost" style={{padding:'10px 20px'}}>
              Ver cómo funciona →
            </button>
          </div>
          <div style={{
            display:'flex', gap:32, marginTop:36,
            fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--ink-3)',
            letterSpacing:'0.04em',
          }}>
            <div><b style={{color:'var(--ink)', fontSize:14}}>340</b> alumnos verificados</div>
            <div><b style={{color:'var(--ink)', fontSize:14}}>1.2k</b> reseñas</div>
            <div><b style={{color:'var(--ink)', fontSize:14}}>3</b> carreras</div>
          </div>
        </div>

        {/* mock simulador a la derecha */}
        <div style={{width:560}}>
          <MiniSim/>
        </div>
      </section>

      {/* prueba social — quote anónima */}
      <section style={{
        padding:'48px 48px 40px',
        maxWidth:920, margin:'0 auto',
        textAlign:'center',
      }}>
        <p style={{
          fontSize:24, fontWeight:500, lineHeight:1.4,
          letterSpacing:'-0.01em', color:'var(--ink)',
          margin:0,
        }}>
          "Iba a anotarme en INT302 con el primero que tenía horario libre.
          Acá vi que había una comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."
        </p>
        <div style={{
          marginTop:14,
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
          letterSpacing:'0.04em',
        }}>
          — Anónimo · 4° año Sistemas
        </div>
      </section>

      {/* features */}
      <section id="features" style={{
        padding:'24px 48px 56px',
        maxWidth:1280, margin:'0 auto',
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'baseline',
          marginBottom:24,
        }}>
          <h2 style={{
            margin:0, fontSize:30, fontWeight:600, letterSpacing:'-0.022em',
          }}>Tres herramientas, un mismo lugar.</h2>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
            letterSpacing:'0.06em', textTransform:'uppercase',
          }}>02 · funciones</span>
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18,
        }}>
          <LpFeature
            code="01 · Reseñas"
            title="Lo que tus compañeros nunca te dijeron en voz alta."
            body="Reseñas anónimas de materia y docente, con dificultad, exigencia y carga real. Verificamos que quien escribe haya cursado, no que se llame X."
            demo={<DemoReview/>}
          />
          <LpFeature
            code="02 · Plan"
            title="Tu carrera como mapa, no como Excel."
            body="Mirá qué tenés aprobado, qué te falta y qué se te abre con cada materia. El grafo te muestra correlativas reales, no solo nombres."
            demo={<DemoGraph/>}
          />
          <LpFeature
            code="03 · Simulador"
            title="Probá cuatrimestres antes de inscribirte."
            body="Combiná materias, comisiones y horarios. Ves la carga semanal, choques y la dificultad agregada antes de clavarte 6 meses."
            demo={<DemoProf/>}
          />
        </div>
      </section>

      {/* cómo verificamos */}
      <section id="data" style={{
        padding:'48px 48px 48px',
        background:'var(--bg-elev)',
        borderTop:'1px solid var(--line)',
        borderBottom:'1px solid var(--line)',
      }}>
        <div style={{
          maxWidth:1280, margin:'0 auto',
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:48,
          alignItems:'center',
        }}>
          <div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12,
            }}>03 · cómo lo hacemos</div>
            <h2 style={{
              margin:0, fontSize:30, fontWeight:600, letterSpacing:'-0.022em',
            }}>Anonimato hacia afuera,<br/>verificación hacia adentro.</h2>
            <p style={{
              marginTop:14, fontSize:14.5, color:'var(--ink-2)',
              lineHeight:1.6, maxWidth:'56ch', marginBottom:0,
            }}>
              Te registrás con tu mail .edu.ar. Confirmamos que sos alumno y nunca
              más mostramos tu nombre asociado a una reseña. Las reseñas se publican
              después de que cargues que cursaste esa materia, no antes.
            </p>
          </div>

          <div style={{
            background:'var(--bg-card)', border:'1px solid var(--line)',
            borderRadius:14, padding:24,
            display:'flex', flexDirection:'column', gap:14,
          }}>
            {[
              ['1', 'Te registrás con email institucional', 'lucia.mansilla@tu-universidad.edu.ar'],
              ['2', 'Cargás tu historial académico', '8 materias aprobadas, 1 cursando'],
              ['3', 'Reseñás solo materias que cursaste', 'Visible como "Anónimo · 4° año"'],
            ].map(([n, t, ex]) => (
              <div key={n} style={{
                display:'grid', gridTemplateColumns:'28px 1fr', gap:14, alignItems:'flex-start',
              }}>
                <div style={{
                  width:28, height:28, borderRadius:8,
                  background:'var(--accent-soft)', color:'var(--accent-ink)',
                  display:'grid', placeItems:'center',
                  fontFamily:'var(--font-mono)', fontWeight:600, fontSize:12,
                }}>{n}</div>
                <div>
                  <div style={{fontSize:13.5, color:'var(--ink)', fontWeight:500}}>{t}</div>
                  <div style={{
                    fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
                    marginTop:2, letterSpacing:'0.02em',
                  }}>{ex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ corto */}
      <section id="faq" style={{
        padding:'56px 48px',
        maxWidth:920, margin:'0 auto',
      }}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
          letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12,
        }}>04 · preguntas</div>
        <h2 style={{
          margin:0, fontSize:30, fontWeight:600, letterSpacing:'-0.022em',
          marginBottom:28,
        }}>Lo que probablemente te estés preguntando.</h2>

        {[
          ['¿plan-b está afiliada con mi universidad?',
           'No. Es un proyecto independiente hecho por alumnos. Las universidades no operan ni moderan el contenido — el equipo de plan-b cura los datos académicos.'],
          ['¿Pueden los profesores ver quién los reseñó?',
           'No. Las reseñas son anónimas hacia afuera. Internamente verificamos que cursaste, pero esa data no sale del backend.'],
          ['¿Tengo que cargar todo mi historial?',
           'Sí, esa es la base. Sin historial no podés reseñar ni armar simulador útil. Tarda 2 minutos.'],
          ['¿Qué pasa con las reseñas viejas si cambia el profesor?',
           'Quedan asociadas al docente y al cuatrimestre en el que se cursó. Una reseña de 2021 con otro profe es eso, no se mezcla.'],
        ].map(([q, a]) => (
          <div key={q} style={{
            padding:'18px 0', borderTop:'1px solid var(--line)',
          }}>
            <div style={{fontSize:15, fontWeight:500, color:'var(--ink)', marginBottom:6}}>
              {q}
            </div>
            <div style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55}}>{a}</div>
          </div>
        ))}
      </section>

      {/* CTA final */}
      <section style={{
        padding:'48px 48px 40px',
        background:'var(--ink)',
        color:'var(--bg)',
      }}>
        <div style={{
          maxWidth:1280, margin:'0 auto',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          gap:32, flexWrap:'wrap',
        }}>
          <div>
            <h2 style={{
              margin:0, fontSize:32, fontWeight:600, letterSpacing:'-0.022em',
              color:'var(--bg)',
            }}>
              Empezá a planificar el cuatrimestre que viene.
            </h2>
            <p style={{
              marginTop:8, fontSize:14, color:'var(--ink-4)', maxWidth:'56ch',
            }}>
              30 segundos para registrarte. 2 minutos para cargar historial.
              Después la app es tuya.
            </p>
          </div>
          <button className="btn accent" style={{padding:'12px 24px', fontSize:14}}>
            Crear cuenta con email institucional
          </button>
        </div>
      </section>

      {/* footer */}
      <footer style={{
        padding:'20px 48px',
        borderTop:'1px solid #1a110a',
        background:'var(--ink)',
        color:'var(--ink-4)',
        fontFamily:'var(--font-mono)', fontSize:11,
        letterSpacing:'0.04em',
        display:'flex', justifyContent:'space-between',
      }}>
        <span>plan-b · 2026 · proyecto independiente</span>
        <span>no afiliado oficialmente con ninguna universidad</span>
      </footer>
    </div>
  );
}

window.Landing = Landing;
