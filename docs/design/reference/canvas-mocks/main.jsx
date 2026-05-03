// Vistas principales — placeholders estructurados para validar el inventario.
// Cada uno trae el shell real (sidebar + topbar) con un área de contenido marcada.

const NAV = [
  ['inicio','Inicio','◇'], ['plan','Plan de estudios','▦'], ['sim','Simulador','◐'],
  ['mat','Materias','▤'], ['doc','Docentes','◯'], ['rev','Reseñas','✎'],
  ['hist','Historial','▢'],
];
const NAV_FOOT = [['perf','Perfil','◔'],['set','Ajustes','⚙']];

function Shell({ active, children, top }) {
  return (
    <div className="ab" style={{display:'flex', flexDirection:'column'}}>
      <div className="tb">
        <span className="logo">plan-b<span className="dot"/></span>
        <span className="pill"><span className="dot"/>Ing. en Sistemas · UNSTA</span>
        <span className="spacer"/>
        {top}
        <button className="btn">Ver onboarding</button>
        <button className="btn primary">Nuevo cuatrimestre</button>
      </div>
      <div className="layout">
        <aside className="sb">
          <div className="section">Producto</div>
          {NAV.map(([k,n,i])=>(
            <div key={k} className={'item'+(active===k?' active':'')}><span className="ic">{i}</span>{n}</div>
          ))}
          <div className="section">Tu cuenta</div>
          {NAV_FOOT.map(([k,n,i])=>(
            <div key={k} className={'item'+(active===k?' active':'')}><span className="ic">{i}</span>{n}</div>
          ))}
          <div className="me">
            <div className="av">LA</div>
            <div className="who">Lourdes Agüero<small>3er año · 40%</small></div>
          </div>
        </aside>
        <main style={{padding:'24px 28px', overflow:'hidden'}}>{children}</main>
      </div>
    </div>
  );
}

function PageHead({ eyebrow, title, sub, right }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18, gap:24}}>
      <div>
        {eyebrow && <div className="eyebrow" style={{marginBottom:6}}>{eyebrow}</div>}
        <h1 style={{fontSize:26, fontWeight:600, letterSpacing:'-0.025em', margin:0, lineHeight:1.1}}>{title}</h1>
        {sub && <p style={{fontSize:13, color:'#7a5a3f', margin:'6px 0 0', maxWidth:'62ch', lineHeight:1.5}}>{sub}</p>}
      </div>
      {right && <div style={{display:'flex', gap:8, alignItems:'center'}}>{right}</div>}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────
function Home() {
  return (
    <Shell active="inicio">
      <PageHead eyebrow="Inicio" title="Hola Lourdes."
        sub="Estás a 27 materias del título. Te falta inscribirte para el 1c 2026."
        right={<button className="btn primary">Armar 1c 2026</button>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18}}>
        {[
          ['Aprobadas','18','/ 45 del plan'],
          ['Promedio','7.4','histórico'],
          ['Cuatrimestre actual','—','sin inscripción'],
          ['Próximas reseñas','3','pendientes'],
        ].map(([l,v,s])=>(
          <div key={l} className="card">
            <div className="eyebrow" style={{marginBottom:4}}>{l}</div>
            <div className="mono" style={{fontSize:24, fontWeight:600, letterSpacing:'-0.02em'}}>{v}</div>
            <div style={{fontSize:11.5, color:'#9c7e62', marginTop:4}}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14}}>
        <div className="card">
          <div className="h2">Próximo paso <small>recomendado</small></div>
          <div style={{padding:'14px 0 6px'}}>
            <div style={{fontSize:14, fontWeight:500, marginBottom:6}}>Armá tu 1c 2026</div>
            <p style={{fontSize:12.5, color:'#7a5a3f', margin:'0 0 12px', lineHeight:1.5}}>9 materias disponibles. Te sugerimos 5 que combinan bien con tu carga histórica.</p>
            <button className="btn accent">Abrir simulador →</button>
          </div>
        </div>
        <div className="card">
          <div className="h2">Tu actividad</div>
          <ul style={{listStyle:'none', padding:0, margin:'10px 0 0', fontSize:12, color:'#7a5a3f'}}>
            <li style={{padding:'8px 0', borderBottom:'1px solid #f4e9de'}}>Aprobaste <b style={{color:'#2a1d12'}}>Bases de Datos</b> · ayer</li>
            <li style={{padding:'8px 0', borderBottom:'1px solid #f4e9de'}}>Reseñaste a <b style={{color:'#2a1d12'}}>Prof. Brandt</b> · hace 3d</li>
            <li style={{padding:'8px 0'}}>Borrador del simulador 1c 2026 · hace 5d</li>
          </ul>
        </div>
      </div>
    </Shell>
  );
}

// ── PLAN DE ESTUDIOS (grafo) ──────────────────────────────
function Plan() {
  // Render simple del grafo: filas por año, nodos rectangulares, líneas SVG entre correlativas
  const years = [
    [['MAT101','Análisis I','ok'],['ALG101','Álgebra','ok'],['PRG101','Prog. I','ok'],['INT101','Intro Sistemas','ok']],
    [['MAT201','Análisis II','ok'],['PRG201','Prog. II','ok'],['BD201','Bases de Datos','cur'],['SO201','SO','cur']],
    [['ISW302','Ing. SW II','can'],['MOV302','Móviles','can'],['INT302','IA I','can'],['SEG302','Seguridad','can'],['EST201','Prob. y Est.','can']],
    [['ISW401','Ing. SW III','blk'],['ARQ401','Arquitectura','blk'],['PRY401','Proyecto','blk']],
  ];
  const stateStyle = {
    ok:  {bg:'#e8f0e0', fg:'#3d5a1f', label:'aprobada'},
    cur: {bg:'#f6ead7', fg:'#945a14', label:'cursando'},
    can: {bg:'#fbe5d6', fg:'#b04a1c', label:'disponible'},
    blk: {bg:'#fff', fg:'#bca896', label:'bloqueada'},
  };
  return (
    <Shell active="plan" top={<>
      <span className="pill"><span className="dot" style={{background:'#3d5a1f'}}/>40% completado</span>
    </>}>
      <PageHead eyebrow="Plan de estudios" title="Ingeniería en Sistemas · plan 2018"
        sub="Toca un nodo para ver correlativas, docentes y reseñas. Las flechas indican qué necesitás aprobar antes."
        right={<>
          <button className="btn">Vista lista</button>
          <button className="btn">Exportar</button>
        </>}/>
      <div className="card" style={{padding:'18px 18px', position:'relative', minHeight:480}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
          {years.map((row,i)=>(
            <div key={i}>
              <div className="eyebrow" style={{marginBottom:10}}>Año {i+1}</div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {row.map(([code,name,st])=>{
                  const s = stateStyle[st];
                  return (
                    <div key={code} style={{
                      padding:'9px 11px', background:s.bg, color:s.fg, borderRadius:10,
                      fontSize:12, lineHeight:1.3, cursor:'pointer',
                      border: st==='blk' ? '1px dashed #ead9c5' : '0',
                    }}>
                      <div className="mono" style={{fontSize:10, opacity:0.7}}>{code}</div>
                      <div style={{fontWeight:500, fontSize:12.5, marginTop:1}}>{name}</div>
                      <div style={{fontSize:10.5, opacity:0.75, marginTop:2}}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'flex', gap:14, marginTop:18, paddingTop:14, borderTop:'1px solid #f4e9de', fontSize:11.5, color:'#7a5a3f'}}>
          {Object.entries(stateStyle).map(([k,s])=>(
            <span key={k} style={{display:'flex', alignItems:'center', gap:6}}>
              <span style={{width:10, height:10, background:s.bg, borderRadius:3, border: k==='blk' ? '1px dashed #ead9c5' : '0'}}/>{s.label}
            </span>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ── MATERIAS — listado ────────────────────────────────────
function MateriasList() {
  const rows = [
    ['ISW302','Ingeniería de Software II','3°','4.2','★ 4.1','96h'],
    ['MOV302','Aplicaciones Móviles','3°','3.4','★ 4.5','96h'],
    ['INT302','Inteligencia Artificial I','3°','4.6','★ 4.3','96h'],
    ['SEG302','Seguridad Informática','3°','3.1','★ 3.7','64h'],
    ['MAT201','Probabilidad y Estadística','2°','3.8','★ 3.2','96h'],
    ['BD201','Bases de Datos','2°','3.5','★ 4.6','96h'],
  ];
  return (
    <Shell active="mat">
      <PageHead eyebrow="Catálogo" title="Materias"
        sub="Buscá por nombre, código o profesor. Las dificultades y ratings vienen de reseñas verificadas."
        right={<>
          <input placeholder="Buscar materia, código…" style={{padding:'8px 12px', borderRadius:999, border:'1px solid #ead9c5', fontSize:12.5, width:220, background:'#fff', outline:'none'}}/>
          <button className="btn">Filtros</button>
        </>}/>
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'80px 1.6fr 60px 90px 90px 70px 30px', padding:'10px 16px', borderBottom:'1px solid #f4e9de', fontSize:10.5, color:'#9c7e62', textTransform:'uppercase', letterSpacing:'0.06em'}}>
          <div>Código</div><div>Nombre</div><div>Año</div><div>Dificultad</div><div>Rating</div><div>Carga</div><div></div>
        </div>
        {rows.map(r=>(
          <div key={r[0]} style={{display:'grid', gridTemplateColumns:'80px 1.6fr 60px 90px 90px 70px 30px', padding:'12px 16px', borderBottom:'1px solid #f4e9de', alignItems:'center', fontSize:13, cursor:'pointer'}}>
            <div className="mono" style={{fontSize:11, color:'#9c7e62'}}>{r[0]}</div>
            <div style={{fontWeight:500}}>{r[1]}</div>
            <div style={{color:'#7a5a3f', fontSize:12}}>{r[2]}</div>
            <div><span className={'mp '+(parseFloat(r[3])>=4?'diff-hi':parseFloat(r[3])>=3?'diff-mid':'diff-lo')}>{r[3]}/5</span></div>
            <div style={{color:'#7a5a3f', fontSize:12}}>{r[4]}</div>
            <div className="mono" style={{fontSize:11, color:'#9c7e62'}}>{r[5]}</div>
            <div style={{color:'#bca896'}}>›</div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ── MATERIA — detalle ────────────────────────────────────
function MateriaDetail() {
  return (
    <Shell active="mat">
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14, fontSize:12, color:'#9c7e62'}}>
        <span style={{cursor:'pointer'}}>Materias</span> <span>›</span> <span style={{color:'#2a1d12'}}>ISW302</span>
      </div>
      <PageHead eyebrow="Materia" title="Ingeniería de Software II"
        sub="3er año · plan 2018 · 96h · 4 docentes activos · 32 reseñas"
        right={<>
          <button className="btn">+ Al simulador</button>
          <button className="btn primary">Reseñar</button>
        </>}/>
      <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14}}>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="h2">Reseñas <small>32 · ordenadas por más útiles</small></div>
            {[
              ['anónimo · cursó 2025·1c','★★★★☆','Materia muy bien estructurada. El TP integrador es exigente pero te enseña laburar en equipo. Brandt es claro pero pide.','dificultad 4 · cargá tiempo'],
              ['anónimo · cursó 2024·2c','★★★★★','Si te gusta diseño de software, es la mejor del plan. Vas a programar mucho.','dificultad 4 · justo'],
              ['anónimo · cursó 2024·1c','★★★☆☆','El parcial 2 es un cuello de botella. Estudiá el material extra.','dificultad 5 · pesada'],
            ].map((r,i)=>(
              <div key={i} style={{padding:'12px 0', borderBottom:i<2?'1px solid #f4e9de':'0'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:11.5, color:'#9c7e62', marginBottom:4}}>
                  <span>{r[0]}</span><span style={{color:'#e07a4d'}}>{r[1]}</span>
                </div>
                <p style={{fontSize:12.5, lineHeight:1.55, margin:'0 0 6px', color:'#2a1d12'}}>{r[2]}</p>
                <div className="mono" style={{fontSize:10.5, color:'#9c7e62'}}>{r[3]}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="h2">Correlativas</div>
            <div style={{display:'flex', gap:18, padding:'12px 0 4px'}}>
              <div>
                <div className="eyebrow" style={{marginBottom:6}}>Necesitás</div>
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  <span className="mp code">ISW201 · Ing. SW I</span>
                  <span className="mp code">BD201 · Bases de Datos</span>
                </div>
              </div>
              <div style={{flex:1}}>
                <div className="eyebrow" style={{marginBottom:6}}>Habilita</div>
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  <span className="mp code">ISW401 · Ing. SW III</span>
                  <span className="mp code">PRY401 · Proyecto Final</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="h2">En números</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:10}}>
              <Stat2 v="4.2" l="dificultad /5"/>
              <Stat2 v="★ 4.1" l="32 reseñas"/>
              <Stat2 v="68%" l="aprobación esp."/>
              <Stat2 v="9h" l="estudio/sem"/>
            </div>
          </div>
          <div className="card">
            <div className="h2">Docentes</div>
            <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:10}}>
              {['Brandt · Com A · ★ 4.4','Castro · Com B · ★ 3.8','Sosa · Com C · ★ 3.9','Iturralde · suplente'].map((d,i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'#fbf3ec', borderRadius:8, fontSize:12.5, cursor:'pointer'}}>
                  <span>{d}</span><span style={{color:'#bca896'}}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
function Stat2({v,l}){return (<div><div className="mono" style={{fontSize:18, fontWeight:600, letterSpacing:'-0.02em'}}>{v}</div><div style={{fontSize:11, color:'#9c7e62', marginTop:2}}>{l}</div></div>);}

// ── DOCENTES — lista ──────────────────────────────────────
function DocentesList() {
  const rows = [
    ['Brandt, Carlos','Ing. SW II · Ing. SW I','★ 4.4','42 reseñas','responde tarde'],
    ['Castro, Mariana','Aplicaciones Móviles','★ 4.5','28 reseñas','muy cercana'],
    ['Iturralde, Eduardo','IA I · Prob. y Est.','★ 4.0','51 reseñas','exige'],
    ['Sosa, Ramiro','Seguridad','★ 3.7','19 reseñas','flexible'],
  ];
  return (
    <Shell active="doc">
      <PageHead eyebrow="Catálogo" title="Docentes"
        sub="Cómo califican alumnos que ya cursaron con cada profesor. Las reseñas son anónimas y verificadas por mail."
        right={<input placeholder="Buscar profe…" style={{padding:'8px 12px', borderRadius:999, border:'1px solid #ead9c5', fontSize:12.5, width:240, background:'#fff', outline:'none'}}/>}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12}}>
        {rows.map(r=>(
          <div key={r[0]} className="card" style={{display:'flex', gap:14, alignItems:'center', cursor:'pointer'}}>
            <div style={{width:46, height:46, borderRadius:'50%', background:'#fbe5d6', color:'#b04a1c', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600}}>
              {r[0].split(',')[0][0]}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:500, fontSize:13.5}}>{r[0]}</div>
              <div style={{fontSize:11.5, color:'#7a5a3f', marginTop:1}}>{r[1]}</div>
              <div style={{display:'flex', gap:8, marginTop:6}}>
                <span className="mp">{r[2]}</span>
                <span className="mp">{r[3]}</span>
                <span className="mp" style={{background:'#fbe5d6', color:'#b04a1c'}}>{r[4]}</span>
              </div>
            </div>
            <span style={{color:'#bca896', fontSize:18}}>›</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ── DOCENTE — detalle ─────────────────────────────────────
function DocenteDetail() {
  return (
    <Shell active="doc">
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14, fontSize:12, color:'#9c7e62'}}>
        <span style={{cursor:'pointer'}}>Docentes</span> <span>›</span> <span style={{color:'#2a1d12'}}>Brandt, Carlos</span>
      </div>
      <div style={{display:'flex', gap:18, alignItems:'center', marginBottom:18}}>
        <div style={{width:72, height:72, borderRadius:'50%', background:'#fbe5d6', color:'#b04a1c', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:600}}>B</div>
        <div style={{flex:1}}>
          <div className="eyebrow" style={{marginBottom:4}}>Docente</div>
          <h1 style={{fontSize:24, fontWeight:600, letterSpacing:'-0.025em', margin:0}}>Brandt, Carlos</h1>
          <p style={{fontSize:12.5, color:'#7a5a3f', margin:'4px 0 0'}}>Ingeniería de Software I y II · UNSTA · 42 reseñas verificadas</p>
        </div>
        <button className="btn primary">Reseñar</button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:14}}>
        <div className="card"><div className="eyebrow">Rating</div><div className="mono" style={{fontSize:22, fontWeight:600}}>★ 4.4</div></div>
        <div className="card"><div className="eyebrow">Claridad</div><div className="mono" style={{fontSize:22, fontWeight:600}}>4.6</div></div>
        <div className="card"><div className="eyebrow">Exigencia</div><div className="mono" style={{fontSize:22, fontWeight:600}}>4.1</div></div>
        <div className="card"><div className="eyebrow">Buena onda</div><div className="mono" style={{fontSize:22, fontWeight:600}}>3.9</div></div>
      </div>
      <div className="card">
        <div className="h2">Reseñas recientes <small>filtrar por materia ▾</small></div>
        {[
          ['ISW302 · 2025·1c','★★★★★','Explicaciones muy claras. Pide pero acompaña.'],
          ['ISW302 · 2024·2c','★★★★☆','Bueno en clase, los TPs están muy bien armados.'],
          ['ISW201 · 2024·1c','★★★☆☆','Responde lento por mail.'],
        ].map((r,i)=>(
          <div key={i} style={{padding:'12px 0', borderBottom:i<2?'1px solid #f4e9de':'0'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:11.5, color:'#9c7e62', marginBottom:4}}>
              <span className="mono">{r[0]}</span><span style={{color:'#e07a4d'}}>{r[1]}</span>
            </div>
            <p style={{fontSize:12.5, margin:0, lineHeight:1.55}}>{r[2]}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ── RESEÑAS — mías ────────────────────────────────────────
function MisResenias() {
  return (
    <Shell active="rev">
      <PageHead eyebrow="Tus reseñas" title="Lo que opinás"
        sub="Tus reseñas son anónimas para los demás, vos las podés editar acá."
        right={<button className="btn primary">+ Nueva reseña</button>}/>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18}}>
        {[
          ['ISW302 · Brandt','2025·1c','★★★★☆','El TP integrador es la mejor parte. Materia bien estructurada. Brandt explica claro pero exige.'],
          ['BD201 · sin docente','2024·2c','★★★★★','Una de las mejores. Aprendés modelado de verdad y el final es justo.'],
        ].map((r,i)=>(
          <div key={i} className="card">
            <div style={{display:'flex', justifyContent:'space-between', fontSize:11.5, color:'#9c7e62', marginBottom:6}}>
              <span className="mono">{r[0]}</span><span>{r[1]}</span>
            </div>
            <div style={{color:'#e07a4d', fontSize:14, marginBottom:8}}>{r[2]}</div>
            <p style={{fontSize:12.5, lineHeight:1.55, margin:'0 0 12px'}}>{r[3]}</p>
            <div style={{display:'flex', gap:8, fontSize:11.5}}>
              <span style={{color:'#b04a1c', cursor:'pointer'}}>Editar</span>
              <span style={{color:'#bca896', cursor:'pointer'}}>Eliminar</span>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="h2">Reseñas pendientes <small>3 materias que cursaste sin reseñar</small></div>
        <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:10}}>
          {['SO201 · Sistemas Operativos','PRG201 · Programación II','MAT201 · Análisis II'].map(m=>(
            <div key={m} style={{display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'#fbf3ec', borderRadius:8, fontSize:12.5}}>
              <span>{m}</span>
              <span style={{color:'#b04a1c', cursor:'pointer'}}>Reseñar →</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ── ESCRIBIR RESEÑA ───────────────────────────────────────
function NuevaResenia() {
  return (
    <Shell active="rev">
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14, fontSize:12, color:'#9c7e62'}}>
        <span style={{cursor:'pointer'}}>Mis reseñas</span> <span>›</span> <span style={{color:'#2a1d12'}}>Nueva</span>
      </div>
      <PageHead eyebrow="Nueva reseña" title="¿Cómo te fue con ISW302?"
        sub="Tu reseña es anónima. Solo pedimos cuándo cursaste para validar."/>
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14}}>
        <div className="card">
          <div className="field">
            <label>Cuatrimestre que cursaste</label>
            <select defaultValue="2025-1c"><option value="2025-1c">2025 · 1° cuatrimestre</option><option>2024 · 2° cuatrimestre</option></select>
          </div>
          <div className="field">
            <label>Comisión / Docente</label>
            <select defaultValue="brandt"><option value="brandt">Com A — Brandt, Carlos</option><option>Com B — Castro, Mariana</option></select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            {[['Dificultad', 4],['Carga horaria', 3],['Claridad docente', 5],['Justicia evaluación', 4]].map(([l,n])=>(
              <div key={l} className="field">
                <label>{l}</label>
                <div style={{display:'flex', gap:6}}>
                  {[1,2,3,4,5].map(i=>(
                    <span key={i} style={{
                      width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                      background: i<=n ? '#e07a4d' : '#fff', color: i<=n ? '#fff' : '#9c7e62',
                      border: i<=n ? '0' : '1px solid #ead9c5', fontSize:12, cursor:'pointer', fontWeight:500,
                    }}>{i}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="field">
            <label>Tu reseña</label>
            <textarea rows={5} defaultValue="El TP integrador es la mejor parte. Materia bien estructurada y los parciales se llevan bien si vas con la teoría al día."/>
            <span className="hint">Mínimo 80 caracteres · 142/500</span>
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="h2">Etiquetas <small>opcional</small></div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:10}}>
              {['TP exigente','Buenos materiales','Parcial difícil','Final justo','Buena onda','Estudiar a tiempo'].map((t,i)=>(
                <span key={t} className="mp" style={{cursor:'pointer', background: i<3 ? '#fbe5d6' : '#fbf3ec', color: i<3 ? '#b04a1c' : '#7a5a3f'}}>
                  {i<3 && '✓ '}{t}
                </span>
              ))}
            </div>
          </div>
          <div className="card" style={{background:'#fbf3ec'}}>
            <div className="eyebrow" style={{marginBottom:6}}>Cómo se publica</div>
            <p style={{fontSize:12, color:'#7a5a3f', margin:0, lineHeight:1.55}}>
              Tu nombre nunca se muestra. Otros alumnos van a ver "anónimo · cursó 2025·1c" junto a tu reseña.
            </p>
          </div>
          <button className="btn primary" style={{padding:'11px'}}>Publicar reseña</button>
        </div>
      </div>
    </Shell>
  );
}

// ── HISTORIAL ─────────────────────────────────────────────
function Historial() {
  const cuatris = [
    ['2025 · 1c', [['ISW201','Ing. SW I',8],['BD201','Bases de Datos',9],['SO201','SO',7]]],
    ['2024 · 2c', [['PRG201','Programación II',8],['MAT201','Análisis II',6]]],
    ['2024 · 1c', [['MAT102','Análisis I',7],['ALG101','Álgebra',8],['INT101','Intro Sistemas',9]]],
  ];
  return (
    <Shell active="hist">
      <PageHead eyebrow="Tu historial" title="18 materias · promedio 7.4"
        sub="Lo que cargaste en el onboarding más lo que fuiste agregando."
        right={<>
          <button className="btn">Importar otro PDF</button>
          <button className="btn primary">+ Materia rendida</button>
        </>}/>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {cuatris.map(([titulo, mats])=>(
          <div key={titulo} className="card">
            <div className="h2">{titulo} <small>{mats.length} materias · promedio {(mats.reduce((a,m)=>a+m[2],0)/mats.length).toFixed(1)}</small></div>
            <div style={{display:'grid', gridTemplateColumns:'80px 1fr 60px 80px 30px', gap:0, marginTop:8}}>
              {mats.map(m=>(
                <React.Fragment key={m[0]}>
                  <div className="mono" style={{padding:'10px 0', fontSize:11, color:'#9c7e62', borderTop:'1px solid #f4e9de'}}>{m[0]}</div>
                  <div style={{padding:'10px 0', fontSize:13, fontWeight:500, borderTop:'1px solid #f4e9de'}}>{m[1]}</div>
                  <div style={{padding:'10px 0', fontSize:12, color:'#7a5a3f', borderTop:'1px solid #f4e9de'}}><span className="mp diff-lo">aprob</span></div>
                  <div className="mono" style={{padding:'10px 0', fontSize:14, fontWeight:600, borderTop:'1px solid #f4e9de'}}>{m[2]}</div>
                  <div style={{padding:'10px 0', borderTop:'1px solid #f4e9de', textAlign:'right', color:'#bca896'}}>⋯</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ── PERFIL ────────────────────────────────────────────────
function Perfil() {
  return (
    <Shell active="perf">
      <PageHead eyebrow="Tu cuenta" title="Perfil"
        sub="Esto solo lo ves vos. En la comunidad aparecés como anónimo."/>
      <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:14}}>
        <div className="card" style={{textAlign:'center', padding:'24px 18px'}}>
          <div style={{width:80, height:80, borderRadius:'50%', background:'#e07a4d', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:600, margin:'0 auto 12px'}}>LA</div>
          <div style={{fontWeight:500, fontSize:15}}>Lourdes Agüero</div>
          <div style={{fontSize:12, color:'#9c7e62', marginTop:2}}>lourdes.aguero@unsta.edu.ar</div>
          <button className="btn" style={{marginTop:14}}>Editar foto</button>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div className="card">
            <div className="h2">Datos académicos</div>
            <Row k="Universidad" v="UNSTA"/>
            <Row k="Carrera" v="Ing. en Sistemas (plan 2018)"/>
            <Row k="Año" v="3er año · 40% completado"/>
            <Row k="Inicio" v="2022"/>
          </div>
          <div className="card">
            <div className="h2">Tu actividad pública</div>
            <Row k="Reseñas escritas" v="12"/>
            <Row k="Útiles recibidas" v="58"/>
            <Row k="Miembro desde" v="Marzo 2024"/>
          </div>
        </div>
      </div>
    </Shell>
  );
}
function Row({k,v}) {
  return (<div style={{display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f4e9de', fontSize:12.5}}>
    <span style={{color:'#7a5a3f'}}>{k}</span><span style={{fontWeight:500}}>{v}</span>
  </div>);
}

// ── AJUSTES ───────────────────────────────────────────────
function Ajustes() {
  return (
    <Shell active="set">
      <PageHead eyebrow="Tu cuenta" title="Ajustes"/>
      <div style={{display:'flex', flexDirection:'column', gap:12, maxWidth:680}}>
        <div className="card">
          <div className="h2">Notificaciones</div>
          {[
            ['Reseñas en materias que voy a cursar', true],
            ['Cuando alguien marca útil mi reseña', true],
            ['Resumen semanal del cuatrimestre', false],
            ['Apertura de inscripciones', true],
          ].map(([l,on])=>(
            <div key={l} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderTop:'1px solid #f4e9de', fontSize:12.5}}>
              <span>{l}</span>
              <span style={{width:34, height:18, borderRadius:99, background: on ? '#e07a4d' : '#ead9c5', position:'relative'}}>
                <span style={{position:'absolute', top:2, left: on ? 18 : 2, width:14, height:14, borderRadius:'50%', background:'#fff'}}/>
              </span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="h2">Privacidad</div>
          <Row k="Mostrar mi promedio" v="Solo a mí"/>
          <Row k="Mis reseñas" v="Anónimas (siempre)"/>
          <Row k="Compartir progreso" v="Desactivado"/>
        </div>
        <div className="card">
          <div className="h2">Cuenta</div>
          <Row k="Mail institucional" v="lourdes.aguero@unsta.edu.ar"/>
          <Row k="Contraseña" v="Cambiar contraseña →"/>
          <Row k="Eliminar cuenta" v="Solicitar baja"/>
        </div>
      </div>
    </Shell>
  );
}

window.Home = Home;
window.Plan = Plan;
window.MateriasList = MateriasList;
window.MateriaDetail = MateriaDetail;
window.DocentesList = DocentesList;
window.DocenteDetail = DocenteDetail;
window.MisResenias = MisResenias;
window.NuevaResenia = NuevaResenia;
window.Historial = Historial;
window.Perfil = Perfil;
window.Ajustes = Ajustes;
