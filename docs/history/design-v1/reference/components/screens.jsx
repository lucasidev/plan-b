// Auth + Onboarding + Home + listas

// ───────────────────────────────────────────────────────
// Auth — registro / login
// ───────────────────────────────────────────────────────
function AuthView({ onAuth }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accept, setAccept] = useState(false);

  const isInst = email.toLowerCase().endsWith('@unsta.edu.ar');
  const hasAt = email.includes('@');
  const showHint = email.length > 3 && hasAt;

  const canSubmit = mode === 'signup'
    ? (isInst && password.length >= 6 && name.trim().length > 1 && accept)
    : (hasAt && password.length >= 6);

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'signup') onAuth({ name: name.trim() || 'Lucía Mansilla', email, isNew: true });
    else onAuth({ name: 'Lucía Mansilla', email, isNew: false });
  };

  return (
    <div className="auth" data-screen-label="auth">
      <div className="auth-side">
        <div>
          <Logo size={28}/>
          <h1 style={{marginTop:64}}>
            Antes de inscribirte,<br/>
            mirá <em>quiénes ya pasaron</em><br/>
            por esa materia.
          </h1>
          <p>
            plan-b es la app donde alumnos de UNSTA simulan su cuatrimestre,
            comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros.
          </p>
        </div>
        <div className="auth-quote">
          "Iba a anotarme en INT302 con el primero que tenía horario libre.
          Acá vi que había una comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."
          <div className="who">— Anónimo · 4° año Sistemas</div>
        </div>
        <div style={{display:'flex',gap:24,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--ink-3)',letterSpacing:'0.04em'}}>
          <div><b style={{color:'var(--ink)'}}>340</b> alumnos verificados</div>
          <div><b style={{color:'var(--ink)'}}>1.2k</b> reseñas</div>
          <div><b style={{color:'var(--ink)'}}>3</b> carreras de UNSTA</div>
        </div>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <div className="auth-tabs" role="tablist">
          <button type="button" data-active={mode==='signup'} onClick={()=>setMode('signup')}>Crear cuenta</button>
          <button type="button" data-active={mode==='login'} onClick={()=>setMode('login')}>Ingresar</button>
        </div>

        <h2>{mode==='signup' ? 'Empezá en 30 segundos' : 'Buenas de nuevo'}</h2>
        <p className="auth-sub">
          {mode==='signup'
            ? 'Usá tu email institucional o Google. Validamos que seas de UNSTA antes de mostrarte reseñas.'
            : 'Ingresá con la cuenta que usaste para registrarte.'}
        </p>

        <button type="button" className="btn-google">
          <GoogleIcon/>
          Continuar con Google
        </button>

        <div className="auth-divider">o con email</div>

        {mode==='signup' && (
          <div className="field" style={{marginBottom:14}}>
            <label>¿Cómo te llamás?</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Lucía Mansilla" autoComplete="name"/>
          </div>
        )}
        <div className="field" style={{marginBottom:14}}>
          <label>Email institucional</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="lucia.mansilla@unsta.edu.ar" autoComplete="email"/>
          {showHint && (
            isInst
              ? <div className="email-hint"><span className="dot"/>Email UNSTA verificado</div>
              : <div className="email-hint"><span className="dot" data-tone="warn"/>Tiene que terminar en <b style={{color:'var(--ink-2)'}}>@unsta.edu.ar</b></div>
          )}
        </div>
        <div className="field" style={{marginBottom:18}}>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete={mode==='signup' ? 'new-password' : 'current-password'}/>
        </div>

        {mode==='signup' && (
          <label className="checkbox-row" style={{marginBottom:18}}>
            <input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)}/>
            <span>
              Acepto los <a href="#" onClick={e=>e.preventDefault()}>términos</a>,
              las <a href="#" onClick={e=>e.preventDefault()}>normas de comunidad</a> y entiendo
              que mis reseñas son anónimas pero verificadas.
            </span>
          </label>
        )}

        <button type="submit" className="btn accent" disabled={!canSubmit}
          style={{justifyContent:'center', padding:'12px 18px', opacity: canSubmit?1:0.5}}>
          {mode==='signup' ? 'Crear mi cuenta' : 'Entrar'}
        </button>

        {mode==='login' && (
          <div className="auth-foot">
            <button type="button" className="linkbtn">¿Olvidaste tu contraseña?</button>
          </div>
        )}

        <div className="auth-foot">
          {mode==='signup'
            ? <>¿Ya tenés cuenta? <button type="button" className="linkbtn" onClick={()=>setMode('login')}>Ingresá</button></>
            : <>¿Sos nuevo? <button type="button" className="linkbtn" onClick={()=>setMode('signup')}>Creá tu cuenta</button></>}
        </div>

        <p className="legal">
          Al continuar entendés que plan-b no está afiliada oficialmente con UNSTA. Tu email
          institucional se usa solo para verificar que sos alumno; nunca aparece en tus reseñas.
        </p>
      </form>
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

// ───────────────────────────────────────────────────────
// Onboarding — copy cálido (vos/che), 3 pasos
// ───────────────────────────────────────────────────────
function OnboardingView({ user, onFinish }) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(3);
  const [career, setCareer] = useState('Lic. en Sistemas');
  const [method, setMethod] = useState(null);
  const [parsed, setParsed] = useState(false);

  const steps = ['Carrera', 'Historial', 'Listo'];

  return (
    <div className="onboarding" data-screen-label="onboarding">
      <div className="onb-hero">
        <Logo size={28}/>
        <div>
          <div className="eyebrow" style={{marginBottom:14, color:'var(--accent-ink)'}}>
            Hola, {(user?.name || 'Lucía').split(' ')[0]} 👋
          </div>
          <h1 className="h-display" style={{fontSize:54, lineHeight:1.05, marginBottom:18}}>
            Contame dónde<br/>estás parado.<br/>
            <em>El resto lo armamos juntos.</em>
          </h1>
          <p className="lede" style={{fontSize:16,marginTop:24, maxWidth:'34ch'}}>
            Tres pasos. Te tomamos los datos básicos y te llevamos al simulador.
            Si querés, dejás el historial para después.
          </p>
        </div>
        <div style={{display:'flex',gap:18,fontSize:11.5,color:'var(--ink-3)',fontFamily:'var(--font-mono)',letterSpacing:'0.04em'}}>
          <div><b style={{color:'var(--ink)'}}>340</b> alumnos verificados</div>
          <div><b style={{color:'var(--ink)'}}>1.2k</b> reseñas</div>
          <div><b style={{color:'var(--ink)'}}>3</b> carreras de UNSTA</div>
        </div>
      </div>

      <div className="onb-form">
        <div className="onb-step">
          {steps.map((s,i)=>(
            <React.Fragment key={s}>
              {i>0 && <span style={{width:18,height:1,background:'var(--line)'}}/>}
              <span className="dot" data-on={i===step} data-done={i<step}/>
              <span style={{color: i<=step?'var(--ink)':'var(--ink-4)'}}>{s}</span>
            </React.Fragment>
          ))}
        </div>

        {step === 0 && <>
          <h2 className="h1" style={{fontSize:30}}>¿Qué cursás y en qué año vas?</h2>
          <p className="muted" style={{fontSize:13.5}}>
            De momento sólo soportamos UNSTA — Sede San Miguel de Tucumán. Otras universidades en camino.
          </p>

          <div className="field">
            <label>Universidad</label>
            <select defaultValue="UNSTA" disabled>
              <option>Universidad del Norte Sto. Tomás de Aquino (UNSTA)</option>
            </select>
          </div>

          <div className="field">
            <label>Carrera</label>
            <select value={career} onChange={e=>setCareer(e.target.value)}>
              <option>Lic. en Sistemas</option>
              <option>Lic. en Administración</option>
              <option>Abogacía</option>
              <option>Psicología</option>
            </select>
          </div>

          <div className="field">
            <label>Año actual</label>
            <div className="year-pills">
              {[1,2,3,4,5].map(y=>(
                <button key={y} className="year-pill"
                  data-active={year===y} onClick={()=>setYear(y)}>
                  {y}° año
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:'auto',paddingTop:24}}>
            <button className="btn accent" onClick={()=>setStep(1)}>Seguir →</button>
          </div>
        </>}

        {step === 1 && <>
          <h2 className="h1" style={{fontSize:30}}>Cargá tu historial</h2>
          <p className="muted" style={{fontSize:13.5,maxWidth:'42ch'}}>
            Esto es lo que hace que el simulador sea útil para vos. Elegí cómo lo querés cargar — no es obligatorio ahora.
          </p>

          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              { id:'pdf',    t:'Subir captura o PDF',     s:'Mandanos la analítica del SIU y la leemos. ~10 segundos.', tag:'recomendado',
                ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
              { id:'manual', t:'Cargar a mano',           s:'Marcás las materias que aprobaste, regularizaste y cursás. Lleva 5 min.', tag:null,
                ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="20 6 9 17 4 12"/></svg>},
              { id:'later',  t:'Lo cargo después',        s:'Empezás explorando. Podés cargarlo cuando quieras desde tu perfil.', tag:null,
                ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
            ].map(opt=>(
              <button key={opt.id} className="method-card"
                data-active={method===opt.id} onClick={()=>setMethod(opt.id)}>
                <div style={{display:'flex',gap:14,flex:1,alignItems:'flex-start'}}>
                  <div className="ico">{opt.ico}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14.5,marginBottom:3}}>{opt.t}</div>
                    <div style={{fontSize:12.5,color:'var(--ink-3)',lineHeight:1.4}}>{opt.s}</div>
                  </div>
                </div>
                {opt.tag && <Pill tone="warm">{opt.tag}</Pill>}
              </button>
            ))}
          </div>

          {method==='pdf' && (
            <div style={{
              border:'2px dashed var(--accent)', borderRadius:'var(--radius)',
              padding:'24px 20px',textAlign:'center',color:'var(--ink-2)',fontSize:13.5,
              background: parsed ? 'var(--accent-soft)' : 'rgba(255,255,255,0.5)'
            }}>
              {parsed ? (
                <>
                  <div style={{fontWeight:600,marginBottom:4,color:'var(--accent-ink)'}}>✓ analitica.pdf</div>
                  <div style={{fontSize:12,color:'var(--ink-3)'}}>17 aprobadas · 4 cursando · 2 recursando</div>
                </>
              ) : (
                <>
                  <div style={{fontSize:22,marginBottom:6,color:'var(--accent)'}}>↓</div>
                  Arrastrá tu analítica acá o <button onClick={()=>setParsed(true)} style={{background:'none',border:0,color:'var(--accent-ink)',cursor:'pointer',fontWeight:600,textDecoration:'underline',padding:0,font:'inherit'}}>elegí un archivo</button>
                  <div className="mono" style={{fontSize:11,opacity:0.7,marginTop:6}}>JPG, PNG o PDF · máx 5MB</div>
                </>
              )}
            </div>
          )}

          {method==='manual' && (
            <div style={{
              padding:'14px 16px',background:'var(--bg-elev)',borderRadius:'var(--radius)',
              fontSize:13,color:'var(--ink-2)',lineHeight:1.5,border:'1px solid var(--line)'
            }}>
              Te llevamos al plan de estudios — clickeás cada materia y elegís si está aprobada,
              regularizada o cursando.
            </div>
          )}

          <div style={{display:'flex',justifyContent:'space-between',gap:10,marginTop:'auto',paddingTop:24}}>
            <button className="btn ghost" onClick={()=>setStep(0)}>← Volver</button>
            <button className="btn accent" disabled={!method} onClick={()=>setStep(2)}>
              {method === 'later' ? 'Saltar' : 'Seguir'} →
            </button>
          </div>
        </>}

        {step === 2 && <>
          <h2 className="h1" style={{fontSize:30}}>Listo, {(user?.name || 'Lucía').split(' ')[0]}.</h2>

          {method === 'pdf' && parsed && (
            <p className="lede">
              Detectamos <b>17 aprobadas</b>, 4 cursando y 2 recursando.
              Vamos al plan para que revises antes de seguir.
            </p>
          )}
          {method === 'manual' && (
            <p className="lede">
              Te llevamos al plan de estudios para que marques materia por materia.
              No tenés que terminar de una.
            </p>
          )}
          {(method === 'later' || !method) && (
            <p className="lede">
              Sin historial el simulador funciona igual, pero no te avisa de correlativas.
              Podés cargarlo cuando quieras desde tu perfil.
            </p>
          )}

          {method === 'pdf' && parsed && (
            <div className="card" style={{padding:16,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <span className="muted">Materias detectadas</span>
                <span className="tabular" style={{fontWeight:600}}>23 / 38</span>
              </div>
              <div className="meter-bar warm"><i style={{width:'60%'}}/></div>
              <div className="muted" style={{fontSize:11.5,marginTop:4}}>
                Confirmá el detalle en <b style={{color:'var(--ink)'}}>Plan de estudios</b>.
              </div>
            </div>
          )}

          <div className="card" style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>
            <div className="eyebrow" style={{color:'var(--accent-ink)'}}>Lo que viene</div>
            <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                ['01', 'Plan de estudios', 'Ver tu carrera completa con cuáles aprobaste y cuáles podés cursar'],
                ['02', 'Simulador 2026·1c', 'Armar tu cuatri y detectar choques antes de inscribirte'],
                ['03', 'Reseñas', 'Leer qué dicen otros sobre cada materia y docente'],
              ].map(([n,t,s])=>(
                <li key={n} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <span className="mono" style={{fontSize:11,color:'var(--ink-4)',letterSpacing:'0.08em',paddingTop:2}}>{n}</span>
                  <div>
                    <div style={{fontWeight:500,fontSize:13.5}}>{t}</div>
                    <div style={{fontSize:12,color:'var(--ink-3)',marginTop:1,lineHeight:1.4}}>{s}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:'auto',paddingTop:24}}>
            <button className="btn ghost" onClick={()=>setStep(1)}>← Volver</button>
            <button className="btn accent" onClick={onFinish}>Ir al plan →</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// Write review (sin cambios funcionales, solo estilos heredan)
// ───────────────────────────────────────────────────────
const REVIEW_TAGS = [
  'TP grupal pesado', 'Final difícil', 'Buena explicación', 'Material desactualizado',
  'Clases dinámicas', 'Mucha lectura', 'Cursable con trabajo', 'Asistencia obligatoria',
  'Parcial sorpresa', 'Recursable sin drama', 'Apuntes oficiales útiles', 'Docente accesible'
];

const TERM_OPTIONS = ['2025-2c', '2025-1c', '2024-2c', '2024-1c', '2023-2c', '2023-1c', 'Anterior'];

function WriteReviewView({ subject, onClose, onSubmit }) {
  const draftKey = 'planb-review-draft-' + subject.code;

  // Hydrate from draft if exists
  const initialDraft = (() => {
    try {
      const raw = localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  })();

  const [hasDraft, setHasDraft] = useState(!!initialDraft);
  const [rating, setRating] = useState(initialDraft?.rating ?? 4);
  const [diff, setDiff] = useState(initialDraft?.diff ?? 3);
  const [load, setLoad] = useState(initialDraft?.load ?? 3);
  const [rec, setRec] = useState(initialDraft?.rec ?? 'yes');
  const [prof, setProf] = useState(initialDraft?.prof ?? '');
  const [term, setTerm] = useState(initialDraft?.term ?? '');
  const [body, setBody] = useState(initialDraft?.body ?? '');
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [tags, setTags] = useState(initialDraft?.tags ?? []);
  const [acceptedAnon, setAcceptedAnon] = useState(false);
  const [step, setStep] = useState('edit'); // 'edit' | 'preview' | 'done'

  // Auto-save draft on changes
  React.useEffect(() => {
    if (step !== 'edit') return;
    const t = setTimeout(() => {
      const d = { rating, diff, load, rec, prof, term, body, title, tags };
      try { localStorage.setItem(draftKey, JSON.stringify(d)); setHasDraft(true); } catch (e) {}
    }, 600);
    return () => clearTimeout(t);
  }, [rating, diff, load, rec, prof, term, body, title, tags, step]);

  const minChars = 100;
  const charsOk = body.length >= minChars;
  const required = !!prof && !!term && !!title.trim() && charsOk;
  const canSubmit = required && acceptedAnon;

  function toggleTag(t) {
    setTags(prev => {
      if (prev.includes(t)) return prev.filter(x => x !== t);
      if (prev.length >= 3) return prev;
      return [...prev, t];
    });
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey); } catch (e) {}
    setHasDraft(false);
    setRating(4); setDiff(3); setLoad(3); setRec('yes');
    setProf(''); setTerm(''); setBody(''); setTitle(''); setTags([]);
  }

  function publish() {
    try { localStorage.removeItem(draftKey); } catch (e) {}
    setStep('done');
    setTimeout(() => onSubmit && onSubmit(), 1400);
  }

  // ── DONE state
  if (step === 'done') {
    return (
      <div className="drawer">
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40,textAlign:'center'}}>
          <div>
            <div style={{
              width:64,height:64,borderRadius:'50%',
              background:'var(--accent-soft)',color:'var(--accent-ink)',
              display:'grid',placeItems:'center',margin:'0 auto 20px',
              fontSize:28
            }}>✓</div>
            <h2 className="h1" style={{fontSize:24,marginBottom:10}}>Reseña publicada</h2>
            <p className="muted" style={{fontSize:13.5,maxWidth:340,lineHeight:1.55,margin:'0 auto'}}>
              Va a aparecer en {subject.code} en unos minutos. Tu nombre no se muestra,
              solo el badge de <i>verificado que cursó</i>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW state
  if (step === 'preview') {
    return (
      <div className="drawer">
        <div className="drawer-h">
          <div>
            <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em'}}>
              Vista previa · así se va a ver
            </div>
            <h2 className="h1" style={{fontSize:22,marginTop:4}}>{subject.name}</h2>
          </div>
          <button className="btn ghost" onClick={()=>setStep('edit')}>Volver a editar</button>
        </div>
        <div className="drawer-body" style={{padding:'var(--pad-lg)'}}>
          <div className="card" style={{padding:18,marginBottom:18}}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
              <span className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em'}}>{subject.code}</span>
              <span style={{color:'var(--ink-4)'}}>·</span>
              <span className="mono" style={{fontSize:10.5,color:'var(--ink-3)'}}>{prof}</span>
              <span style={{color:'var(--ink-4)'}}>·</span>
              <span className="mono" style={{fontSize:10.5,color:'var(--ink-3)'}}>{term}</span>
              <span style={{marginLeft:'auto',display:'flex',gap:2}}>
                {[0,1,2,3,4].map(j=><span key={j} style={{color:j<rating?'var(--accent)':'var(--line)'}}>★</span>)}
              </span>
            </div>
            <div style={{fontWeight:600,fontSize:16,marginBottom:6}}>{title}</div>
            <p style={{fontSize:13.5,lineHeight:1.6,color:'var(--ink-2)',whiteSpace:'pre-wrap',marginBottom:10}}>{body}</p>
            {tags.length > 0 && (
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {tags.map(t=>(
                  <span key={t} style={{
                    fontSize:11,padding:'3px 9px',borderRadius:99,
                    background:'var(--bg-elev)',color:'var(--ink-2)',
                    fontFamily:'var(--font-mono)'
                  }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{display:'flex',gap:14,fontSize:11.5,color:'var(--ink-3)',fontFamily:'var(--font-mono)',letterSpacing:'0.03em',paddingTop:10,borderTop:'1px solid var(--line-2)'}}>
              <span>Dificultad: {diff}/5</span>
              <span>·</span>
              <span>Carga: {load}/5</span>
              <span>·</span>
              <span>{rec === 'yes' ? 'La recomienda' : rec === 'no' ? 'No la recomienda' : 'Depende'}</span>
            </div>
          </div>

          <label style={{display:'flex',gap:10,alignItems:'flex-start',padding:14,background:'var(--accent-soft)',borderRadius:'var(--radius-sm)',cursor:'pointer'}}>
            <input type="checkbox" checked={acceptedAnon} onChange={e=>setAcceptedAnon(e.target.checked)} style={{marginTop:3,flexShrink:0}}/>
            <span style={{fontSize:12.5,color:'var(--accent-ink)',lineHeight:1.55}}>
              Confirmo que esta reseña es <b>anónima</b>: ni el docente ni otros alumnos
              ven mi nombre o email. Sé que puedo editarla o borrarla cuando quiera, y
              acepto las <u>normas de comunidad</u> (sin insultos personales, sin datos
              de terceros, sin información de exámenes específicos).
            </span>
          </label>

          <div style={{display:'flex',gap:8,marginTop:18,justifyContent:'flex-end'}}>
            <button className="btn ghost" onClick={()=>setStep('edit')}>Editar</button>
            <button className="btn accent" disabled={!acceptedAnon} onClick={publish}>Publicar reseña</button>
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT state
  return (
    <div className="drawer">
      <div className="drawer-h">
        <div>
          <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em'}}>
            <span className="mono" style={{color:'var(--accent)'}}>{subject.code}</span> · Escribir reseña
          </div>
          <h2 className="h1" style={{fontSize:22,marginTop:4}}>{subject.name}</h2>
        </div>
        <button className="btn ghost" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-body" style={{padding:'var(--pad-lg)',display:'flex',flexDirection:'column',gap:18}}>

        {hasDraft && (
          <div style={{
            padding:'10px 14px',background:'var(--bg-elev)',
            border:'1px solid var(--line)',borderRadius:'var(--radius-sm)',
            display:'flex',justifyContent:'space-between',alignItems:'center',gap:10
          }}>
            <span style={{fontSize:12.5,color:'var(--ink-2)'}}>
              <span className="mono" style={{fontSize:10.5,color:'var(--ink-3)',marginRight:6}}>BORRADOR</span>
              Tenés una reseña a medias guardada para esta materia.
            </span>
            <button className="btn ghost sm" onClick={discardDraft}>Descartar</button>
          </div>
        )}

        <div style={{
          padding:12,background:'var(--accent-soft)',borderRadius:'var(--radius-sm)',
          fontSize:12.5,color:'var(--accent-ink)',lineHeight:1.5
        }}>
          <b>Tu reseña es anónima.</b> Lleva el badge <i>verificado que cursó</i>;
          ni docentes ni alumnos ven tu nombre o email.
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="field">
            <label>Docente con quien cursaste</label>
            <select value={prof} onChange={e=>setProf(e.target.value)}>
              <option value="">Elegí...</option>
              {(subject.profs||[]).map(p=><option key={p}>{p}</option>)}
              <option value="otro">Otro / No está en la lista</option>
            </select>
          </div>
          <div className="field">
            <label>Cuatrimestre que la cursaste</label>
            <select value={term} onChange={e=>setTerm(e.target.value)}>
              <option value="">Elegí...</option>
              {TERM_OPTIONS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <RatingSlider label="Valoración general" value={rating} onChange={setRating}/>
          <RatingSlider label="Dificultad" value={diff} onChange={setDiff}/>
          <RatingSlider label="Carga real" value={load} onChange={setLoad}/>
        </div>

        <div className="field">
          <label>¿La recomendarías?</label>
          <div className="pill-toggle" style={{alignSelf:'flex-start'}}>
            <button data-active={rec==='yes'} onClick={()=>setRec('yes')}>Sí, la recomiendo</button>
            <button data-active={rec==='maybe'} onClick={()=>setRec('maybe')}>Depende</button>
            <button data-active={rec==='no'} onClick={()=>setRec('no')}>No</button>
          </div>
        </div>

        <div className="field">
          <label>Título de tu reseña</label>
          <input placeholder="Ej: Pesada pero te enseña de verdad"
            value={title} onChange={e=>setTitle(e.target.value)} maxLength={70}/>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4,textAlign:'right'}}>{title.length}/70</div>
        </div>

        <div className="field">
          <label>Tu experiencia</label>
          <textarea rows={7} placeholder="¿Qué te hubiera gustado saber antes de inscribirte? Hablá de la carga real, la metodología, los TPs, los exámenes. Evitá nombres y datos personales."
            value={body} onChange={e=>setBody(e.target.value)}
            style={{resize:'vertical', fontFamily:'inherit'}}
            maxLength={2000}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:charsOk?'var(--ink-3)':'var(--warn)',marginTop:4}}>
            <span>{charsOk ? '✓ Suficiente' : `Mín. ${minChars} caracteres`} · {body.length}/2000</span>
            <span className="mono" style={{color:'var(--ink-3)'}}>Filtro automático activo</span>
          </div>
        </div>

        <div className="field">
          <label>Tags <span style={{color:'var(--ink-3)',fontWeight:400}}>· hasta 3, opcionales</span></label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {REVIEW_TAGS.map(t => {
              const on = tags.includes(t);
              const disabled = !on && tags.length >= 3;
              return (
                <button key={t} onClick={()=>toggleTag(t)} disabled={disabled}
                  style={{
                    appearance:'none',cursor:disabled?'not-allowed':'pointer',
                    fontSize:11.5,padding:'5px 11px',borderRadius:99,
                    border: on ? '1px solid var(--accent)' : '1px solid var(--line)',
                    background: on ? 'var(--accent-soft)' : 'transparent',
                    color: on ? 'var(--accent-ink)' : (disabled ? 'var(--ink-4)' : 'var(--ink-2)'),
                    fontFamily:'var(--font-mono)',letterSpacing:'0.02em',
                    opacity: disabled ? 0.5 : 1
                  }}>
                  {on ? '✓ ' : ''}{t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto',paddingTop:14,borderTop:'1px solid var(--line)',gap:10}}>
          <span className="muted" style={{fontSize:11.5,color:'var(--ink-3)'}}>
            {hasDraft ? <>Borrador guardado automáticamente</> : <>Empezá a escribir y guardamos un borrador</>}
          </span>
          <div style={{display:'flex',gap:8}}>
            <button className="btn ghost" onClick={onClose}>{hasDraft ? 'Cerrar y guardar' : 'Cancelar'}</button>
            <button className="btn accent" disabled={!required} onClick={()=>setStep('preview')}>
              Vista previa →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RatingSlider({ label, value, onChange }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'var(--font-mono)',letterSpacing:'0.04em',display:'flex',justifyContent:'space-between'}}>
        <span>{label}</span>
        <span className="tabular" style={{color:'var(--ink)'}}>{value}/5</span>
      </div>
      <div style={{display:'flex',gap:4}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>onChange(n)}
            style={{
              flex:1,height:32,
              border: n<=value?'1px solid var(--accent)':'1px solid var(--line)',
              background: n<=value?'var(--accent-soft)':'var(--bg-card)',
              color: n<=value?'var(--accent-ink)':'var(--ink-3)',
              borderRadius:6,cursor:'pointer',fontFamily:'var(--font-mono)',fontWeight:500,
              fontSize:12
            }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// Home + lista materias
// ───────────────────────────────────────────────────────
function HomeView({ user, states, subjects, openSubject, setView }) {
  const cursando = subjects.filter(s=>states[s.code]==='coursing');

  return (
    <div style={{padding:'var(--pad-xl) var(--pad-lg)',maxWidth:1200,margin:'0 auto'}}>
      <div className="eyebrow" style={{marginBottom:8}}>Hola, {user.name.split(' ')[0]}</div>
      <h1 className="h-display" style={{marginBottom:14}}>
        Cinco decisiones <em>esta semana</em>
      </h1>
      <p className="lede">
        Inscripción para 2026·1c abre el lunes 4 de mayo. Esto es lo que tu
        cuatrimestre actual te está pidiendo decidir.
      </p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginTop:32}}>
        <DecisionCard num="01" title="¿Recursás MAT201 o vas a libre?"
          body="Llevás 2 finales reprobados. Solo 18% de quienes recursaron por 3era vez aprueban; pero el 41% rinde libre y aprueba. Tu nivel de Análisis II era bueno."
          action="Comparar trayectorias" tone="warm"/>
        <DecisionCard num="02" title="¿4 o 5 materias en 2026·1c?"
          body="Con MAT201 + ALG202 arrastradas y trabajo de 20h, alumnos en tu situación que tomaron 5 recursaron 1+ en el 62% de los casos."
          action="Abrir simulador" onClick={()=>setView('simulator')} tone="danger"/>
        <DecisionCard num="03" title="¿INT302 con Iturralde o esperar a Sosa en 2c?"
          body="Iturralde tiene 3.4★ en INT302 (16 reseñas). Sosa abre 2c con 4.1★. Esperar 1 cuatri delays tu recepción ~3 meses."
          action="Ver reseñas" onClick={()=>setView('subjects')}/>
        <DecisionCard num="04" title="¿Qué comisión de ISW302?"
          body="Castro (B) tiene 4.6★ pero choca con tu trabajo. Brandt (A) entra de noche pero respondió 4 reseñas y ajustó la entrega."
          action="Comparar comisiones"/>
      </div>

      <div style={{marginTop:32}}>
        <div className="eyebrow" style={{marginBottom:12}}>Cursando ahora</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {cursando.map(s=>(
            <button key={s.code} onClick={()=>openSubject(s)}
              className="card" style={{
                padding:14,textAlign:'left',cursor:'pointer',
                appearance:'none',font:'inherit',color:'inherit',
                display:'flex',justifyContent:'space-between',alignItems:'center'
              }}>
              <div>
                <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)'}}>{s.code}</div>
                <div style={{fontWeight:500,fontSize:13.5}}>{s.name}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <DiffDots value={s.diff}/>
                <span className="mono" style={{fontSize:10,color:'var(--ink-3)'}}>{s.reviews} reseñas</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({ num, title, body, action, onClick, tone }) {
  return (
    <div className="card" style={{padding:'var(--pad-lg)',display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <span className="mono" style={{fontSize:11,color:'var(--ink-4)',letterSpacing:'0.1em'}}>{num}</span>
        {tone && <Pill tone={tone}>{tone==='danger'?'urgente':'requiere atención'}</Pill>}
      </div>
      <h3 style={{fontFamily:'var(--font-display)',fontSize:22,margin:0,fontWeight:500,letterSpacing:'-0.015em',lineHeight:1.2}}>{title}</h3>
      <p style={{fontSize:13.5,color:'var(--ink-2)',margin:0,lineHeight:1.5}}>{body}</p>
      <div style={{marginTop:6}}>
        <button className="btn secondary sm" onClick={onClick}>{action} →</button>
      </div>
    </div>
  );
}

function SubjectsListView({ subjects, openSubject }) {
  const [q, setQ] = useState('');
  const filtered = subjects.filter(s=>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.code.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div style={{padding:'var(--pad-xl) var(--pad-lg)',maxWidth:1200,margin:'0 auto'}}>
      <div className="eyebrow" style={{marginBottom:8}}>{subjects.length} materias indexadas</div>
      <h1 className="h-display" style={{marginBottom:14}}>Materias</h1>
      <input className="search" placeholder="Buscar por nombre o código..."
        value={q} onChange={e=>setQ(e.target.value)}
        style={{
          width:'100%',marginBottom:18,marginTop:18,padding:'12px 16px',
          border:'1px solid var(--line)',background:'var(--bg-card)',borderRadius:'var(--radius-pill)',fontSize:14,outline:'none'
        }}/>
      <div className="card">
        <div style={{
          display:'grid',gridTemplateColumns:'80px 1fr 90px 90px 110px 90px',gap:10,
          padding:'12px 18px',borderBottom:'1px solid var(--line)',
          fontFamily:'var(--font-mono)',fontSize:10.5,color:'var(--ink-3)',
          letterSpacing:'0.1em',textTransform:'uppercase'
        }}>
          <span>Código</span><span>Materia</span><span>Año</span>
          <span>Dificultad</span><span>Aprueban</span><span>Reseñas</span>
        </div>
        {filtered.map(s=>(
          <button key={s.code} onClick={()=>openSubject(s)}
            style={{
              appearance:'none',width:'100%',
              display:'grid',gridTemplateColumns:'80px 1fr 90px 90px 110px 90px',gap:10,
              padding:'14px 18px',borderBottom:'1px solid var(--line-2)',
              border:'0',borderBottom:'1px solid var(--line-2)',
              background:'transparent',cursor:'pointer',textAlign:'left',
              alignItems:'center',font:'inherit',color:'inherit',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elev)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span className="mono" style={{fontSize:11,color:'var(--ink-3)'}}>{s.code}</span>
            <span style={{fontWeight:500,fontSize:13.5}}>{s.name}</span>
            <span className="mono tabular" style={{fontSize:11.5,color:'var(--ink-2)'}}>{s.year}°·{s.sem}c</span>
            <DiffDots value={s.diff}/>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div className="meter-bar" style={{flex:1,height:4}}>
                <i style={{width:(s.passRate*100)+'%', background: s.passRate<0.5?'var(--st-failed-fg)':s.passRate<0.7?'var(--accent)':'var(--st-approved-fg)'}}/>
              </div>
              <span className="mono tabular" style={{fontSize:11}}>{(s.passRate*100).toFixed(0)}%</span>
            </div>
            <span className="mono tabular" style={{fontSize:11.5,color:'var(--ink-3)'}}>{s.reviews}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AuthView, OnboardingView, WriteReviewView, HomeView, SubjectsListView, DecisionCard });
