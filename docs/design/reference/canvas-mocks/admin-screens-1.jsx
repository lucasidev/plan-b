// admin-screens-1: Dashboard + flujo de afiliación de una universidad

// ── Dashboard ───────────────────────────────────────────────
function AdmDashboard() {
  const kpis = [
    { lbl:'Universidades activas', val:'12',     d:'+1 este mes',           tone:'up' },
    { lbl:'Carreras',              val:'47',     d:'+3 (Plan 2023 UNSTA)',  tone:'up' },
    { lbl:'Alumnos verificados',   val:'8.412',  d:'+312 esta semana',      tone:'up' },
    { lbl:'Reseñas',               val:'14.580', d:'+204 esta semana',      tone:'up' },
    { lbl:'Cola de moderación',    val:'14',     d:'3 abiertos hace +48h',  tone:'down' },
    { lbl:'Errores de import',     val:'2',      d:'UTN FRT · plan 2024',   tone:'down' },
  ];
  const recent = [
    { who:'lautaro', what:'aprobó reseña reportada',   ref:'rev_8821',  when:'hace 12 min' },
    { who:'sistema', what:'importó plan',              ref:'UNSTA · ISI · plan-2023', when:'hace 1 h' },
    { who:'sof.r',   what:'mergeó docentes',           ref:'doc_412 ← doc_490', when:'hace 2 h' },
    { who:'lautaro', what:'baneó usuario por spam',    ref:'usr_3344',  when:'hace 5 h' },
    { who:'sistema', what:'detectó posible duplicado', ref:'mat: Análisis I / Análisis Mat I', when:'hace 6 h' },
    { who:'sof.r',   what:'creó universidad',          ref:'UCEMA',     when:'ayer' },
    { who:'lautaro', what:'descartó reporte',          ref:'rep_1102',  when:'ayer' },
  ];
  return (
    <AdmShell active="dash" crumbs={['Dashboard']}
      pageEyebrow="General"
      pageTitle="Estado de la operación"
      pageSub="Lo que hay que mirar todos los días: cola de moderación, datos en mal estado y actividad del equipo."
      actions={<>
        <button className="adm-btn">Exportar reporte</button>
        <button className="adm-btn primary">+ Afiliar universidad</button>
      </>}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:18}}>
        {kpis.map(k => (
          <div key={k.lbl} className="adm-stat">
            <div className="lbl">{k.lbl}</div>
            <div className="val">{k.val}</div>
            <div className={'delta ' + k.tone}>{k.d}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14}}>
        <div className="adm-card">
          <div className="h"><h3>Actividad reciente</h3><small>últimas 24h</small></div>
          <AdmTable dense
            columns={[
              { key:'who',  label:'Quién', w:'80px',  mono:true },
              { key:'what', label:'Acción', w:'1fr' },
              { key:'ref',  label:'Referencia', w:'1.4fr', mono:true, muted:true },
              { key:'when', label:'Cuándo', w:'90px', muted:true, align:'right' },
            ]}
            rows={recent}/>
        </div>

        <div className="adm-card">
          <div className="h"><h3>Necesita atención</h3><small>3 abiertos</small></div>
          {[
            { tit:'14 reportes en cola', sub:'3 con +48h sin tocar', tone:'err' },
            { tit:'2 imports fallidos',  sub:'UTN FRT · plan-2024 — código de materia duplicado', tone:'warn' },
            { tit:'Posible docente duplicado', sub:'Brandt, Carlos / Brandt C. — 23 reseñas dispersas', tone:'warn' },
            { tit:'Plan 2008 UNSTA',     sub:'62 alumnos siguen activos — vence migración el 1 jun', tone:'warn' },
          ].map((r, i) => (
            <div key={i} style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              padding:'10px 0', borderTop: i ? '1px solid var(--adm-line-2)' : 0, gap:10,
            }}>
              <div>
                <div style={{fontSize:12.5, fontWeight:500}}>{r.tit}</div>
                <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:2}}>{r.sub}</div>
              </div>
              <button className="adm-btn sm">Ver →</button>
            </div>
          ))}
        </div>
      </div>
    </AdmShell>
  );
}

// ── Onboarding · paso 1: Universidad ───────────────────────
function AdmOnbStepBar({ step }) {
  const labels = ['Universidad','Carrera','Plan','Catálogo','Listo'];
  return (
    <div className="adm-steps" style={{marginBottom:24}}>
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className={'st ' + (i+1 < step ? 'done' : i+1 === step ? 'on' : '')}>
            <span className="n">{i+1 < step ? '✓' : i+1}</span>{l}
          </div>
          {i < labels.length - 1 && <span className="ln"/>}
        </React.Fragment>
      ))}
    </div>
  );
}

function AdmOnbUni() {
  return (
    <AdmShell active="uni" crumbs={['Universidades','Afiliar nueva']}
      pageEyebrow="Afiliar universidad"
      pageTitle="Empezamos por la universidad"
      pageSub="Datos básicos para crearla. Después podemos ir agregándole carreras y planes uno a uno."
      actions={<button className="adm-btn ghost">Cancelar</button>}>
      <AdmOnbStepBar step={1}/>
      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:24, alignItems:'flex-start'}}>
        <div className="adm-card">
          <div className="adm-field">
            <label>Nombre completo<span className="req">*</span></label>
            <input defaultValue="Universidad del Centro de Estudios Macroeconómicos de Argentina"/>
            <div className="hint">Nombre oficial. Después se puede acortar.</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'140px 1fr', gap:12}}>
            <div className="adm-field">
              <label>Abreviatura<span className="req">*</span></label>
              <input defaultValue="UCEMA"/>
            </div>
            <div className="adm-field">
              <label>Sede / Campus principal</label>
              <input defaultValue="Av. Córdoba 374, CABA"/>
            </div>
          </div>
          <div className="adm-field">
            <label>Dominio de email institucional<span className="req">*</span></label>
            <input defaultValue="@ucema.edu.ar"/>
            <div className="hint">Usamos esto para validar que un usuario sea alumno de la facu.</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="adm-field">
              <label>País</label>
              <select defaultValue="AR"><option value="AR">Argentina</option></select>
            </div>
            <div className="adm-field">
              <label>Tipo</label>
              <select defaultValue="priv"><option value="pub">Pública</option><option value="priv">Privada</option></select>
            </div>
          </div>
          <div className="adm-field">
            <label>Modalidades disponibles</label>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {['Anual','1c','2c','Cuatrim. especial','Bimestral','Semestral'].map(t => (
                <span key={t} style={{padding:'4px 9px', fontSize:11.5, border:'1px solid var(--adm-line)', borderRadius:5, background: ['1c','2c','Anual'].includes(t) ? 'var(--ink)' : 'var(--adm-bg-card)', color: ['1c','2c','Anual'].includes(t) ? '#fff' : 'var(--ink-2)', cursor:'pointer'}}>{t}</span>
              ))}
            </div>
            <div className="hint">Marcá las que la facu usa. Los planes heredan estas modalidades.</div>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:7, marginTop:18}}>
            <button className="adm-btn">← Volver</button>
            <button className="adm-btn primary">Siguiente → Carrera</button>
          </div>
        </div>

        <div className="adm-card" style={{background:'var(--adm-bg-elev)', border:0}}>
          <div className="h"><h3>Antes de seguir</h3><small>checklist interno</small></div>
          {[
            ['Convenio firmado / aprobado por legales',true],
            ['Logo en alta resolución (≥ 256px)',true],
            ['Plan vigente como PDF o CSV listo',false],
            ['Catálogo inicial de docentes (puede empezar vacío)',false],
            ['Persona de referencia académica para dudas de datos',true],
          ].map(([t, ok]) => (
            <div key={t} style={{display:'flex', gap:9, padding:'7px 0', alignItems:'center', borderTop:'1px solid var(--adm-line)'}}>
              <span style={{
                width:14, height:14, borderRadius:3,
                background: ok ? '#3d5a1f' : 'transparent',
                border: ok ? 0 : '1.5px solid var(--ink-4)',
                display:'grid', placeItems:'center', color:'#fff', fontSize:9, flexShrink:0,
              }}>{ok && '✓'}</span>
              <span style={{fontSize:12, color: ok ? 'var(--ink-2)' : 'var(--ink-3)'}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </AdmShell>
  );
}

function AdmOnbCarrera() {
  return (
    <AdmShell active="uni" crumbs={['Universidades','UCEMA','Afiliar — Carrera']}
      pageEyebrow="Afiliar universidad · UCEMA"
      pageTitle="Primera carrera"
      pageSub="Empecemos cargando una carrera. Después podés sumar más desde el detalle de la uni.">
      <AdmOnbStepBar step={2}/>
      <div className="adm-card" style={{maxWidth:780}}>
        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:12}}>
          <div className="adm-field">
            <label>Nombre de la carrera<span className="req">*</span></label>
            <input defaultValue="Licenciatura en Economía"/>
          </div>
          <div className="adm-field">
            <label>Código interno (opcional)</label>
            <input placeholder="ej. LE" defaultValue="LE"/>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
          <div className="adm-field">
            <label>Tipo de título</label>
            <select defaultValue="grado"><option value="grado">Grado</option><option value="posg">Posgrado</option><option value="tec">Tecnicatura</option></select>
          </div>
          <div className="adm-field">
            <label>Duración nominal</label>
            <select defaultValue="5"><option>4 años</option><option value="5">5 años</option><option>6 años</option></select>
          </div>
          <div className="adm-field">
            <label>Modalidad mayoritaria</label>
            <select defaultValue="2c"><option>Anual</option><option value="2c">Cuatrimestral</option><option>Semestral</option></select>
          </div>
        </div>
        <div className="adm-field">
          <label>Descripción corta (visible al alumno)</label>
          <textarea rows="3" defaultValue="Carrera de grado de 5 años orientada a teoría económica, métodos cuantitativos y política."></textarea>
        </div>
        <div className="adm-field">
          <label>Estado al lanzar</label>
          <div style={{display:'flex', gap:6}}>
            {['Borrador (no visible)','Beta (alumnos invitados)','Pública'].map((t, i) => (
              <span key={t} style={{flex:1, textAlign:'center', padding:'8px 10px', fontSize:12, border:'1px solid '+ (i===1 ? 'var(--ink)' : 'var(--adm-line)'), background: i===1 ? 'var(--ink)' : 'var(--adm-bg-card)', color: i===1 ? '#fff' : 'var(--ink-2)', borderRadius:5, cursor:'pointer'}}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:7, marginTop:14}}>
          <button className="adm-btn">← Volver a Universidad</button>
          <button className="adm-btn primary">Siguiente → Plan</button>
        </div>
      </div>
    </AdmShell>
  );
}

function AdmOnbPlan() {
  return (
    <AdmShell active="uni" crumbs={['Universidades','UCEMA','Lic. Economía','Afiliar — Plan']}
      pageEyebrow="Afiliar universidad · UCEMA · Lic. Economía"
      pageTitle="Plan vigente"
      pageSub="Cargá el plan de estudios. Lo más rápido es importar de un CSV — abajo está el método manual.">
      <AdmOnbStepBar step={3}/>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
        <div className="adm-card">
          <div className="h"><h3>Importar de CSV / JSON</h3><small>recomendado</small></div>
          <p style={{fontSize:12, color:'var(--ink-3)', margin:'0 0 12px', lineHeight:1.5}}>
            Pegá una tabla con código, nombre, año, modalidad, créditos y correlativas. Te mostramos un preview antes de aplicar.
          </p>
          <div style={{
            border:'1.5px dashed var(--adm-line)', borderRadius:8,
            padding:'28px 18px', textAlign:'center', color:'var(--ink-3)',
            background:'var(--adm-bg-elev)', fontSize:12.5,
          }}>
            Arrastrá el archivo aquí<br/>
            <span style={{fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'var(--ink-4)'}}>.csv · .tsv · .json</span><br/>
            <button className="adm-btn" style={{marginTop:12}}>O elegir archivo</button>
          </div>
          <div style={{marginTop:10, fontSize:11.5, color:'var(--ink-3)'}}>
            <a style={{color:'var(--accent-ink)', textDecoration:'underline'}}>Bajar plantilla CSV</a> ·{' '}
            <a style={{color:'var(--accent-ink)', textDecoration:'underline'}}>Ver formato esperado</a>
          </div>
        </div>

        <div className="adm-card">
          <div className="h"><h3>Carga manual</h3><small>para planes chicos</small></div>
          <div className="adm-field">
            <label>Identificador del plan<span className="req">*</span></label>
            <input defaultValue="plan-2023"/>
            <div className="hint">Versionado por año (plan-2008, plan-2023…). El alumno verá "Plan 2023".</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="adm-field">
              <label>Año de vigencia</label>
              <input defaultValue="2023"/>
            </div>
            <div className="adm-field">
              <label>Total de materias estimadas</label>
              <input defaultValue="42" placeholder="ej. 42"/>
            </div>
          </div>
          <button className="adm-btn" style={{width:'100%', marginTop:6}}>Empezar carga manual →</button>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'flex-end', gap:7, marginTop:18}}>
        <button className="adm-btn">← Volver a Carrera</button>
        <button className="adm-btn ghost">Saltar — cargo después</button>
        <button className="adm-btn primary">Siguiente → Catálogo</button>
      </div>
    </AdmShell>
  );
}

function AdmOnbCatalogo() {
  return (
    <AdmShell active="uni" crumbs={['Universidades','UCEMA','Lic. Economía','Plan 2023','Afiliar — Catálogo']}
      pageEyebrow="Afiliar universidad · UCEMA"
      pageTitle="Catálogo inicial"
      pageSub="Docentes y comisiones del cuatri actual. Si no los tenés, podés saltar — los alumnos los van completando con sus reseñas.">
      <AdmOnbStepBar step={4}/>
      <div className="adm-card" style={{marginBottom:14}}>
        <div className="h"><h3>Docentes</h3><small>opcional</small></div>
        <p style={{fontSize:12, color:'var(--ink-3)', margin:'0 0 10px'}}>
          Pegá un listado con apellido, nombre y materias que dicta. Lo conectamos a las materias del plan.
        </p>
        <textarea rows="6" placeholder={"Brandt, Carlos · Microeconomía I, Macroeconomía II\nReynoso, Ana · Matemática I"} style={{width:'100%', padding:'9px 11px', fontFamily:'IBM Plex Mono,monospace', fontSize:11.5, border:'1px solid var(--adm-line)', borderRadius:5, background:'var(--adm-bg-card)', color:'var(--ink)', outline:'none', resize:'vertical'}}></textarea>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
          <span style={{fontSize:11.5, color:'var(--ink-3)'}}>Detectados: <b>0 docentes · 0 vinculaciones</b></span>
          <button className="adm-btn sm">Procesar</button>
        </div>
      </div>

      <div className="adm-card">
        <div className="h"><h3>Comisiones del cuatri actual</h3><small>opcional · 2026·1c</small></div>
        <AdmTable dense
          columns={[
            { key:'mat',  label:'Materia',     w:'1.6fr' },
            { key:'com',  label:'Comisión',    w:'70px',  mono:true },
            { key:'doc',  label:'Docente',     w:'1.4fr', muted:true },
            { key:'hor',  label:'Horario',     w:'1.4fr', mono:true, muted:true },
            { key:'act',  label:'',            w:'40px',  align:'right',
              cell: () => <button className="adm-btn ghost sm">×</button> },
          ]}
          rows={[
            { id:1, mat:'Microeconomía I',  com:'A', doc:'Brandt, Carlos', hor:'Lu/Mi 18–21' },
            { id:2, mat:'Microeconomía I',  com:'B', doc:'— sin asignar',  hor:'Ma/Ju 18–21' },
            { id:3, mat:'Matemática I',     com:'A', doc:'Reynoso, Ana',   hor:'Lu/Mi 9–12'  },
          ]}/>
        <button className="adm-btn ghost sm" style={{marginTop:8}}>+ Agregar comisión</button>
      </div>

      <div style={{display:'flex', justifyContent:'flex-end', gap:7, marginTop:18}}>
        <button className="adm-btn">← Volver a Plan</button>
        <button className="adm-btn ghost">Saltar — vacío</button>
        <button className="adm-btn primary">Finalizar afiliación →</button>
      </div>
    </AdmShell>
  );
}

function AdmOnbDone() {
  return (
    <AdmShell active="uni" crumbs={['Universidades','UCEMA']}
      pageEyebrow="Universidad afiliada"
      pageTitle="UCEMA está dentro de plan-b"
      pageSub="Lic. en Economía · Plan 2023 está en estado Beta. Solo los alumnos invitados ven la carrera hasta que la abras a Pública.">
      <div className="adm-card" style={{maxWidth:760, marginBottom:18, background:'#e8f0e0', border:'1px solid #c8d8b0'}}>
        <div style={{display:'flex', gap:14, alignItems:'flex-start'}}>
          <div style={{width:32, height:32, borderRadius:6, background:'#3d5a1f', color:'#fff', display:'grid', placeItems:'center', fontWeight:600, flexShrink:0}}>✓</div>
          <div>
            <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>Resumen de lo que cargaste</div>
            <div style={{fontSize:12.5, color:'var(--ink-2)', lineHeight:1.6}}>
              <b>UCEMA</b> · 1 carrera (Lic. Economía) · 1 plan (2023) con <b>42 materias</b> · <b>18 docentes</b> · <b>12 comisiones</b> en 2026·1c.
            </div>
          </div>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, maxWidth:880}}>
        {[
          ['Validar correlativas','Ver el grafo del plan, verificar que no haya ciclos ni huérfanos.','Validar →'],
          ['Pasar a Pública','Cuando quieras que cualquier alumno con email @ucema.edu.ar pueda registrarse.','Cambiar estado'],
          ['Invitar referente','Mandar acceso de solo-lectura a la persona de la facu para que verifique los datos.','Invitar'],
        ].map(([t, s, b]) => (
          <div key={t} className="adm-card">
            <div style={{fontSize:13, fontWeight:600, marginBottom:6}}>{t}</div>
            <div style={{fontSize:11.5, color:'var(--ink-3)', lineHeight:1.5, marginBottom:10}}>{s}</div>
            <button className="adm-btn sm">{b}</button>
          </div>
        ))}
      </div>
    </AdmShell>
  );
}

window.AdmDashboard = AdmDashboard;
window.AdmOnbUni = AdmOnbUni;
window.AdmOnbCarrera = AdmOnbCarrera;
window.AdmOnbPlan = AdmOnbPlan;
window.AdmOnbCatalogo = AdmOnbCatalogo;
window.AdmOnbDone = AdmOnbDone;
