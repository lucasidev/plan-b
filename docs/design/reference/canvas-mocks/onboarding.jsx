// Onboarding — 4 pasos. Mismo shell visual que el resto de la app:
// topbar consistente (.tb) + card central blanca sobre fondo apricot.
// Sin sidebar (es pre-app), pero misma tipografía/tokens/componentes.

function OnbShell({ step = 1, total = 4, children, footer }) {
  return (
    <div className="ab" style={{display:'flex', flexDirection:'column'}}>
      <div className="tb">
        <span className="logo">plan-b<span className="dot"/></span>
        <span className="pill"><span className="dot"/>Configuración inicial · paso {step} de {total}</span>
        <span className="spacer"/>
        <div style={{flex:'0 0 220px', height:3, background:'#f4e9de', borderRadius:99, position:'relative'}}>
          <div style={{position:'absolute', inset:0, width:`${(step/total)*100}%`, background:'#e07a4d', borderRadius:99}}/>
        </div>
        <span className="mono" style={{fontSize:11, color:'#bca896', cursor:'pointer'}}>Salir</span>
      </div>

      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 48px', overflow:'hidden'}}>
        <div style={{width:'100%', maxWidth:780}}>{children}</div>
      </div>

      {footer && (
        <div style={{padding:'18px 32px', borderTop:'1px solid #f4e9de', display:'flex', gap:12, alignItems:'center'}}>
          {footer}
        </div>
      )}
    </div>
  );
}

function OnbWelcome() {
  return (
    <OnbShell step={1} footer={<>
      <span className="mono" style={{fontSize:11, color:'#9c7e62'}}>~ 2 minutos</span>
      <div style={{flex:1}}/>
      <button className="btn primary" style={{padding:'9px 20px'}}>Empezar →</button>
    </>}>
      <div style={{textAlign:'center', maxWidth:600, margin:'0 auto'}}>
        <div className="eyebrow" style={{marginBottom:14}}>Bienvenida</div>
        <h1 style={{fontSize:32, fontWeight:600, letterSpacing:'-0.025em', lineHeight:1.1, margin:'0 0 14px'}}>
          Hola Lourdes. Vamos a armar tu plan-b.
        </h1>
        <p style={{fontSize:13.5, color:'#7a5a3f', lineHeight:1.55, margin:'0 0 32px'}}>
          En unos pasos cargamos tu carrera y tu historial. Después podés simular cuatrimestres, ver el grafo de correlativas y leer reseñas de tus compañeros.
        </p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
          {[
            ['1','Elegí tu carrera','Universidad y plan vigente.'],
            ['2','Cargá tu historial','PDF del SIU o manual.'],
            ['3','Listo','Empezás a usar plan-b.'],
          ].map(([n,t,d])=>(
            <div key={n} className="card" style={{textAlign:'left'}}>
              <div className="mono" style={{fontSize:11, color:'#e07a4d', marginBottom:8}}>0{n}</div>
              <div style={{fontWeight:600, fontSize:13.5, marginBottom:4}}>{t}</div>
              <div style={{fontSize:12, color:'#7a5a3f', lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </OnbShell>
  );
}

function OnbCareer() {
  const careers = [
    {n:'Ingeniería en Sistemas', m:'45 materias · plan 2018', sel:true},
    {n:'Ingeniería Industrial', m:'46 materias · plan 2017'},
    {n:'Lic. en Administración', m:'40 materias · plan 2019'},
    {n:'Contador Público', m:'42 materias · plan 2018'},
  ];
  return (
    <OnbShell step={2} footer={<>
      <button className="btn ghost">← Atrás</button>
      <div style={{flex:1}}/>
      <button className="btn primary" style={{padding:'9px 20px'}}>Continuar →</button>
    </>}>
      <div style={{maxWidth:640, margin:'0 auto'}}>
        <div className="eyebrow" style={{marginBottom:8}}>Tu carrera</div>
        <h2 style={{fontSize:24, fontWeight:600, letterSpacing:'-0.02em', margin:'0 0 22px'}}>¿Qué estás cursando?</h2>

        <div className="card" style={{padding:'18px 20px'}}>
          <div className="field">
            <label>Universidad</label>
            <select defaultValue="unsta">
              <option value="unsta">Universidad del Norte Santo Tomás de Aquino — UNSTA</option>
              <option>Universidad Nacional de Tucumán — UNT</option>
              <option>UTN · Facultad Regional Tucumán</option>
            </select>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Carrera</label>
            <div style={{display:'grid', gap:8}}>
              {careers.map(c=>(
                <div key={c.n} style={{
                  padding:'11px 14px', borderRadius:10, background:'#fbf3ec',
                  border: c.sel ? '1.5px solid #e07a4d' : '1px solid transparent',
                  cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div>
                    <div style={{fontWeight:500, fontSize:13}}>{c.n}</div>
                    <div style={{fontSize:11.5, color:'#9c7e62', marginTop:1}}>{c.m}</div>
                  </div>
                  {c.sel && <span style={{color:'#e07a4d', fontWeight:600}}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OnbShell>
  );
}

function OnbHistory() {
  return (
    <OnbShell step={3} footer={<>
      <button className="btn ghost">← Atrás</button>
      <div style={{flex:1}}/>
      <span className="mono" style={{fontSize:11, color:'#9c7e62', marginRight:14}}>Podés saltarlo y cargarlo después</span>
      <button className="btn primary" style={{padding:'9px 20px'}}>Continuar →</button>
    </>}>
      <div style={{maxWidth:780, margin:'0 auto'}}>
        <div className="eyebrow" style={{marginBottom:8}}>Tu historial</div>
        <h2 style={{fontSize:24, fontWeight:600, letterSpacing:'-0.02em', margin:'0 0 6px'}}>¿Cómo cargás lo que ya rendiste?</h2>
        <p style={{fontSize:13, color:'#7a5a3f', margin:'0 0 18px'}}>Detectamos materias aprobadas, regularizadas y notas. Podés editar todo después.</p>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <div className="card" style={{padding:'18px 18px', position:'relative'}}>
            <span className="mp" style={{position:'absolute', top:14, right:14, background:'#fbe5d6', color:'#b04a1c'}}>recomendado</span>
            <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>Importar PDF del SIU</div>
            <p style={{fontSize:12, color:'#7a5a3f', lineHeight:1.5, margin:'0 0 14px'}}>Subí tu certificado analítico. Lo parseamos en segundos y vos confirmás.</p>
            <div style={{
              border:'1.5px dashed #ead9c5', borderRadius:10, padding:'24px', textAlign:'center',
              background:'#fbf3ec', fontSize:12, color:'#9c7e62',
            }}>
              <div style={{fontSize:20, marginBottom:6}}>↑</div>
              Arrastrá el PDF acá o <span style={{color:'#b04a1c', fontWeight:500, cursor:'pointer'}}>buscar archivo</span>
            </div>
          </div>
          <div className="card" style={{padding:'18px 18px'}}>
            <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>Cargar a mano</div>
            <p style={{fontSize:12, color:'#7a5a3f', lineHeight:1.5, margin:'0 0 14px'}}>Tildá las materias del plan y opcionalmente la nota.</p>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {['Análisis Matemático I','Álgebra I','Programación I','Sistemas Operativos','Bases de Datos'].map((m,i)=>(
                <label key={m} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#fbf3ec', borderRadius:8, fontSize:12, cursor:'pointer'}}>
                  <span style={{display:'flex', gap:8, alignItems:'center'}}>
                    <input type="checkbox" defaultChecked={i<3}/> {m}
                  </span>
                  {i<3 && <span className="mono" style={{fontSize:11, color:'#7a5a3f'}}>{[8,7,9][i]}</span>}
                </label>
              ))}
              <span style={{fontSize:11.5, color:'#b04a1c', cursor:'pointer', marginTop:4}}>+ Ver las 45 materias del plan</span>
            </div>
          </div>
        </div>

        <div className="card" style={{
          marginTop:14, padding:'12px 16px', fontSize:12, color:'#7a5a3f',
          display:'flex', gap:10,
        }}>
          <span style={{color:'#e07a4d', fontWeight:600}}>i</span>
          <div>Tu historial no se comparte. Solo lo usamos para sugerir qué podés cursar y comparar tu progreso con tu plan.</div>
        </div>
      </div>
    </OnbShell>
  );
}

function OnbDone() {
  return (
    <OnbShell step={4} footer={<>
      <button className="btn ghost">← Atrás</button>
      <div style={{flex:1}}/>
      <button className="btn primary" style={{padding:'9px 20px'}}>Ir al inicio →</button>
    </>}>
      <div style={{textAlign:'center', maxWidth:620, margin:'0 auto'}}>
        <div style={{
          width:54, height:54, background:'#fbe5d6', color:'#b04a1c', borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
          margin:'0 auto 18px',
        }}>✓</div>
        <div className="eyebrow" style={{marginBottom:10}}>Todo listo</div>
        <h1 style={{fontSize:28, fontWeight:600, letterSpacing:'-0.025em', lineHeight:1.15, margin:'0 0 12px'}}>
          Cargamos 18 materias aprobadas.
        </h1>
        <p style={{fontSize:13, color:'#7a5a3f', lineHeight:1.55, margin:'0 0 26px'}}>
          Estás en 3er año, con 40% del plan completado. Te mostramos qué podés cursar este cuatrimestre.
        </p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:520, margin:'0 auto'}}>
          {[['Aprobadas','18','/ 45'],['Promedio','7.4',''],['Disponibles ahora','9','']].map(([l,v,s])=>(
            <div key={l} className="card" style={{textAlign:'left'}}>
              <div className="eyebrow" style={{marginBottom:4}}>{l}</div>
              <div className="mono" style={{fontSize:22, fontWeight:600, letterSpacing:'-0.02em'}}>
                {v}{s && <small style={{fontSize:12, color:'#9c7e62', fontFamily:'Geist', marginLeft:3}}>{s}</small>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </OnbShell>
  );
}

window.OnbWelcome = OnbWelcome;
window.OnbCareer = OnbCareer;
window.OnbHistory = OnbHistory;
window.OnbDone = OnbDone;
