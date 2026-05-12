// Auth — 4 views con split asimétrico. La venta NO está acá (vive en Landing).
// Cada panel izquierdo muestra producto real, no marketing genérico:
//   01 Signup → "carnet" anónimo en construcción que reacciona al form
//   02 Login  → última actividad de la cuenta (recordatorio concreto de por qué volvés)
//   03 Forgot → diagrama de 3 pasos del flujo de recuperación
//   04 Sent   → mismo diagrama, paso 2 encendido + ticker del link
//
// Contrato compartido (idéntico en las 4):
//   - Fondo var(--bg), full-viewport.
//   - Grid 1.05fr / 1fr (panel izq decorativo / form), gap 0.
//   - Header en cada lado: logo (form) o eyebrow numerado (panel).
//   - Form column ancho 480, padding 56/64.
//   - H2 36 / sub 14 / cuerpo / CTA accent / foot.

function CanvasLogo({ size = 26 }) {
  return (
    <div style={{display:'flex', alignItems:'baseline', gap:1, fontWeight:600, fontSize:size*0.62, letterSpacing:'-0.01em'}}>
      plan-b
      <span style={{
        width:size*0.22, height:size*0.22, background:'var(--accent)', borderRadius:'50%',
        display:'inline-block', transform:'translateY(-3px)', marginLeft:2,
      }}/>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

// ── Shell compartida ────────────────────────────────────────────
function AuthShell({ stepCode, stepName, leftPanel, title, sub, children, foot }) {
  return (
    <div style={{
      width:'100%', minHeight:'100%',
      display:'grid', gridTemplateColumns:'1.05fr 1fr',
      background:'var(--bg)', color:'var(--ink)',
      fontFamily:'var(--font-ui)', fontSize:14,
    }}>
      {/* PANEL IZQUIERDO — decorativo pero específico */}
      <aside style={{
        background:'var(--bg-elev)',
        borderRight:'1px solid var(--line)',
        padding:'48px 56px',
        display:'flex', flexDirection:'column', gap:0,
        position:'relative', overflow:'hidden',
      }}>
        {/* eyebrow numerado, mismo lenguaje que features de landing */}
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent-ink)',
          letterSpacing:'0.1em', textTransform:'uppercase',
        }}>
          {stepCode} · <span style={{color:'var(--ink-3)'}}>{stepName}</span>
        </div>

        {/* el panel propio de cada view ocupa el resto */}
        <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', marginTop:32, marginBottom:32}}>
          {leftPanel}
        </div>

        {/* footer del panel — info del proyecto, no CTA */}
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-4)',
          letterSpacing:'0.06em', display:'flex', justifyContent:'space-between',
        }}>
          <span>plan-b · proyecto independiente</span>
          <span>no afiliado oficialmente con UNSTA</span>
        </div>
      </aside>

      {/* COLUMNA DERECHA — form */}
      <main style={{
        padding:'48px 56px',
        display:'flex', flexDirection:'column',
      }}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <CanvasLogo size={26}/>
          <span style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            letterSpacing:'0.06em', textTransform:'uppercase',
          }}>UNSTA · beta</span>
        </header>

        <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:480, width:'100%'}}>
          <h2 style={{
            fontFamily:'var(--font-display)', fontSize:36, fontWeight:600,
            letterSpacing:'-0.022em', lineHeight:1.05,
            margin:0, marginBottom:8,
          }}>{title}</h2>
          {sub && <p style={{
            color:'var(--ink-3)', fontSize:14.5, lineHeight:1.5,
            margin:0, marginBottom:28, maxWidth:'46ch',
          }}>{sub}</p>}
          {children}
        </div>

        <footer style={{
          fontSize:13, color:'var(--ink-3)',
          paddingTop:24, borderTop:'1px solid var(--line)',
        }}>{foot}</footer>
      </main>
    </div>
  );
}

// ── Helpers UI ──────────────────────────────────────────────────
function MonoLabel({ children, accent }) {
  return (
    <div style={{
      fontFamily:'var(--font-mono)', fontSize:10.5,
      color: accent ? 'var(--accent-ink)' : 'var(--ink-3)',
      letterSpacing:'0.1em', textTransform:'uppercase',
    }}>{children}</div>
  );
}

// ════════════════════════════════════════════════════════════════
// 01 · SIGNUP — Panel: "carnet" anónimo en construcción
// ════════════════════════════════════════════════════════════════
function CarnetPreview() {
  // Carnet vivo del usuario que se está creando. Es lo que verán los demás
  // (anónimo) cuando el usuario reseñe. Se conecta al form vía estado.
  const name = 'Lucía Mansilla';
  const email = 'lucia.mansilla@unsta.edu.ar';
  const init = name.split(' ').map(p=>p[0]).join('').slice(0,2);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:18, maxWidth:420}}>
      <div>
        <h3 style={{
          fontFamily:'var(--font-display)', fontSize:22, fontWeight:600,
          letterSpacing:'-0.018em', margin:0, marginBottom:6,
        }}>Tu identidad, en dos formas.</h3>
        <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>
          Adentro del producto sos vos. Hacia el resto de UNSTA, sos anónimo.
        </p>
      </div>

      {/* CARNET PRIVADO — visible solo a vos */}
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--line)',
        borderRadius:14, padding:'18px 20px',
        boxShadow:'var(--shadow-card)',
        position:'relative',
      }}>
        <div style={{
          position:'absolute', top:14, right:14,
          fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--ink-3)',
          letterSpacing:'0.08em', textTransform:'uppercase',
        }}>privado · solo vos</div>

        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <div style={{
            width:46, height:46, borderRadius:'50%',
            background:'var(--accent-soft)', color:'var(--accent-ink)',
            display:'grid', placeItems:'center',
            fontFamily:'var(--font-display)', fontSize:18, fontWeight:600,
          }}>{init}</div>
          <div>
            <div style={{fontSize:15, fontWeight:500, color:'var(--ink)'}}>{name}</div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--ink-3)',
              marginTop:2,
            }}>{email}</div>
          </div>
        </div>

        <div style={{
          marginTop:14, paddingTop:12, borderTop:'1px solid var(--line)',
          display:'flex', gap:8, flexWrap:'wrap',
        }}>
          <span className="mp" style={{background:'oklch(0.94 0.05 145)', color:'oklch(0.42 0.09 145)'}}>
            <span className="dot" style={{background:'oklch(0.55 0.15 145)'}}/>
            email verificado
          </span>
          <span className="mp">Sistemas · 4° año</span>
          <span className="mp code">UNSTA</span>
        </div>
      </div>

      {/* Conector visual entre las dos vistas */}
      <div style={{
        display:'flex', alignItems:'center', gap:10, fontSize:11.5,
        color:'var(--ink-3)', fontFamily:'var(--font-mono)',
        letterSpacing:'0.04em',
      }}>
        <span style={{flex:1, height:1, background:'var(--line)'}}/>
        <span>al reseñar te ven así →</span>
        <span style={{flex:1, height:1, background:'var(--line)'}}/>
      </div>

      {/* CARNET PÚBLICO — anónimo */}
      <div style={{
        background:'var(--ink)', color:'var(--bg)',
        borderRadius:14, padding:'18px 20px',
        position:'relative',
      }}>
        <div style={{
          position:'absolute', top:14, right:14,
          fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--ink-4)',
          letterSpacing:'0.08em', textTransform:'uppercase',
        }}>público · anónimo</div>

        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <div style={{
            width:46, height:46, borderRadius:'50%',
            background:'#2a1d12', color:'var(--accent)',
            display:'grid', placeItems:'center',
            fontFamily:'var(--font-mono)', fontSize:20, fontWeight:600,
          }}>?</div>
          <div>
            <div style={{fontSize:15, fontWeight:500}}>Anónimo</div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--ink-4)',
              marginTop:2,
            }}>Sistemas · 4° año · cursó 2024·2c</div>
          </div>
        </div>

        <div style={{
          marginTop:14, paddingTop:12, borderTop:'1px solid #1a110a',
          fontSize:12.5, color:'#d8c9bc', lineHeight:1.5,
          fontStyle:'italic',
        }}>
          "ISW302 con Brandt: exigente pero el TP final te enseña más que cualquier teórica…"
        </div>
      </div>
    </div>
  );
}

function SignupView() {
  return (
    <AuthShell
      stepCode="01"
      stepName="Crear cuenta"
      leftPanel={<CarnetPreview/>}
      title="Empezá en 30 segundos"
      sub="Validamos que seas alumno con tu email institucional. Después, lo que escribas es anónimo."
      foot={<>¿Ya tenés cuenta? <button type="button" className="linkbtn">Ingresá</button></>}
    >
      <form onSubmit={e=>e.preventDefault()}>
        <button type="button" className="btn-google" style={{marginBottom:18}}>
          <GoogleIcon/>
          Continuar con Google
        </button>

        <div className="auth-divider" style={{marginBottom:20}}>o con email</div>

        <div className="field" style={{marginBottom:14}}>
          <label>¿Cómo te llamás?</label>
          <input defaultValue="Lucía Mansilla"/>
        </div>
        <div className="field" style={{marginBottom:14}}>
          <label>Email institucional</label>
          <input type="email" defaultValue="lucia.mansilla@unsta.edu.ar"/>
          <div className="email-hint" style={{marginTop:6}}>
            <span className="dot"/>email UNSTA verificado
          </div>
        </div>
        <div className="field" style={{marginBottom:18}}>
          <label>Contraseña</label>
          <input type="password" defaultValue="••••••••" placeholder="Mínimo 6 caracteres"/>
        </div>

        <label className="checkbox-row" style={{marginBottom:20}}>
          <input type="checkbox" defaultChecked/>
          <span>
            Acepto los <a href="#" onClick={e=>e.preventDefault()}>términos</a> y
            entiendo que mis reseñas son anónimas pero verificadas.
          </span>
        </label>

        <button type="submit" className="btn accent"
          style={{justifyContent:'center', padding:'12px 18px', width:'100%'}}>
          Crear mi cuenta
        </button>
      </form>
    </AuthShell>
  );
}

// ════════════════════════════════════════════════════════════════
// 02 · LOGIN — Panel: última actividad de la cuenta
// ════════════════════════════════════════════════════════════════
function LastActivityPanel() {
  const items = [
    { t:'hace 4 días', body:'Reseñaste ISW302 con Brandt', meta:'4 ★ · publicada' },
    { t:'hace 1 semana', body:'Guardaste un borrador en Simulador', meta:'2026·1c · 5 materias' },
    { t:'hace 2 semanas', body:'Brandt respondió a tu reseña', meta:'INT302 · sin leer' },
  ];

  return (
    <div style={{display:'flex', flexDirection:'column', gap:18, maxWidth:420}}>
      <div>
        <h3 style={{
          fontFamily:'var(--font-display)', fontSize:22, fontWeight:600,
          letterSpacing:'-0.018em', margin:0, marginBottom:6,
        }}>Te dejaste cosas a medio.</h3>
        <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>
          Un repaso de lo último que hiciste, para que no arranques en frío.
        </p>
      </div>

      {/* stat row */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
        {[
          ['12', 'reseñas tuyas'],
          ['2',  'borradores'],
          ['3',  'sin leer'],
        ].map(([v,l], i) => (
          <div key={l} style={{
            background:'var(--bg-card)', border:'1px solid var(--line)',
            borderRadius:10, padding:'12px 14px',
          }}>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600,
              letterSpacing:'-0.02em', lineHeight:1,
              color: i===2 ? 'var(--accent-ink)' : 'var(--ink)',
            }}>{v}</div>
            <div style={{fontSize:10.5, color:'var(--ink-3)', marginTop:5}}>{l}</div>
          </div>
        ))}
      </div>

      {/* timeline */}
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--line)',
        borderRadius:14, padding:'16px 18px',
      }}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
          letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12,
          display:'flex', justifyContent:'space-between',
        }}>
          <span>Última actividad</span>
          <span>lucia.m@unsta.edu.ar</span>
        </div>
        <div style={{display:'flex', flexDirection:'column'}}>
          {items.map((it, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'74px 1fr', gap:14,
              padding:'10px 0',
              borderTop: i ? '1px solid var(--line)' : 'none',
              alignItems:'flex-start',
            }}>
              <div style={{
                fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
                letterSpacing:'0.04em', paddingTop:1,
              }}>{it.t}</div>
              <div>
                <div style={{fontSize:13, color:'var(--ink)', lineHeight:1.4}}>{it.body}</div>
                <div style={{
                  fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
                  marginTop:3, letterSpacing:'0.02em',
                }}>{it.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        fontSize:12, color:'var(--ink-3)', fontStyle:'italic',
        lineHeight:1.5,
      }}>
        Última sesión: 28 abr · Chrome · Tucumán
      </div>
    </div>
  );
}

function LoginView() {
  return (
    <AuthShell
      stepCode="02"
      stepName="Ingresar"
      leftPanel={<LastActivityPanel/>}
      title="Buenas de nuevo"
      sub="Ingresá con la cuenta que usaste para registrarte."
      foot={<>¿Sos nuevo? <button type="button" className="linkbtn">Creá tu cuenta</button></>}
    >
      <form onSubmit={e=>e.preventDefault()}>
        <button type="button" className="btn-google" style={{marginBottom:18}}>
          <GoogleIcon/>
          Continuar con Google
        </button>

        <div className="auth-divider" style={{marginBottom:20}}>o con email</div>

        <div className="field" style={{marginBottom:14}}>
          <label>Email</label>
          <input type="email" defaultValue="lucia.mansilla@unsta.edu.ar" autoComplete="email"/>
        </div>
        <div className="field" style={{marginBottom:6}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <label style={{margin:0}}>Contraseña</label>
            <button type="button" className="linkbtn" style={{fontSize:11.5}}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input type="password" defaultValue="••••••••" autoComplete="current-password"/>
        </div>

        <label className="checkbox-row" style={{marginTop:14, marginBottom:18}}>
          <input type="checkbox" defaultChecked/>
          <span>Mantenerme conectado en este dispositivo</span>
        </label>

        <button type="submit" className="btn accent"
          style={{justifyContent:'center', padding:'12px 18px', width:'100%'}}>
          Entrar
        </button>
      </form>
    </AuthShell>
  );
}

// ════════════════════════════════════════════════════════════════
// 03 / 04 · FORGOT — Panel: diagrama de 3 pasos del flujo
// ════════════════════════════════════════════════════════════════
function FlowSteps({ active }) {
  // active: 1, 2 o 3
  const steps = [
    { n:1, t:'Pedís el link', sub:'Ingresás tu email institucional', mono:'POST /reset' },
    { n:2, t:'Te llega el mail', sub:'Click en el link dentro de los 30 min', mono:'noreply@plan-b' },
    { n:3, t:'Cambiás la contraseña', sub:'Min 6 caracteres, en una sola pantalla', mono:'PATCH /password' },
  ];

  return (
    <div style={{display:'flex', flexDirection:'column', gap:18, maxWidth:420}}>
      <div>
        <h3 style={{
          fontFamily:'var(--font-display)', fontSize:22, fontWeight:600,
          letterSpacing:'-0.018em', margin:0, marginBottom:6,
        }}>Tres pasos. Cinco minutos.</h3>
        <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>
          {active === 2
            ? 'Vas por el segundo. Revisá tu mail y volvé acá.'
            : 'Te mandamos un link al mail con el que te registraste.'}
        </p>
      </div>

      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--line)',
        borderRadius:14, padding:'22px 22px',
        position:'relative',
      }}>
        {steps.map((s, i) => {
          const state = s.n < active ? 'done' : s.n === active ? 'now' : 'next';
          const dotBg =
            state === 'done' ? 'var(--accent-ink)' :
            state === 'now'  ? 'var(--accent)' : 'var(--line-2)';
          const dotFg =
            state === 'done' ? 'var(--bg-card)' :
            state === 'now'  ? 'var(--accent-ink)' : 'var(--ink-3)';
          const titleColor =
            state === 'next' ? 'var(--ink-3)' : 'var(--ink)';
          const lineNext = i < steps.length - 1;
          return (
            <div key={s.n} style={{
              display:'grid', gridTemplateColumns:'34px 1fr',
              gap:14, position:'relative',
              paddingBottom: lineNext ? 18 : 0,
            }}>
              {/* línea conectora */}
              {lineNext && (
                <div style={{
                  position:'absolute', left:16, top:32, bottom:-4, width:2,
                  background: state === 'done' ? 'var(--accent-ink)' : 'var(--line)',
                }}/>
              )}
              {/* dot */}
              <div style={{
                width:34, height:34, borderRadius:'50%',
                background:dotBg, color:dotFg,
                display:'grid', placeItems:'center',
                fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
                position:'relative', zIndex:1,
                outline: state === 'now' ? '4px solid oklch(0.92 0.07 55 / 0.4)' : 'none',
                outlineOffset: -1,
              }}>
                {state === 'done' ? '✓' : s.n}
              </div>
              <div style={{paddingTop:5}}>
                <div style={{
                  fontSize:14, fontWeight:500, color:titleColor,
                  lineHeight:1.3, marginBottom:3,
                  display:'flex', justifyContent:'space-between', alignItems:'baseline',
                }}>
                  <span>{s.t}</span>
                  {state === 'now' && <span style={{
                    fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--accent-ink)',
                    letterSpacing:'0.1em', textTransform:'uppercase',
                  }}>ahora</span>}
                </div>
                <div style={{fontSize:12.5, color:'var(--ink-3)', lineHeight:1.45, marginBottom:5}}>
                  {s.sub}
                </div>
                <div style={{
                  fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-4)',
                  letterSpacing:'0.04em',
                }}>{s.mono}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        fontSize:12, color:'var(--ink-3)', lineHeight:1.5,
        background:'var(--bg-card)', border:'1px dashed var(--line)',
        borderRadius:10, padding:'10px 14px',
      }}>
        <span style={{color:'var(--ink-2)'}}>Nota:</span> si te registraste con Google,
        no tenés contraseña que recuperar — entrá con el botón de Google.
      </div>
    </div>
  );
}

function ForgotView() {
  return (
    <AuthShell
      stepCode="03"
      stepName="Recuperar"
      leftPanel={<FlowSteps active={1}/>}
      title="Recuperar contraseña"
      sub="Te mandamos un link al mail con el que te registraste."
      foot={<button type="button" className="linkbtn">← Volver a ingresar</button>}
    >
      <form onSubmit={e=>e.preventDefault()}>
        <div className="field" style={{marginBottom:18}}>
          <label>Email</label>
          <input type="email" placeholder="lucia.mansilla@unsta.edu.ar" autoComplete="email"/>
          <div style={{
            fontSize:11.5, color:'var(--ink-3)', marginTop:6, lineHeight:1.4,
          }}>
            Tiene que ser el email con el que te registraste.
          </div>
        </div>

        <button type="submit" className="btn accent"
          style={{justifyContent:'center', padding:'12px 18px', width:'100%', marginBottom:14}}>
          Mandame el link
        </button>

        <div style={{
          fontSize:12, color:'var(--ink-3)', textAlign:'center',
        }}>
          ¿No te registraste todavía?{' '}
          <button type="button" className="linkbtn">Crear cuenta</button>
        </div>
      </form>
    </AuthShell>
  );
}

function ForgotSentView() {
  return (
    <AuthShell
      stepCode="04"
      stepName="Mail enviado"
      leftPanel={<FlowSteps active={2}/>}
      title="Revisá tu casilla"
      sub={<>Te mandamos el link a <span style={{
        fontFamily:'var(--font-mono)', fontSize:13.5, color:'var(--ink)',
      }}>lucia.mansilla@unsta.edu.ar</span>.</>}
      foot={<button type="button" className="linkbtn">← Volver a ingresar</button>}
    >
      {/* Estado de check */}
      <div style={{
        display:'flex', alignItems:'flex-start', gap:14,
        padding:'16px 18px', marginBottom:18,
        background:'var(--accent-soft)',
        borderRadius:'var(--radius-md)',
      }}>
        <div style={{
          width:32, height:32, borderRadius:'50%',
          background:'var(--accent-ink)', color:'var(--accent-soft)',
          display:'grid', placeItems:'center', flexShrink:0,
          fontSize:15, fontWeight:600,
        }}>✓</div>
        <div>
          <div style={{fontSize:14, fontWeight:500, color:'var(--accent-ink)', marginBottom:3}}>
            Link enviado
          </div>
          <div style={{fontSize:12.5, color:'var(--accent-ink)', opacity:0.85, lineHeight:1.45}}>
            Si no aparece en 2 minutos, mirá la carpeta de spam.
          </div>
        </div>
      </div>

      {/* Ticker del link */}
      <div style={{
        background:'var(--bg)', border:'1px solid var(--line)',
        borderRadius:'var(--radius-md)',
        padding:'14px 16px', marginBottom:18,
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
            letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4,
          }}>El link expira en</div>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:24, fontWeight:600,
            letterSpacing:'-0.02em', color:'var(--ink)', lineHeight:1,
          }}>29:42</div>
        </div>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)',
          letterSpacing:'0.04em', textAlign:'right',
        }}>
          enviado<br/>
          <span style={{color:'var(--ink)'}}>14:22 · 02 may</span>
        </div>
      </div>

      <div style={{
        fontSize:13, color:'var(--ink-2)', lineHeight:1.55,
        marginBottom:18,
      }}>
        ¿No lo ves? Podés{' '}
        <button type="button" className="linkbtn">mandarlo de nuevo</button>{' '}
        o <button type="button" className="linkbtn">cambiar el mail</button>.
      </div>

      <button type="button" className="btn ghost"
        style={{justifyContent:'center', padding:'12px 18px', width:'100%'}}>
        Abrir Gmail →
      </button>
    </AuthShell>
  );
}

window.SignupView     = SignupView;
window.LoginView      = LoginView;
window.ForgotView     = ForgotView;
window.ForgotSentView = ForgotSentView;

// ════════════════════════════════════════════════════════════════
// Estados de error de auth (variantes con error inline)
// ════════════════════════════════════════════════════════════════

function AuthErrorBanner({ title, body }) {
  return (
    <div style={{
      display:'flex', gap:10, alignItems:'flex-start',
      padding:'10px 12px',
      background:'oklch(0.95 0.04 30)',
      border:'1px solid oklch(0.78 0.12 30)',
      borderRadius:8,
      marginBottom:18,
    }}>
      <span aria-hidden="true" style={{
        flexShrink:0, marginTop:1,
        width:18, height:18, borderRadius:'50%',
        background:'oklch(0.55 0.16 30)', color:'white',
        display:'grid', placeItems:'center',
        fontSize:11, fontWeight:700,
        fontFamily:'var(--font-mono)',
      }}>!</span>
      <div style={{flex:1, minWidth:0}}>
        <div style={{
          fontSize:13, fontWeight:600,
          color:'oklch(0.35 0.14 30)', lineHeight:1.35,
        }}>{title}</div>
        {body && <div style={{
          fontSize:12, color:'oklch(0.42 0.10 30)',
          marginTop:2, lineHeight:1.45,
        }}>{body}</div>}
      </div>
    </div>
  );
}

function LoginErrorView() {
  return (
    <AuthShell
      stepCode="02"
      stepName="Ingresar"
      leftPanel={<LastActivityPanel/>}
      title="Buenas de nuevo"
      sub="Ingresá con la cuenta que usaste para registrarte."
      foot={<>¿Sos nuevo? <button type="button" className="linkbtn">Creá tu cuenta</button></>}
    >
      <form onSubmit={e=>e.preventDefault()}>
        <AuthErrorBanner
          title="Email o contraseña incorrectos"
          body="Revisá los datos. Si los olvidaste, te mandamos un link en 30 segundos."
        />

        <div className="field" style={{marginBottom:14}}>
          <label>Email</label>
          <input type="email" defaultValue="lucia.mansilla@unsta.edu.ar" autoComplete="email"
            style={{borderColor:'oklch(0.78 0.12 30)'}}/>
        </div>
        <div className="field" style={{marginBottom:6}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <label style={{margin:0}}>Contraseña</label>
            <button type="button" className="linkbtn" style={{fontSize:11.5}}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input type="password" defaultValue="••••••••" autoComplete="current-password"
            style={{borderColor:'oklch(0.78 0.12 30)'}}/>
          <div style={{
            marginTop:6, fontSize:11.5,
            color:'oklch(0.45 0.14 30)', display:'flex', alignItems:'center', gap:6,
          }}>
            <span style={{
              width:12, height:12, borderRadius:'50%',
              background:'oklch(0.78 0.12 30)', color:'white',
              display:'grid', placeItems:'center', fontSize:9, fontWeight:700,
              fontFamily:'var(--font-mono)',
            }}>!</span>
            Falló el último intento (hace unos segundos)
          </div>
        </div>

        <label className="checkbox-row" style={{marginTop:14, marginBottom:18}}>
          <input type="checkbox" defaultChecked/>
          <span>Mantenerme conectado en este dispositivo</span>
        </label>

        <button type="submit" className="btn accent"
          style={{justifyContent:'center', padding:'12px 18px', width:'100%'}}>
          Entrar
        </button>
      </form>
    </AuthShell>
  );
}

function SignupErrorView() {
  return (
    <AuthShell
      stepCode="01"
      stepName="Crear cuenta"
      leftPanel={<CarnetPreview/>}
      title="Empezá en 30 segundos"
      sub="Validamos que seas alumno con tu email institucional. Después, lo que escribas es anónimo."
      foot={<>¿Ya tenés cuenta? <button type="button" className="linkbtn">Ingresá</button></>}
    >
      <form onSubmit={e=>e.preventDefault()}>
        <AuthErrorBanner
          title="Ya hay una cuenta con ese email"
          body="Ingresá con tu contraseña existente o recuperala si no la recordás."
        />

        <div className="field" style={{marginBottom:14}}>
          <label>¿Cómo te llamás?</label>
          <input defaultValue="Lucía Mansilla"/>
        </div>
        <div className="field" style={{marginBottom:14}}>
          <label>Email institucional</label>
          <input type="email" defaultValue="lucia.mansilla@unsta.edu.ar"
            style={{borderColor:'oklch(0.78 0.12 30)'}}/>
          <div style={{
            marginTop:6, fontSize:11.5,
            color:'oklch(0.45 0.14 30)',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span>Esta cuenta ya existe</span>
            <span style={{color:'var(--ink-3)'}}>·</span>
            <button type="button" className="linkbtn" style={{fontSize:11.5}}>
              Ingresar con esa cuenta
            </button>
            <span style={{color:'var(--ink-3)'}}>·</span>
            <button type="button" className="linkbtn" style={{fontSize:11.5}}>
              Recuperar contraseña
            </button>
          </div>
        </div>
        <div className="field" style={{marginBottom:18}}>
          <label>Contraseña</label>
          <input type="password" defaultValue="••" placeholder="Mínimo 6 caracteres"
            style={{borderColor:'oklch(0.78 0.12 30)'}}/>
          <div style={{
            marginTop:6, fontSize:11.5,
            color:'oklch(0.45 0.14 30)',
          }}>
            Muy corta — usá al menos 6 caracteres
          </div>
        </div>

        <label className="checkbox-row" style={{marginBottom:20}}>
          <input type="checkbox" defaultChecked/>
          <span>
            Acepto los <a href="#" onClick={e=>e.preventDefault()}>términos</a> y
            entiendo que mis reseñas son anónimas pero verificadas.
          </span>
        </label>

        <button type="submit" className="btn accent"
          style={{justifyContent:'center', padding:'12px 18px', width:'100%'}}>
          Crear mi cuenta
        </button>
      </form>
    </AuthShell>
  );
}

window.LoginErrorView  = LoginErrorView;
window.SignupErrorView = SignupErrorView;
