// v2 — Detalles (Materia, Docente) + Mi carrera · Historial.
// Reusa V2Shell, V2_USER, V2_PERIOD del shell común.

// ════════════════════════════════════════════════════════════════
// 1 · MATERIA — DETALLE
// ════════════════════════════════════════════════════════════════
const V2_MAT = {
  code: 'ISW302',
  name: 'Ingeniería de Software II',
  year: 3,
  plan: '2018',
  hours: 96,
  modality: '1c',
  reviews: 32,
  rating: 4.1,
  difficulty: 4.2,
  approval: 0.68,
  studyHrs: 9,
  needs: [
    { code:'ISW201', name:'Ingeniería de Software I' },
    { code:'BD201',  name:'Bases de Datos' },
  ],
  unlocks: [
    { code:'ISW401', name:'Ingeniería de Software III' },
    { code:'PRY401', name:'Proyecto Final' },
  ],
  teachers: [
    { name:'Brandt, Carlos',    com:'A', rating:4.4, role:'titular',  active:true },
    { name:'Castro, Mariana',   com:'B', rating:3.8, role:'titular',  active:true },
    { name:'Sosa, Ramiro',      com:'C', rating:3.9, role:'titular',  active:true },
    { name:'Iturralde, Eduardo',com:'—', rating:4.0, role:'suplente', active:false },
  ],
  resenas: [
    { who:'Anónimo · 4° año · cursó 2025·1c', score:4, diff:4,
      text:'Materia bien estructurada. El TP integrador es exigente pero te enseña a laburar en equipo. Brandt es claro pero pide.',
      useful:14, prof:'Brandt' },
    { who:'Anónimo · 5° año · cursó 2024·2c', score:5, diff:4,
      text:'Si te gusta diseño de software, es la mejor del plan. Vas a programar mucho — preparate para eso.',
      useful:11, prof:'Brandt' },
    { who:'Anónimo · 4° año · cursó 2024·1c', score:3, diff:5,
      text:'El parcial 2 es un cuello de botella. Estudiá el material extra que sube la cátedra, no alcanza con la teórica.',
      useful:9,  prof:'Castro' },
  ],
};

function V2MateriaDetalle() {
  const m = V2_MAT;
  return (
    <V2Shell active="carrera"
      pageEyebrow={<><span style={{cursor:'pointer'}}>Mi carrera</span> <span style={{color:'var(--ink-3)'}}>›</span> <span style={{cursor:'pointer'}}>Catálogo</span> <span style={{color:'var(--ink-3)'}}>›</span> <span style={{color:'var(--ink-2)'}}>{m.code}</span></>}
      pageTitle={m.name}
      pageSub={`${m.year}° año · plan ${m.plan} · ${m.hours}h · ${V2_MOD_LABEL[m.modality]} · ${m.teachers.filter(t=>t.active).length} docentes activos · ${m.reviews} reseñas`}
      pageRight={<>
        <button className="btn secondary" style={{padding:'8px 14px', fontSize:13}}>+ A planificar</button>
        <button className="btn accent" style={{padding:'8px 14px', fontSize:13}}>Reseñar</button>
      </>}
    >
      <div style={{display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:16}}>
        {/* COL IZQ */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <div className="h2" style={{margin:0}}>Reseñas <small>{m.reviews} · ordenadas por más útiles</small></div>
              <select style={{
                appearance:'none', border:'1px solid var(--line)', background:'var(--bg-card)',
                padding:'5px 26px 5px 10px', borderRadius:6, fontSize:11.5, fontFamily:'inherit',
                color:'var(--ink-2)', cursor:'pointer',
              }}>
                <option>Filtrar por docente</option>
              </select>
            </div>
            {m.resenas.map((r,i) => <V2ResenaCard key={i} r={r} last={i===m.resenas.length-1}/>)}
            <div style={{paddingTop:12, borderTop:'1px solid var(--line)', marginTop:8}}>
              <button className="linkbtn" style={{color:'var(--accent-ink)'}}>Ver las {m.reviews} reseñas →</button>
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:12}}>Correlativas</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
              <div>
                <div className="eyebrow" style={{marginBottom:8}}>Necesitás (aprobadas)</div>
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  {m.needs.map(c => <V2CorrChip key={c.code} c={c} status="ok"/>)}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{marginBottom:8}}>Habilita</div>
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  {m.unlocks.map(c => <V2CorrChip key={c.code} c={c} status="next"/>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COL DER */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="h2" style={{marginBottom:12}}>En números</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
              <V2Stat v={m.difficulty.toFixed(1)} l="dificultad /5"/>
              <V2Stat v={`★ ${m.rating}`} l={`${m.reviews} reseñas`}/>
              <V2Stat v={`${Math.round(m.approval*100)}%`} l="aprobación esp."/>
              <V2Stat v={`${m.studyHrs}h`} l="estudio / sem."/>
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:8}}>Docentes activos</div>
            <div style={{display:'flex', flexDirection:'column', gap:1, marginTop:8}}>
              {m.teachers.map((t,i) => (
                <button key={t.name} style={{
                  appearance:'none', background:'none', border:'none', cursor:'pointer',
                  padding:'10px 0', textAlign:'left',
                  borderTop: i===0 ? 'none' : '1px solid var(--line)',
                  display:'flex', justifyContent:'space-between', alignItems:'center', gap:10,
                  fontFamily:'inherit',
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0}}>
                    <div style={{
                      width:30, height:30, borderRadius:'50%',
                      background: t.active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                      color: t.active ? 'var(--accent-ink)' : 'var(--ink-3)',
                      display:'grid', placeItems:'center', flexShrink:0,
                      fontWeight:600, fontSize:12,
                    }}>{t.name.split(',')[0][0]}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13, color:'var(--ink)', fontWeight:500}}>{t.name}</div>
                      <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:1}}>
                        Com {t.com} · {t.role}{!t.active && ' · inactivo'}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontSize:11.5, color:'var(--ink-2)', fontFamily:'var(--font-mono)'}}>★ {t.rating}</span>
                    <span style={{color:'var(--ink-3)', fontSize:14}}>›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{
            background:'linear-gradient(180deg, var(--accent-soft) 0%, var(--bg-card) 100%)',
            borderColor:'oklch(0.85 0.07 55)',
          }}>
            <div className="h2" style={{marginBottom:6}}>Tu situación con esta materia</div>
            <p style={{fontSize:12.5, color:'var(--ink-2)', margin:'0 0 10px', lineHeight:1.5}}>
              Tenés las 2 correlativas aprobadas. La podés cursar en cualquier 1c de tu carrera.
            </p>
            <button className="btn accent" style={{padding:'7px 12px', fontSize:12.5}}>
              Sumarla al borrador 2027·1c
            </button>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

function V2ResenaCard({ r, last }) {
  return (
    <div style={{
      padding:'14px 0',
      borderBottom: last ? 'none' : '1px solid var(--line)',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:6}}>
        <div style={{fontSize:11.5, color:'var(--ink-3)'}}>{r.who} · con {r.prof}</div>
        <div style={{display:'flex', gap:8, alignItems:'center', flexShrink:0}}>
          <span style={{fontSize:12, color:'var(--accent-ink)', letterSpacing:'0.05em'}}>
            {'★'.repeat(r.score)}<span style={{color:'var(--line)'}}>{'★'.repeat(5-r.score)}</span>
          </span>
        </div>
      </div>
      <p style={{fontSize:13, color:'var(--ink)', margin:'0 0 8px', lineHeight:1.55}}>{r.text}</p>
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <span style={{
          fontSize:10.5, padding:'2px 8px', borderRadius:999,
          background:'var(--bg-elev)', color:'var(--ink-2)',
          fontFamily:'var(--font-mono)',
        }}>dificultad {r.diff}/5</span>
        <span style={{fontSize:11, color:'var(--ink-3)'}}>·</span>
        <button className="linkbtn" style={{fontSize:11, color:'var(--ink-3)'}}>
          ↑ útil ({r.useful})
        </button>
      </div>
    </div>
  );
}

function V2CorrChip({ c, status }) {
  const tone = status === 'ok'
    ? { bg:'oklch(0.94 0.05 145)', fg:'oklch(0.42 0.09 145)', mark:'✓' }
    : { bg:'var(--bg-elev)',       fg:'var(--ink-2)',         mark:'→' };
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 10px', borderRadius:8,
      background:'var(--bg-elev)',
      border:'1px solid var(--line)',
    }}>
      <span style={{
        width:18, height:18, borderRadius:'50%',
        background: tone.bg, color: tone.fg,
        display:'grid', placeItems:'center',
        fontSize:10, fontWeight:600,
      }}>{tone.mark}</span>
      <span style={{fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)', letterSpacing:'0.04em'}}>{c.code}</span>
      <span style={{fontSize:12.5, color:'var(--ink)'}}>{c.name}</span>
    </div>
  );
}

function V2Stat({ v, l }) {
  return (
    <div>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600,
        letterSpacing:'-0.02em', color:'var(--ink)', lineHeight:1,
      }}>{v}</div>
      <div style={{fontSize:11, color:'var(--ink-3)', marginTop:5}}>{l}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · DOCENTE — DETALLE
// ════════════════════════════════════════════════════════════════
const V2_DOC = {
  name: 'Brandt, Carlos',
  initial: 'B',
  subjects: ['Ingeniería de Software I','Ingeniería de Software II'],
  reviews: 42,
  rating: 4.4,
  metrics: { claridad:4.6, exigencia:4.1, buenaonda:3.9, responde:3.2 },
  tags: [
    { l:'claro explicando',   c:42 },
    { l:'exige pero acompaña',c:31 },
    { l:'responde tarde',     c:18 },
    { l:'TPs bien armados',   c:14 },
  ],
  resenas: [
    { who:'Anónimo · cursó ISW302 · 2025·1c', score:5, useful:9,
      text:'Explicaciones muy claras. Pide pero acompaña, contesta dudas en clase.', mat:'ISW302' },
    { who:'Anónimo · cursó ISW302 · 2024·2c', score:4, useful:6,
      text:'Bueno en clase, los TPs están muy bien armados. Por mail tarda.', mat:'ISW302' },
    { who:'Anónimo · cursó ISW201 · 2024·1c', score:3, useful:4,
      text:'Responde lento por mail. La clase está bien.', mat:'ISW201' },
  ],
};

function V2DocenteDetalle() {
  const d = V2_DOC;
  return (
    <V2Shell active="carrera"
      pageEyebrow={<><span style={{cursor:'pointer'}}>Mi carrera</span> <span style={{color:'var(--ink-3)'}}>›</span> <span style={{cursor:'pointer'}}>Docentes</span> <span style={{color:'var(--ink-3)'}}>›</span> <span style={{color:'var(--ink-2)'}}>{d.name}</span></>}
      pageTitle={d.name}
      pageSub={`${d.subjects.join(' · ')} · UNSTA · ${d.reviews} reseñas verificadas`}
      pageRight={<button className="btn accent" style={{padding:'8px 14px', fontSize:13}}>Reseñar</button>}
    >
      <div style={{display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:16}}>
        {/* COL IZQ — identidad + métricas + tags */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{textAlign:'center', padding:'24px 18px'}}>
            <div style={{
              width:72, height:72, borderRadius:'50%',
              background:'var(--accent-soft)', color:'var(--accent-ink)',
              display:'grid', placeItems:'center',
              fontSize:28, fontWeight:600, margin:'0 auto 12px',
            }}>{d.initial}</div>
            <div style={{fontSize:15, fontWeight:500, color:'var(--ink)'}}>{d.name}</div>
            <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:4, lineHeight:1.5}}>
              Materias activas:<br/>{d.subjects.join(' · ')}
            </div>
            <div style={{
              marginTop:14, padding:'10px 12px',
              background:'var(--bg-elev)', borderRadius:8,
              display:'flex', justifyContent:'space-between', alignItems:'center', gap:8,
            }}>
              <span style={{fontSize:11, color:'var(--ink-3)'}}>Rating general</span>
              <span style={{fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600, color:'var(--accent-ink)'}}>★ {d.rating}</span>
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:14}}>Cómo lo califican</div>
            {Object.entries(d.metrics).map(([k,v]) => (
              <V2MetricBar key={k} label={k} value={v}/>
            ))}
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:10}}>Lo más mencionado</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {d.tags.map(t => (
                <span key={t.l} style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'5px 10px', borderRadius:999,
                  background:'var(--bg-elev)',
                  fontSize:11.5, color:'var(--ink-2)',
                }}>
                  {t.l}
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                  }}>×{t.c}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* COL DER — reseñas */}
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div className="h2" style={{margin:0}}>Reseñas <small>{d.reviews}</small></div>
            <select style={{
              appearance:'none', border:'1px solid var(--line)', background:'var(--bg-card)',
              padding:'5px 26px 5px 10px', borderRadius:6, fontSize:11.5, fontFamily:'inherit',
              color:'var(--ink-2)', cursor:'pointer',
            }}>
              <option>Filtrar por materia</option>
            </select>
          </div>
          {d.resenas.map((r,i) => (
            <div key={i} style={{
              padding:'14px 0',
              borderBottom: i === d.resenas.length-1 ? 'none' : '1px solid var(--line)',
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:6}}>
                <div style={{fontSize:11.5, color:'var(--ink-3)'}}>{r.who}</div>
                <span style={{fontSize:12, color:'var(--accent-ink)', letterSpacing:'0.05em'}}>
                  {'★'.repeat(r.score)}<span style={{color:'var(--line)'}}>{'★'.repeat(5-r.score)}</span>
                </span>
              </div>
              <p style={{fontSize:13, color:'var(--ink)', margin:'0 0 8px', lineHeight:1.55}}>{r.text}</p>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <span style={{
                  fontSize:10.5, padding:'2px 8px', borderRadius:999,
                  background:'var(--bg-elev)', color:'var(--ink-2)',
                  fontFamily:'var(--font-mono)',
                }}>{r.mat}</span>
                <span style={{fontSize:11, color:'var(--ink-3)'}}>·</span>
                <button className="linkbtn" style={{fontSize:11, color:'var(--ink-3)'}}>↑ útil ({r.useful})</button>
              </div>
            </div>
          ))}
          <div style={{paddingTop:12, marginTop:8, borderTop:'1px solid var(--line)'}}>
            <button className="linkbtn" style={{color:'var(--accent-ink)'}}>Ver las {d.reviews} reseñas →</button>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

function V2MetricBar({ label, value }) {
  const pct = (value / 5) * 100;
  const labels = {
    claridad: 'Claridad',
    exigencia: 'Exigencia',
    buenaonda: 'Buena onda',
    responde: 'Responde mails',
  };
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5}}>
        <span style={{fontSize:12, color:'var(--ink-2)'}}>{labels[label] || label}</span>
        <span style={{fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--ink)'}}>{value.toFixed(1)}</span>
      </div>
      <div style={{height:4, background:'var(--bg-elev)', borderRadius:2, overflow:'hidden'}}>
        <div style={{
          height:'100%', width:`${pct}%`,
          background: value >= 4 ? 'oklch(0.65 0.13 145)' : value >= 3 ? 'var(--accent)' : 'oklch(0.65 0.13 30)',
        }}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3 · MI CARRERA · HISTORIAL ACADÉMICO (tab)
// ════════════════════════════════════════════════════════════════
const V2_HIST = [
  { period:'2025·2c', avg:7.7, items:[
    ['ISW301','Ingeniería de Software I',     'aprob', 8, 'Brandt'],
    ['BD301', 'Bases de Datos',                'aprob', 7, 'Castellanos'],
    ['ARQ301','Arquitectura de Computadoras',  'aprob', 8, 'Toranzos'],
  ]},
  { period:'2025·1c', avg:7.7, items:[
    ['ISW201','Ingeniería de Software I (intro)','aprob', 8, 'Iturralde'],
    ['BD201', 'Bases de Datos I',                'aprob', 9, 'Castellanos'],
    ['SO201', 'Sistemas Operativos',             'aprob', 7, 'Sosa'],
  ]},
  { period:'2024·2c', avg:7.0, items:[
    ['PRG201','Programación II',     'aprob', 8, 'García'],
    ['MAT201','Análisis Matemático II','aprob', 6, 'López'],
  ]},
  { period:'2024·1c', avg:8.0, items:[
    ['MAT102','Análisis Matemático I','aprob', 7, 'López'],
    ['ALG101','Álgebra',              'aprob', 8, 'Pérez'],
    ['INT101','Intro a Sistemas',     'aprob', 9, 'Castro'],
    ['PRG101','Programación I',       'recurso', null, 'García'],
  ]},
];

function V2CarreraHistorial() {
  const totalAprob = V2_HIST.reduce((a, c) => a + c.items.filter(i => i[2] === 'aprob').length, 0);
  const allNotes = V2_HIST.flatMap(c => c.items.filter(i => i[3] != null).map(i => i[3]));
  const promedio = (allNotes.reduce((a,b) => a+b, 0) / allNotes.length).toFixed(1);

  return (
    <div>
      {/* resumen */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:14}}>
        <V2HistKpi v={totalAprob} l="materias aprobadas"/>
        <V2HistKpi v={promedio} l="promedio general"/>
        <V2HistKpi v={V2_HIST.length} l="períodos cursados"/>
        <V2HistKpi v="Mar 2024" l="primer cuatri"/>
      </div>

      {/* acciones */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:14, paddingBottom:12, borderBottom:'1px solid var(--line)',
      }}>
        <div style={{fontSize:12, color:'var(--ink-3)'}}>
          Lo que cargaste en el onboarding más lo que fuiste sumando después.
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn secondary" style={{padding:'6px 12px', fontSize:12.5}}>Importar PDF</button>
          <button className="btn accent" style={{padding:'6px 12px', fontSize:12.5}}>+ Materia rendida</button>
        </div>
      </div>

      {/* timeline por período */}
      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        {V2_HIST.map(c => (
          <div key={c.period} className="card">
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'baseline',
              marginBottom:10,
            }}>
              <div style={{display:'flex', alignItems:'baseline', gap:10}}>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:13.5, fontWeight:600,
                  color:'var(--ink)', letterSpacing:'0.02em',
                }}>{c.period}</span>
                <span style={{fontSize:11.5, color:'var(--ink-3)'}}>
                  {c.items.length} materias · promedio {c.avg.toFixed(1)}
                </span>
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'80px 1fr 110px 90px 60px 30px'}}>
              {c.items.map((m, idx) => {
                const aprob = m[2] === 'aprob';
                return (
                  <React.Fragment key={m[0]}>
                    <div style={{
                      padding:'11px 0', borderTop: idx===0 ? 'none' : '1px solid var(--line)',
                      fontFamily:'var(--font-mono)', fontSize:10.5,
                      color:'var(--ink-3)', letterSpacing:'0.04em',
                    }}>{m[0]}</div>
                    <div style={{
                      padding:'11px 0', borderTop: idx===0 ? 'none' : '1px solid var(--line)',
                      fontSize:13, fontWeight:500, color:'var(--ink)',
                    }}>{m[1]}</div>
                    <div style={{
                      padding:'11px 0', borderTop: idx===0 ? 'none' : '1px solid var(--line)',
                      fontSize:11, color:'var(--ink-3)',
                    }}>con {m[4]}</div>
                    <div style={{
                      padding:'11px 0', borderTop: idx===0 ? 'none' : '1px solid var(--line)',
                    }}>
                      <span style={{
                        fontSize:10.5, padding:'2px 8px', borderRadius:999,
                        background: aprob ? 'oklch(0.94 0.05 145)' : 'oklch(0.93 0.05 50)',
                        color:   aprob ? 'oklch(0.42 0.09 145)' : 'oklch(0.45 0.13 50)',
                        fontFamily:'var(--font-mono)', letterSpacing:'0.03em',
                      }}>{aprob ? 'aprob' : 'recurso'}</span>
                    </div>
                    <div style={{
                      padding:'11px 0', borderTop: idx===0 ? 'none' : '1px solid var(--line)',
                      fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600,
                      color: aprob ? 'var(--ink)' : 'var(--ink-3)',
                      textAlign:'right',
                    }}>{m[3] != null ? m[3] : '—'}</div>
                    <div style={{
                      padding:'11px 0', borderTop: idx===0 ? 'none' : '1px solid var(--line)',
                      textAlign:'right', color:'var(--ink-3)', cursor:'pointer',
                    }}>⋯</div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function V2HistKpi({ v, l }) {
  return (
    <div className="card" style={{padding:'14px 16px'}}>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600,
        color:'var(--ink)', letterSpacing:'-0.02em', lineHeight:1,
      }}>{v}</div>
      <div style={{fontSize:11, color:'var(--ink-3)', marginTop:6}}>{l}</div>
    </div>
  );
}

window.V2MateriaDetalle = V2MateriaDetalle;
window.V2DocenteDetalle = V2DocenteDetalle;
window.V2CarreraHistorial = V2CarreraHistorial;
