// Design System — referencia visible en el canvas.
// Lee los tokens reales de styles.css/canvas-tokens.css. Si cambian allá, esto se actualiza.

const DS_COLORS = [
  { group: 'Superficies', items: [
    { name: '--bg',      val: '#fbf3ec', desc: 'Fondo de página (Apricot Soft)' },
    { name: '--bg-elev', val: '#f6ebde', desc: 'Tinta sobre superficie elevada' },
    { name: '--bg-card', val: '#ffffff', desc: 'Tarjetas, módulos, inputs' },
    { name: '--line',    val: '#f0e2d2', desc: 'Líneas finas, divisores' },
    { name: '--line-2',  val: '#f6ebde', desc: 'Bordes inputs / cards' },
  ]},
  { group: 'Tinta', items: [
    { name: '--ink',   val: '#2a1d12', desc: 'Texto principal · headings' },
    { name: '--ink-2', val: '#5c4631', desc: 'Texto secundario · labels' },
    { name: '--ink-3', val: '#9c7e62', desc: 'Texto auxiliar · meta · hints' },
    { name: '--ink-4', val: '#c2a98e', desc: 'Decorativo · placeholders' },
  ]},
  { group: 'Acento (apricot)', items: [
    { name: '--accent',      val: '#e07a4d', desc: 'CTA primario, dot logo, focus' },
    { name: '--accent-soft', val: '#fbe5d6', desc: 'Backgrounds soft (pills, badges)' },
    { name: '--accent-ink',  val: '#b04a1c', desc: 'Texto sobre soft, links' },
  ]},
];

const DS_STATES = [
  { code:'AP', label:'Aprobada',     bg:'oklch(0.94 0.05 145)', fg:'oklch(0.42 0.09 145)' },
  { code:'RG', label:'Regularizada', bg:'oklch(0.94 0.04 200)', fg:'oklch(0.42 0.09 220)' },
  { code:'CU', label:'Cursando',     bg:'oklch(0.93 0.06 70)',  fg:'oklch(0.45 0.12 60)' },
  { code:'PL', label:'Planeada',     bg:'oklch(0.92 0.05 290)', fg:'oklch(0.42 0.14 290)' },
  { code:'AV', label:'Disponible',   bg:'oklch(0.94 0.012 80)', fg:'oklch(0.35 0.012 80)' },
  { code:'PE', label:'Pendiente',    bg:'oklch(0.96 0.004 80)', fg:'oklch(0.55 0.008 80)' },
  { code:'DE', label:'Desaprobada',  bg:'oklch(0.93 0.05 25)',  fg:'oklch(0.48 0.14 25)' },
];

function Swatch({ name, val, desc }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'56px 1fr', gap:14, alignItems:'center'}}>
      <div style={{
        width:56, height:56, background:val, borderRadius:10,
        boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)',
      }}/>
      <div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--ink)'}}>{name}</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)'}}>{val}</div>
        <div style={{fontSize:11.5, color:'var(--ink-2)', marginTop:2}}>{desc}</div>
      </div>
    </div>
  );
}

function DSBlock({ title, eyebrow, children, span = 12 }) {
  return (
    <section style={{gridColumn:`span ${span}`}}>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:10.5, letterSpacing:'0.08em',
        textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6,
      }}>{eyebrow}</div>
      <h3 style={{
        margin:'0 0 16px', fontWeight:600, fontSize:18, letterSpacing:'-0.01em',
        color:'var(--ink)',
      }}>{title}</h3>
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--line)',
        borderRadius:14, padding:24,
      }}>
        {children}
      </div>
    </section>
  );
}

function DesignSystem() {
  return (
    <div style={{
      width:'100%', height:'100%', overflowY:'auto', overflowX:'hidden',
      background:'var(--bg)', color:'var(--ink)',
      fontFamily:'var(--font-ui)',
    }}>
      {/* Header */}
      <header style={{
        padding:'40px 48px 24px', borderBottom:'1px solid var(--line)',
        display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'flex-end',
      }}>
        <div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.08em',
            textTransform:'uppercase', color:'var(--ink-3)', marginBottom:8,
          }}>plan-b · sistema de diseño v0.1</div>
          <h1 style={{
            margin:0, fontWeight:600, fontSize:38, letterSpacing:'-0.022em',
            lineHeight:1.05,
          }}>
            Una sola dirección.<br/>
            <span style={{color:'var(--ink-3)'}}>Apricot Soft.</span>
          </h1>
          <p style={{
            marginTop:10, fontSize:14, color:'var(--ink-2)',
            maxWidth:'58ch', lineHeight:1.55,
          }}>
            Producto cálido, denso, papel-cremoso. Inspirado en herramientas para alumnos
            (Notion, Linear) pero menos frío. Sans serio + mono para datos. Acento naranja
            quemado, usado con escasez. Nada editorial, nada flat-genérico.
          </p>
        </div>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
          textAlign:'right', lineHeight:1.7,
        }}>
          <div>tipos · Geist + IBM Plex Mono</div>
          <div>radii · 8 / 12 / 18 / 999</div>
          <div>shadow · rgba(120,40,10,0.05)</div>
          <div>densidad · 14px base</div>
        </div>
      </header>

      {/* Grilla principal */}
      <div style={{
        padding:'32px 48px 48px',
        display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:24,
      }}>
        {/* PRINCIPIOS */}
        <DSBlock eyebrow="01 · Principios" title="Cómo decidimos" span={12}>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20,
          }}>
            {[
              ['Densidad útil', 'Información antes que aire. Si una pantalla no le ahorra clicks al alumno, sobra.'],
              ['Datos verificables', 'Mostramos cuántos votaron, no solo el promedio. La confianza viene del N.'],
              ['Anonimato hacia afuera', 'El alumno escribe con su cuenta pero las reseñas son anónimas. Siempre.'],
              ['Cálido pero serio', 'Es producto, no decorado. Cero gradientes inútiles, cero ilustraciones genéricas.'],
            ].map(([t, d]) => (
              <div key={t}>
                <div style={{
                  fontWeight:600, fontSize:13.5, marginBottom:6,
                  display:'flex', gap:8, alignItems:'baseline',
                }}>
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
                  }}>·</span>
                  {t}
                </div>
                <div style={{fontSize:12.5, color:'var(--ink-2)', lineHeight:1.55}}>{d}</div>
              </div>
            ))}
          </div>
        </DSBlock>

        {/* COLOR */}
        <DSBlock eyebrow="02 · Color" title="Paleta base" span={8}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
            {DS_COLORS.map(g => (
              <div key={g.group}>
                <div style={{
                  fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
                  letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12,
                }}>{g.group}</div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {g.items.map(c => <Swatch key={c.name} {...c}/>)}
                </div>
              </div>
            ))}
          </div>
        </DSBlock>

        <DSBlock eyebrow="02b · Color" title="Estados de materia" span={4}>
          <div style={{
            fontSize:12, color:'var(--ink-2)', marginBottom:14, lineHeight:1.5,
          }}>
            Cada estado tiene un par bg/fg construido en oklch para mantener contraste consistente.
            Se usan como pills, no como fondos grandes.
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {DS_STATES.map(s => (
              <div key={s.code} style={{
                display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12,
                alignItems:'center',
              }}>
                <span style={{
                  background:s.bg, color:s.fg, fontSize:10.5, fontWeight:600,
                  padding:'3px 9px', borderRadius:999, letterSpacing:'0.04em',
                  fontFamily:'var(--font-mono)',
                }}>{s.code}</span>
                <span style={{fontSize:12.5}}>{s.label}</span>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                }}>{s.bg.match(/\d+\.\d+/)?.[0]}h</span>
              </div>
            ))}
          </div>
        </DSBlock>

        {/* TIPOGRAFÍA */}
        <DSBlock eyebrow="03 · Tipografía" title="Geist + IBM Plex Mono" span={12}>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:32}}>
            <div>
              <div style={{
                fontFamily:'Geist, sans-serif', fontSize:48, fontWeight:600,
                letterSpacing:'-0.025em', lineHeight:1.05, color:'var(--ink)',
              }}>
                Tu cuatrimestre,<br/>en una pantalla.
              </div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)',
                marginTop:8, letterSpacing:'0.04em',
              }}>
                display · 48 / 600 / -0.025em / 1.05
              </div>

              <div style={{height:1, background:'var(--line)', margin:'24px 0'}}/>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
                {[
                  ['H1', 'Plan de estudios', '32 / 600 / -0.022em'],
                  ['H2', 'Selección 5/6', '18 / 600 / -0.01em'],
                  ['H3', 'Ingeniería de Software II', '14 / 500 / 0'],
                  ['Body', 'Esta materia tiene 3 comisiones disponibles para 2026·1c.', '13.5 / 400 / 1.5'],
                  ['Meta', 'Brandt · 24 reseñas · 4.1★', '11.5 / 400 / ink-3'],
                  ['Mono', 'ISW302 · 96h · 12%', '11 mono / 0.04em'],
                ].map(([k, sample, spec]) => (
                  <div key={k}>
                    <div style={{
                      fontFamily: k==='Mono' ? 'var(--font-mono)' : 'var(--font-ui)',
                      fontSize: k==='H1' ? 32 : k==='H2' ? 18 : k==='H3' ? 14 : k==='Mono' ? 11 : k==='Meta' ? 11.5 : 13.5,
                      fontWeight: k.startsWith('H') ? 600 : 400,
                      letterSpacing: k==='H1' ? '-0.022em' : k==='Mono' ? '0.04em' : 0,
                      color: k==='Meta' ? 'var(--ink-3)' : 'var(--ink)',
                      marginBottom:4,
                    }}>{sample}</div>
                    <div style={{
                      fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-3)',
                    }}>{k.toLowerCase()} · {spec}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background:'var(--bg)', borderRadius:12, padding:18,
              fontSize:12, color:'var(--ink-2)', lineHeight:1.65,
            }}>
              <div style={{fontWeight:600, color:'var(--ink)', marginBottom:8}}>
                Reglas de uso
              </div>
              <ul style={{margin:0, paddingLeft:18, display:'flex', flexDirection:'column', gap:6}}>
                <li>Geist para todo lo que sea prosa, UI, headings.</li>
                <li>IBM Plex Mono solo para <em>datos</em>: códigos, números, %, horas, codes.</li>
                <li>Mono nunca para frases. Es etiqueta, no narrativa.</li>
                <li>Tracking ajustado en displays grandes (-0.022 a -0.025em).</li>
                <li>Líneas largas: max 65ch en prosa larga.</li>
              </ul>
            </div>
          </div>
        </DSBlock>

        {/* COMPONENTES */}
        <DSBlock eyebrow="04 · Componentes" title="Botones" span={6}>
          <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:18}}>
            <button className="btn primary">Confirmar selección</button>
            <button className="btn accent">Crear reseña</button>
            <button className="btn">Comparar</button>
            <button className="btn ghost">Cancelar</button>
          </div>
          <div style={{
            fontSize:12, color:'var(--ink-2)', lineHeight:1.6,
          }}>
            <b style={{color:'var(--ink)'}}>primary</b> (tinta) — acción definitiva, irreversible o de cierre.<br/>
            <b style={{color:'var(--ink)'}}>accent</b> (apricot) — acción de creación o aporte (reseñar, sumar materia).<br/>
            <b style={{color:'var(--ink)'}}>default</b> (papel) — acciones secundarias, reversibles.<br/>
            <b style={{color:'var(--ink)'}}>ghost</b> — terciarias, navegación, cerrar.
          </div>
        </DSBlock>

        <DSBlock eyebrow="04b · Componentes" title="Pills, mini-pills y badges" span={6}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:14}}>
            <span className="mp code">ISW302</span>
            <span className="mp">96h</span>
            <span className="mp">Brandt</span>
            <span className="mp diff-hi"><span className="dot"/>dif 4</span>
            <span className="mp diff-mid"><span className="dot"/>dif 3</span>
            <span className="mp diff-lo"><span className="dot"/>dif 2</span>
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:14}}>
            {DS_STATES.slice(0,4).map(s => (
              <span key={s.code} style={{
                background:s.bg, color:s.fg, fontSize:10.5, fontWeight:600,
                padding:'3px 9px', borderRadius:999, letterSpacing:'0.04em',
              }}>{s.label}</span>
            ))}
          </div>
          <div style={{fontSize:12, color:'var(--ink-2)', lineHeight:1.6}}>
            <b style={{color:'var(--ink)'}}>mp</b> (mini-pill) para metadata densa en filas. <br/>
            <b style={{color:'var(--ink)'}}>diff-hi/mid/lo</b> codifican dificultad. <br/>
            <b style={{color:'var(--ink)'}}>code</b> usa mono para identificadores.
          </div>
        </DSBlock>

        <DSBlock eyebrow="04c · Componentes" title="Cards y módulos" span={7}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <div className="card">
              <div className="h2">Esta semana <small>3 cursando</small></div>
              <div style={{fontSize:12, color:'var(--ink-2)', marginTop:4, lineHeight:1.5}}>
                Card neutra · padding 14/16 · radius 14 · sombra suave de papel.
              </div>
            </div>
            <div className="card" style={{background:'var(--bg-elev)'}}>
              <div className="h2">Stat <small>destacado</small></div>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:24, fontWeight:600,
                letterSpacing:'-0.02em', marginTop:6, color:'var(--ink)',
              }}>52<small style={{fontSize:12, color:'var(--ink-3)', marginLeft:4, fontFamily:'var(--font-ui)'}}>%</small></div>
              <div style={{fontSize:11, color:'var(--ink-3)', marginTop:4}}>aprobación esp.</div>
            </div>
          </div>
          <div className="placeholder" style={{marginTop:14}}>
            <b>Placeholder pattern</b>
            Para áreas sin contenido real durante el diseño. Hatch diagonal sutil + label en negrita.
            Nunca se usa en producción.
          </div>
        </DSBlock>

        <DSBlock eyebrow="04d · Componentes" title="Inputs y campos" span={5}>
          <div className="field">
            <label>Email institucional</label>
            <input defaultValue="lucia.mansilla@unsta.edu.ar"/>
          </div>
          <div className="field">
            <label>Carrera</label>
            <select defaultValue="sis">
              <option value="sis">Ingeniería en Sistemas · UNSTA</option>
              <option value="ind">Ingeniería Industrial · UNSTA</option>
            </select>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Comentario libre</label>
            <textarea rows="2" defaultValue="Cursé esta materia en 2024·2c."/>
          </div>
        </DSBlock>

        {/* PATRONES */}
        <DSBlock eyebrow="05 · Patrones" title="Topbar + sidebar" span={12}>
          <div style={{
            border:'1px solid var(--line)', borderRadius:12, overflow:'hidden',
            background:'var(--bg)',
          }}>
            {/* topbar */}
            <div style={{
              padding:'12px 18px', display:'flex', gap:14, alignItems:'center',
              borderBottom:'1px solid var(--line)',
            }}>
              <span style={{fontWeight:600, fontSize:14}}>plan-b<span style={{
                display:'inline-block', width:5, height:5, background:'var(--accent)',
                borderRadius:'50%', marginLeft:2, transform:'translateY(-3px)',
                verticalAlign:'middle',
              }}/></span>
              <span className="mp"><span className="dot" style={{background:'var(--accent)'}}/>2026·1c · borrador</span>
              <span style={{flex:1}}/>
              <button className="btn">Comparar escenarios</button>
              <button className="btn primary">Confirmar</button>
            </div>
            {/* layout */}
            <div style={{display:'grid', gridTemplateColumns:'180px 1fr', minHeight:140}}>
              <div style={{
                borderRight:'1px solid var(--line)', padding:14,
                display:'flex', flexDirection:'column', gap:2, fontSize:12,
              }}>
                <div className="eyebrow" style={{padding:'4px 8px 6px'}}>NAVEGACIÓN</div>
                {['Inicio', 'Plan', 'Simulador', 'Materias', 'Docentes', 'Reseñas'].map((n,i)=>(
                  <div key={n} style={{
                    padding:'6px 10px', borderRadius:8,
                    background: i===2 ? 'var(--bg-card)' : 'transparent',
                    boxShadow: i===2 ? 'var(--shadow-card)' : 'none',
                    color: i===2 ? 'var(--ink)' : 'var(--ink-2)',
                  }}>{n}</div>
                ))}
              </div>
              <div style={{padding:18, color:'var(--ink-3)', fontSize:12}}>
                <div className="eyebrow" style={{marginBottom:8}}>CONTENIDO</div>
                Contenido principal. La densidad la define la pantalla.
              </div>
            </div>
          </div>
          <div style={{
            marginTop:14, fontSize:12, color:'var(--ink-2)', lineHeight:1.6,
          }}>
            Topbar fija · contexto del cuatrimestre actual + acciones globales. <br/>
            Sidebar de 240px · navegación primaria. Item activo = card papel con sombra suave (no
            barra lateral, no fondo color).
          </div>
        </DSBlock>

        {/* DON'Ts */}
        <DSBlock eyebrow="06 · No" title="Cosas que no hacemos" span={12}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
            {[
              ['Editorial / revista', 'Serif gigantes, columnas, eyebrows en versalitas — parece sitio de noticias.'],
              ['Gradientes decorativos', 'Hero glows, cards con gradient-border. Si no aporta a leer datos, sobra.'],
              ['Iconografía genérica', 'Sin iconos lucide random "para llenar". Solo cuando reemplazan una palabra.'],
              ['Emoji', 'Nunca como ornamento. Solo si el alumno lo escribió en una reseña.'],
              ['Inter / Roboto / Arial', 'Geist es la voz. No mezclamos sans con sans para "variar".'],
              ['Color como decoración', 'El acento se gana. Si todo es naranja, nada es importante.'],
            ].map(([t, d]) => (
              <div key={t} style={{
                background:'var(--bg)', borderRadius:10, padding:'12px 14px',
                borderLeft:'2px solid var(--bad-fg, var(--accent-ink))',
              }}>
                <div style={{fontWeight:600, fontSize:13, marginBottom:4, color:'var(--ink)'}}>
                  ✗ {t}
                </div>
                <div style={{fontSize:11.5, color:'var(--ink-2)', lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
        </DSBlock>
      </div>
    </div>
  );
}

window.DesignSystem = DesignSystem;
