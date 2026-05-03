// v2 — Editor de reseña + Búsqueda (resultados dropdown).
// Reseña de cursada completa (materia + docente + comisión + cuatri en una sola).

// ════════════════════════════════════════════════════════════════
// 1 · EDITOR DE RESEÑA
// ════════════════════════════════════════════════════════════════
// Contexto: el alumno termina ISW301 con Brandt en 2025·2c. Desde
// "Reseñas · Pendientes" o desde la ficha de la materia/docente,
// abre este editor para reseñar la cursada completa.

const V2_EDITOR_CTX = {
  matCode: 'ISW301',
  matName: 'Ingeniería de Software I',
  prof: 'Brandt, Carlos',
  com: 'A',
  period: '2025·2c',
  finalNote: 8,
};

const V2_TAGS = [
  'claro explicando',
  'exige pero acompaña',
  'pide mucho',
  'responde tarde',
  'TPs bien armados',
  'parciales justos',
  'parciales difíciles',
  'aprueba justo',
  'cercano con alumnos',
  'flexible con entregas',
  'estructura ordenada',
  'material desactualizado',
];

function V2EditorResena() {
  const [score, setScore] = React.useState(4);
  const [hoverScore, setHoverScore] = React.useState(0);
  const [diff, setDiff] = React.useState(4);
  const [hours, setHours] = React.useState(8);
  const [text, setText] = React.useState('');
  const [tags, setTags] = React.useState(['claro explicando', 'TPs bien armados']);
  const [recCursada, setRecCursada] = React.useState(true);
  const [tomarDeNuevo, setTomarDeNuevo] = React.useState(true);

  const ctx = V2_EDITOR_CTX;
  const toggleTag = (t) => setTags(tags.includes(t) ? tags.filter(x=>x!==t) : [...tags, t]);

  return (
    <V2Shell active="resenas"
      pageEyebrow={<><span style={{cursor:'pointer'}}>Reseñas</span> <span style={{color:'var(--ink-3)'}}>›</span> <span style={{cursor:'pointer'}}>Pendientes</span> <span style={{color:'var(--ink-3)'}}>›</span> <span style={{color:'var(--ink-2)'}}>Nueva reseña</span></>}
      pageTitle="Reseñá tu cursada"
      pageSub="Una sola reseña por cursada — califica materia, docente, comisión y cuatri juntos. Es anónima para el resto."
      pageRight={<>
        <button className="btn secondary" style={{padding:'8px 14px', fontSize:13}}>Guardar borrador</button>
        <button className="btn accent" style={{padding:'8px 14px', fontSize:13}}>Publicar reseña</button>
      </>}
    >
      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'flex-start'}}>
        {/* COL FORMULARIO */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {/* contexto cursada */}
          <div className="card" style={{
            background:'var(--bg-elev)',
            display:'flex', alignItems:'center', gap:14,
            padding:'14px 16px',
          }}>
            <div style={{
              width:42, height:42, borderRadius:8,
              background:'var(--accent-soft)', color:'var(--accent-ink)',
              display:'grid', placeItems:'center',
              fontFamily:'var(--font-mono)', fontWeight:600, fontSize:11,
              letterSpacing:'0.04em',
            }}>{ctx.matCode}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13.5, fontWeight:500, color:'var(--ink)'}}>{ctx.matName}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:2}}>
                con <b style={{color:'var(--ink-2)', fontWeight:500}}>{ctx.prof}</b> · Com {ctx.com} · {ctx.period} · nota final {ctx.finalNote}
              </div>
            </div>
            <button className="linkbtn" style={{fontSize:11.5, color:'var(--ink-3)'}}>Cambiar</button>
          </div>

          {/* RATING */}
          <div className="card">
            <V2FieldHead n={1} label="¿Cómo te pareció la cursada en general?" required/>
            <div style={{display:'flex', alignItems:'center', gap:14, marginTop:14}}>
              <div style={{display:'flex', gap:4}} onMouseLeave={()=>setHoverScore(0)}>
                {[1,2,3,4,5].map(n => (
                  <button key={n}
                    onClick={()=>setScore(n)}
                    onMouseEnter={()=>setHoverScore(n)}
                    style={{
                      appearance:'none', background:'none', border:'none', padding:'2px 4px',
                      cursor:'pointer', fontSize:34, lineHeight:1,
                      color: (hoverScore || score) >= n ? 'var(--accent)' : 'var(--line)',
                      transition:'color .1s',
                    }}>★</button>
                ))}
              </div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:13, color:'var(--ink-2)',
                paddingLeft:8, borderLeft:'1px solid var(--line)',
              }}>
                {(hoverScore || score) === 1 && 'mala'}
                {(hoverScore || score) === 2 && 'regular'}
                {(hoverScore || score) === 3 && 'aceptable'}
                {(hoverScore || score) === 4 && 'buena'}
                {(hoverScore || score) === 5 && 'excelente'}
              </div>
            </div>
          </div>

          {/* DIFICULTAD */}
          <div className="card">
            <V2FieldHead n={2} label="¿Qué tan difícil te resultó?" required/>
            <V2Steps n={5}
              labels={['muy fácil','fácil','justa','exigente','muy exigente']}
              value={diff} onChange={setDiff}/>
          </div>

          {/* HORAS */}
          <div className="card">
            <V2FieldHead n={3} label="¿Cuántas horas estudiabas por semana? (fuera de clase)" />
            <div style={{display:'flex', alignItems:'baseline', gap:14, marginTop:14}}>
              <input type="range" min={0} max={20} step={1}
                value={hours} onChange={e=>setHours(+e.target.value)}
                style={{flex:1, accentColor:'var(--accent)'}}/>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600,
                color:'var(--ink)', minWidth:80, textAlign:'right',
              }}>{hours} <small style={{fontSize:11, fontWeight:400, color:'var(--ink-3)'}}>hs/sem</small></div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:4}}>
              <span>0</span><span>10</span><span>20+</span>
            </div>
          </div>

          {/* TAGS */}
          <div className="card">
            <V2FieldHead n={4} label="Etiquetá la cursada"
              hint={`Marcá las que apliquen — ayudan a otros a saber qué esperar. (${tags.length} seleccionadas)`}/>
            <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:14}}>
              {V2_TAGS.map(t => {
                const on = tags.includes(t);
                return (
                  <button key={t} onClick={()=>toggleTag(t)} style={{
                    appearance:'none', cursor:'pointer', fontFamily:'inherit',
                    padding:'6px 12px', borderRadius:999, fontSize:12,
                    border: on ? '1px solid var(--accent)' : '1px solid var(--line)',
                    background: on ? 'var(--accent-soft)' : 'var(--bg-card)',
                    color: on ? 'var(--accent-ink)' : 'var(--ink-2)',
                    transition:'all .12s',
                  }}>{on && '✓ '}{t}</button>
                );
              })}
            </div>
          </div>

          {/* TEXTO */}
          <div className="card">
            <V2FieldHead n={5} label="Contá tu experiencia"
              hint="Lo que te hubiera gustado leer antes de inscribirte. Se publica anónimo."/>
            <textarea
              value={text} onChange={e=>setText(e.target.value)}
              placeholder="¿Cómo era la dinámica de clase? ¿Cómo eran los parciales / TPs? ¿Algo que te sorprendió? ¿Recomendarías la cursada?"
              style={{
                marginTop:12, width:'100%', minHeight:140,
                padding:'12px 14px', borderRadius:8,
                border:'1px solid var(--line)', background:'var(--bg-card)',
                fontFamily:'inherit', fontSize:13, lineHeight:1.6, color:'var(--ink)',
                resize:'vertical', outline:'none',
                boxSizing:'border-box',
              }}/>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-3)', marginTop:6}}>
              <span>Mínimo libre · sé respetuoso</span>
              <span style={{fontFamily:'var(--font-mono)'}}>{text.length} caracteres</span>
            </div>
          </div>

          {/* SI / NO */}
          <div className="card">
            <V2FieldHead n={6} label="Dos preguntas rápidas"/>
            <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:14}}>
              <V2YesNo
                q="¿Recomendarías esta cursada (materia + comisión) a alguien que la tiene que hacer?"
                value={recCursada} onChange={setRecCursada}/>
              <V2YesNo
                q="¿Volverías a tomar clases con este docente?"
                value={tomarDeNuevo} onChange={setTomarDeNuevo}/>
            </div>
          </div>
        </div>

        {/* COL ASIDE — preview + privacidad */}
        <aside style={{
          position:'sticky', top:0,
          display:'flex', flexDirection:'column', gap:14,
        }}>
          <div className="card" style={{
            borderColor:'oklch(0.85 0.07 55)',
            background:'linear-gradient(180deg, var(--accent-soft) 0%, var(--bg-card) 60%)',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8}}>
              <span style={{
                fontSize:9.5, padding:'2px 7px', borderRadius:3,
                background:'oklch(0.94 0.05 145)', color:'oklch(0.42 0.09 145)',
                fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
              }}>VERIFICADO QUE CURSÓ</span>
            </div>
            <div className="h2" style={{marginBottom:6}}>Así se va a ver</div>
            <div style={{
              background:'var(--bg-card)', border:'1px solid var(--line)',
              borderRadius:8, padding:'12px 14px',
            }}>
              <div style={{display:'flex', alignItems:'center', gap:9, marginBottom:8}}>
                <div style={{
                  width:24, height:24, borderRadius:'50%',
                  background:'var(--bg-elev)', color:'var(--ink-3)',
                  display:'grid', placeItems:'center', fontSize:12,
                }}>?</div>
                <div style={{fontSize:11, color:'var(--ink-3)', flex:1, minWidth:0}}>
                  Anónimo · 4° · Sistemas · cursó {ctx.period}
                </div>
                <span style={{fontSize:11, color:'var(--accent-ink)', letterSpacing:'0.05em'}}>
                  {'★'.repeat(score)}<span style={{color:'var(--line)'}}>{'★'.repeat(5-score)}</span>
                </span>
              </div>
              <p style={{fontSize:12, color:'var(--ink)', margin:'0 0 8px', lineHeight:1.55, minHeight:32}}>
                {text || <span style={{color:'var(--ink-3)', fontStyle:'italic'}}>Tu texto aparecerá acá…</span>}
              </p>
              <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                {tags.slice(0,4).map(t => (
                  <span key={t} style={{
                    fontSize:9.5, padding:'1px 7px', borderRadius:999,
                    background:'var(--bg-elev)', color:'var(--ink-2)',
                  }}>{t}</span>
                ))}
                {tags.length > 4 && <span style={{fontSize:9.5, color:'var(--ink-3)'}}>+{tags.length-4}</span>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="h2" style={{marginBottom:8, fontSize:12}}>Privacidad</div>
            <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8}}>
              <V2PrivLi>Aparecés solo como año + carrera + período</V2PrivLi>
              <V2PrivLi>Tu nombre, mail y legajo nunca se asocian</V2PrivLi>
              <V2PrivLi>Se muestra "verificado que cursó" porque tenés la materia en tu historial</V2PrivLi>
              <V2PrivLi>Podés editarla o borrarla cuando quieras</V2PrivLi>
            </ul>
          </div>
        </aside>
      </div>
    </V2Shell>
  );
}

// helpers editor
function V2FieldHead({ n, label, hint, required }) {
  return (
    <div>
      <div style={{display:'flex', alignItems:'baseline', gap:8}}>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10.5,
          color:'var(--ink-3)', letterSpacing:'0.06em',
        }}>0{n}</span>
        <div style={{flex:1, fontSize:14, fontWeight:500, color:'var(--ink)'}}>
          {label}
          {required && <span style={{color:'var(--accent)', marginLeft:6}}>*</span>}
        </div>
      </div>
      {hint && <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:4, marginLeft:24}}>{hint}</div>}
    </div>
  );
}

function V2Steps({ n, labels, value, onChange }) {
  return (
    <div style={{marginTop:14}}>
      <div style={{display:'grid', gridTemplateColumns:`repeat(${n}, 1fr)`, gap:6}}>
        {[...Array(n)].map((_,i) => {
          const v = i+1;
          const on = v <= value;
          return (
            <button key={v} onClick={()=>onChange(v)} style={{
              appearance:'none', cursor:'pointer', fontFamily:'inherit',
              padding:'10px 8px', borderRadius:8, fontSize:11.5,
              border: v === value ? '1px solid var(--accent)' : '1px solid var(--line)',
              background: on ? (v === value ? 'var(--accent-soft)' : 'var(--bg-elev)') : 'var(--bg-card)',
              color: on ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: v === value ? 600 : 400,
              transition:'all .12s',
            }}>
              <div style={{fontFamily:'var(--font-mono)', fontSize:13, marginBottom:2}}>{v}</div>
              <div style={{fontSize:10.5}}>{labels[i]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function V2YesNo({ q, value, onChange }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center', gap:14,
      padding:'10px 12px', borderRadius:8, background:'var(--bg-elev)',
    }}>
      <span style={{fontSize:12.5, color:'var(--ink-2)', flex:1}}>{q}</span>
      <div style={{display:'flex', gap:4, flexShrink:0}}>
        {[true,false].map(v => (
          <button key={String(v)} onClick={()=>onChange(v)} style={{
            appearance:'none', cursor:'pointer', fontFamily:'inherit',
            padding:'5px 14px', borderRadius:6, fontSize:11.5,
            border:'1px solid ' + (value === v ? 'var(--accent)' : 'var(--line)'),
            background: value === v ? 'var(--accent-soft)' : 'var(--bg-card)',
            color: value === v ? 'var(--accent-ink)' : 'var(--ink-2)',
            fontWeight: value === v ? 600 : 400,
          }}>{v ? 'Sí' : 'No'}</button>
        ))}
      </div>
    </div>
  );
}

function V2PrivLi({ children }) {
  return (
    <li style={{display:'flex', gap:8, fontSize:11.5, color:'var(--ink-2)', lineHeight:1.5}}>
      <span style={{
        flexShrink:0, color:'oklch(0.55 0.13 145)',
        fontFamily:'var(--font-mono)',
      }}>✓</span>
      <span>{children}</span>
    </li>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · BÚSQUEDA — DROPDOWN ABIERTO
// ════════════════════════════════════════════════════════════════
// Esta vista re-usa el shell de Inicio pero con el dropdown del topbar
// renderizado abierto, mostrando resultados para "brand".

const V2_SEARCH_RESULTS = {
  query: 'brand',
  recientes: [
    { kind:'mat',  code:'ISW302', name:'Ingeniería de Software II' },
    { kind:'doc',  name:'Castro, Mariana', subjects:'Móviles' },
  ],
  docentes: [
    { name:'Brandt, Carlos',     subjects:'ISW I · ISW II', rating:4.4, reviews:42 },
    { name:'Brandán, Laura',     subjects:'Análisis Matemático I', rating:4.0, reviews:18 },
  ],
  materias: [
    { code:'BD301', name:'Bases de Datos', year:3, plan:'2018', tag:'cursando' },
  ],
  comisiones: [
    { code:'ISW302', com:'A', prof:'Brandt',  schedule:'Lun + Mié 18–22', cupo:'34/40' },
    { code:'ISW301', com:'A', prof:'Brandt',  schedule:'Mar + Jue 18–22', cupo:'cerrada' },
  ],
};

function V2Buscar() {
  const r = V2_SEARCH_RESULTS;
  const total = r.docentes.length + r.materias.length + r.comisiones.length;

  // Pill dotada de helpers locales
  const Group = ({ icon, label, count, children }) => (
    <div style={{borderTop:'1px solid var(--line)'}}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px 6px',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{
            width:18, height:18, borderRadius:4,
            background:'var(--bg-elev)', color:'var(--ink-3)',
            display:'grid', placeItems:'center', fontSize:10,
            fontFamily:'var(--font-mono)',
          }}>{icon}</span>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:10.5,
            color:'var(--ink-3)', letterSpacing:'0.06em', textTransform:'uppercase',
          }}>{label}</span>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:10.5,
            color:'var(--ink-3)',
          }}>· {count}</span>
        </div>
      </div>
      {children}
    </div>
  );

  const Row = ({ children, kbd }) => (
    <button style={{
      display:'flex', alignItems:'center', gap:12,
      width:'100%', padding:'10px 16px',
      background:'none', border:'none', cursor:'pointer',
      fontFamily:'inherit', textAlign:'left',
    }}
    onMouseEnter={e => e.currentTarget.style.background='var(--bg-elev)'}
    onMouseLeave={e => e.currentTarget.style.background='none'}>
      {children}
    </button>
  );

  // Renderizamos sobre Inicio + overlay con backdrop
  return (
    <div style={{position:'relative'}}>
      <V2Inicio/>

      {/* backdrop oscuro */}
      <div style={{
        position:'absolute', inset:0,
        background:'oklch(0.18 0.02 60 / 0.32)',
        backdropFilter:'blur(2px)',
        zIndex:50,
      }}/>

      {/* dropdown con search ya tipeado */}
      <div style={{
        position:'absolute',
        top:14,
        left:'50%', transform:'translateX(-50%)',
        width:520, zIndex:60,
        background:'var(--bg-card)',
        border:'1px solid var(--line)',
        borderRadius:10,
        boxShadow:'0 12px 40px oklch(0.18 0.02 60 / 0.18)',
        overflow:'hidden',
      }}>
        {/* input activo */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 16px',
          borderBottom:'1px solid var(--line)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--ink-3)', flexShrink:0}}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input value={r.query} readOnly style={{
            flex:1, border:'none', outline:'none', background:'none',
            fontFamily:'inherit', fontSize:14, color:'var(--ink)',
          }}/>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            padding:'2px 6px', border:'1px solid var(--line)', borderRadius:4,
          }}>esc</span>
        </div>

        {/* meta resultados */}
        <div style={{
          padding:'8px 16px',
          fontSize:11, color:'var(--ink-3)',
          background:'var(--bg-elev)',
          fontFamily:'var(--font-mono)',
          letterSpacing:'0.04em',
        }}>
          {total} resultados · ↑↓ para navegar · ↵ para abrir
        </div>

        {/* recientes (si query corta) */}
        {r.recientes.length > 0 && (
          <Group icon="↺" label="Recientes" count={r.recientes.length}>
            {r.recientes.map((it,i) => (
              <Row key={i}>
                <span style={{
                  width:28, height:28, borderRadius:6,
                  background:'var(--bg-elev)', color:'var(--ink-3)',
                  display:'grid', placeItems:'center', fontSize:11,
                  fontFamily:'var(--font-mono)',
                }}>{it.kind === 'mat' ? '◧' : '◔'}</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, color:'var(--ink)'}}>{it.kind === 'mat' ? it.name : it.name}</div>
                  <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:1}}>
                    {it.kind === 'mat' ? `Materia · ${it.code}` : `Docente · ${it.subjects}`}
                  </div>
                </div>
              </Row>
            ))}
          </Group>
        )}

        {/* docentes */}
        <Group icon="◔" label="Docentes" count={r.docentes.length}>
          {r.docentes.map((d,i) => (
            <Row key={d.name}>
              <span style={{
                width:28, height:28, borderRadius:'50%',
                background:'var(--accent-soft)', color:'var(--accent-ink)',
                display:'grid', placeItems:'center',
                fontSize:11, fontWeight:600,
              }}>{d.name[0]}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, color:'var(--ink)'}}>
                  <V2Highlight text={d.name} q={r.query}/>
                </div>
                <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:1}}>
                  {d.subjects}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-3)'}}>
                <span style={{fontFamily:'var(--font-mono)'}}>★ {d.rating}</span>
                <span>·</span>
                <span style={{fontFamily:'var(--font-mono)'}}>{d.reviews}</span>
                {i === 0 && (
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                    padding:'2px 6px', border:'1px solid var(--line)', borderRadius:4,
                    marginLeft:4,
                  }}>↵</span>
                )}
              </div>
            </Row>
          ))}
        </Group>

        {/* materias */}
        <Group icon="◧" label="Materias" count={r.materias.length}>
          {r.materias.map(m => (
            <Row key={m.code}>
              <span style={{
                width:28, height:28, borderRadius:6,
                background:'var(--bg-elev)', color:'var(--ink-3)',
                display:'grid', placeItems:'center',
                fontFamily:'var(--font-mono)', fontSize:9.5, fontWeight:600,
              }}>{m.code.slice(0,3)}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, color:'var(--ink)'}}>
                  <V2Highlight text={m.name} q={r.query}/>
                </div>
                <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:1}}>
                  {m.code} · {m.year}° año · plan {m.plan}
                </div>
              </div>
              {m.tag && (
                <span style={{
                  fontSize:10, padding:'2px 7px', borderRadius:999,
                  background:'oklch(0.94 0.05 145)', color:'oklch(0.42 0.09 145)',
                  fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                }}>{m.tag}</span>
              )}
            </Row>
          ))}
        </Group>

        {/* comisiones */}
        <Group icon="◐" label="Comisiones" count={r.comisiones.length}>
          {r.comisiones.map((c,i) => (
            <Row key={i}>
              <span style={{
                width:28, height:28, borderRadius:6,
                background:'var(--bg-elev)', color:'var(--ink-3)',
                display:'grid', placeItems:'center',
                fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600,
              }}>{c.com}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, color:'var(--ink)'}}>
                  {c.code} · Com {c.com} · <span style={{color:'var(--ink-2)'}}>{c.prof}</span>
                </div>
                <div style={{fontSize:10.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:1}}>
                  {c.schedule} · cupo {c.cupo}
                </div>
              </div>
            </Row>
          ))}
        </Group>

        {/* footer */}
        <div style={{
          padding:'8px 16px', borderTop:'1px solid var(--line)',
          background:'var(--bg-elev)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          fontSize:11, color:'var(--ink-3)', fontFamily:'var(--font-mono)',
        }}>
          <span>Buscás en plan-b · Ing. en Sistemas</span>
          <button className="linkbtn" style={{color:'var(--accent-ink)'}}>Ver todos los resultados →</button>
        </div>
      </div>
    </div>
  );
}

function V2Highlight({ text, q }) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{
        background:'oklch(0.93 0.10 90)', color:'var(--ink)',
        padding:'0 2px', borderRadius:2,
      }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

window.V2EditorResena = V2EditorResena;
window.V2Buscar = V2Buscar;
