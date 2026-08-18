// admin-screens-2: Datos académicos. Listas, detalle, editor de plan, importer, merge.

// ── Universidades · listado ───────────────────────────────
function AdmUniList() {
  const rows = [
    { id:'unsta', code:'UNSTA',     name:'Univ. del Norte Santo Tomás de Aquino', country:'AR', type:'Privada', careers:3, students:1840, plans:5,  status:'live',     since:'2023·1c' },
    { id:'utn',   code:'UTN-FRBA',  name:'UTN — Facultad Regional Buenos Aires',  country:'AR', type:'Pública',  careers:7, students:3210, plans:9,  status:'live',     since:'2024·1c' },
    { id:'utnt',  code:'UTN-FRT',   name:'UTN — Facultad Regional Tucumán',       country:'AR', type:'Pública',  careers:5, students:740,  plans:6,  status:'live',     since:'2024·2c' },
    { id:'unt',   code:'UNT',       name:'Universidad Nacional de Tucumán',       country:'AR', type:'Pública',  careers:4, students:1230, plans:7,  status:'live',     since:'2024·2c' },
    { id:'uba',   code:'UBA-FCEN',  name:'UBA — Facultad de Ciencias Exactas',    country:'AR', type:'Pública',  careers:6, students:1110, plans:8,  status:'live',     since:'2025·1c' },
    { id:'udesa', code:'UDESA',     name:'Universidad de San Andrés',             country:'AR', type:'Privada', careers:2, students:240,  plans:2,  status:'live',     since:'2025·1c' },
    { id:'austl', code:'AUSTRAL',   name:'Universidad Austral',                   country:'AR', type:'Privada', careers:3, students:182,  plans:3,  status:'live',     since:'2025·2c' },
    { id:'ucema', code:'UCEMA',     name:'Universidad del CEMA',                  country:'AR', type:'Privada', careers:1, students:0,    plans:1,  status:'beta',     since:'2026·1c' },
    { id:'unc',   code:'UNC',       name:'Universidad Nacional de Córdoba',       country:'AR', type:'Pública',  careers:4, students:680,  plans:5,  status:'live',     since:'2025·1c' },
    { id:'unl',   code:'UNL',       name:'Universidad Nacional del Litoral',      country:'AR', type:'Pública',  careers:2, students:0,    plans:2,  status:'draft',    since:'—' },
    { id:'itba',  code:'ITBA',      name:'Instituto Tecnológico de Buenos Aires', country:'AR', type:'Privada', careers:3, students:520,  plans:4,  status:'live',     since:'2024·2c' },
    { id:'unr',   code:'UNR',       name:'Universidad Nacional de Rosario',       country:'AR', type:'Pública',  careers:0, students:0,    plans:0,  status:'archived', since:'—' },
  ];
  const StatusPill = ({ s }) => {
    const map = { live:['live','activa'], beta:['draft','beta'], draft:['archived','borrador'], archived:['archived','archivada'] };
    const [cls, txt] = map[s];
    return <span className={'adm-pill dot ' + cls}>{txt}</span>;
  };
  return (
    <AdmShell active="uni" crumbs={['Universidades']}
      pageEyebrow="Datos académicos"
      pageTitle="Universidades"
      pageSub="12 universidades en plan-b. La carga de planes y catálogo la hacemos nosotros."
      actions={<>
        <button className="adm-btn">Exportar</button>
        <button className="adm-btn primary">+ Afiliar universidad</button>
      </>}>
      <AdmFilters>
        <AdmFilterChip label="Todas" value="12" on/>
        <AdmFilterChip label="Activas" value="9"/>
        <AdmFilterChip label="Beta" value="1"/>
        <AdmFilterChip label="Borrador" value="1"/>
        <AdmFilterChip label="Archivadas" value="1"/>
        <span style={{flex:1}}/>
        <span style={{fontSize:11, color:'var(--ink-3)', fontFamily:'IBM Plex Mono,monospace'}}>orden: actividad ↓</span>
      </AdmFilters>
      <AdmTable
        columns={[
          { key:'code',     label:'Código',      w:'110px', mono:true },
          { key:'name',     label:'Nombre',      w:'2.4fr' },
          { key:'type',     label:'Tipo',        w:'80px',  muted:true },
          { key:'careers',  label:'Carreras',    w:'80px',  mono:true, align:'right' },
          { key:'plans',    label:'Planes',      w:'70px',  mono:true, align:'right' },
          { key:'students', label:'Alumnos',     w:'90px',  mono:true, align:'right',
            cell: r => <span className="num">{r.students.toLocaleString('es-AR')}</span> },
          { key:'since',    label:'Desde',       w:'80px',  mono:true, muted:true },
          { key:'status',   label:'Estado',      w:'90px',
            cell: r => <StatusPill s={r.status}/> },
          { key:'act',      label:'',            w:'80px',  align:'right',
            cell: () => <button className="adm-btn sm">Abrir →</button> },
        ]}
        rows={rows}/>
    </AdmShell>
  );
}

// ── Universidad · detalle ─────────────────────────────────
function AdmUniDetalle() {
  return (
    <AdmShell active="uni" crumbs={['Universidades','UNSTA']}
      pageEyebrow="Universidad"
      pageTitle="UNSTA"
      pageSub="Universidad del Norte Santo Tomás de Aquino · Tucumán · Privada · activa desde 2023·1c."
      actions={<>
        <button className="adm-btn ghost">Auditar</button>
        <button className="adm-btn">Editar metadatos</button>
        <button className="adm-btn primary">+ Carrera</button>
      </>}>
      <div style={{display:'flex', gap:12, marginBottom:16}}>
        {[
          ['Carreras','3'],
          ['Planes','5'],
          ['Materias','312'],
          ['Docentes','86'],
          ['Alumnos','1.840'],
          ['Reseñas','3.214'],
        ].map(([l,v]) => (
          <div key={l} className="adm-stat" style={{flex:1, padding:'10px 12px'}}>
            <div className="lbl" style={{fontSize:9.5}}>{l}</div>
            <div className="val" style={{fontSize:18}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="adm-tabs">
        <div className="tab on">Carreras <span className="n">3</span></div>
        <div className="tab">Settings</div>
        <div className="tab">Audit log</div>
      </div>

      <AdmTable
        columns={[
          { key:'code', label:'Código',     w:'90px',  mono:true },
          { key:'name', label:'Carrera',    w:'2fr' },
          { key:'plans',label:'Planes',     w:'1.6fr', muted:true,
            cell: r => <span className="mono">{r.plans}</span> },
          { key:'mats', label:'Materias',   w:'90px',  mono:true, align:'right' },
          { key:'std',  label:'Alumnos',    w:'90px',  mono:true, align:'right' },
          { key:'st',   label:'Estado',     w:'90px',
            cell: r => <span className={'adm-pill dot ' + (r.st === 'live' ? 'live' : 'draft')}>{r.st === 'live' ? 'activa' : 'beta'}</span> },
          { key:'act',  label:'',           w:'80px',  align:'right',
            cell: () => <button className="adm-btn sm">Abrir →</button> },
        ]}
        rows={[
          { id:'isi', code:'ISI', name:'Ingeniería en Sistemas',        plans:'2008 · 2018 · 2023 (vigente)', mats:'58', std:'820', st:'live' },
          { id:'iin', code:'IIN', name:'Ingeniería Industrial',          plans:'2010 · 2022 (vigente)',         mats:'62', std:'640', st:'live' },
          { id:'arq', code:'ARQ', name:'Arquitectura',                   plans:'2024 (vigente)',                mats:'72', std:'380', st:'live' },
        ]}/>
    </AdmShell>
  );
}

// ── Carrera · detalle (planes versionados) ─────────────────
function AdmCarreraDetalle() {
  return (
    <AdmShell active="car" crumbs={['Universidades','UNSTA','Ing. en Sistemas']}
      pageEyebrow="UNSTA · Carrera"
      pageTitle="Ingeniería en Sistemas"
      pageSub="58 materias · 5 años · cuatrimestral · 820 alumnos en plan-b. 3 planes históricos."
      actions={<button className="adm-btn primary">+ Plan nuevo</button>}>
      <div className="adm-card" style={{marginBottom:14}}>
        <div className="h"><h3>Planes</h3><small>versionados por año</small></div>
        <AdmTable dense
          columns={[
            { key:'id',   label:'Plan',      w:'120px', mono:true },
            { key:'name', label:'Identificador', w:'1.4fr' },
            { key:'mats', label:'Materias',  w:'90px',  mono:true, align:'right' },
            { key:'std',  label:'Alumnos',   w:'100px', mono:true, align:'right' },
            { key:'st',   label:'Estado',    w:'120px',
              cell: r => <span className={'adm-pill dot ' + (r.st === 'vigente' ? 'live' : r.st === 'transición' ? 'draft' : 'archived')}>{r.st}</span> },
            { key:'act',  label:'',          w:'130px', align:'right',
              cell: r => <span style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                <button className="adm-btn sm ghost">Editar plan</button>
                {r.st === 'transición' && <button className="adm-btn sm">Migrar →</button>}
              </span> },
          ]}
          rows={[
            { id:1, id:'plan-2023', name:'Plan 2023 — vigente',       mats:'58', std:'612', st:'vigente' },
            { id:2, id:'plan-2018', name:'Plan 2018 — en transición', mats:'56', std:'146', st:'transición' },
            { id:3, id:'plan-2008', name:'Plan 2008 — antiguo',       mats:'54', std:'62',  st:'archivado' },
          ]}/>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
        <div className="adm-card">
          <div className="h"><h3>Plan vigente · 2023</h3><small>resumen</small></div>
          <dl className="adm-kv">
            <dt>Materias</dt><dd>58 (52 obligatorias · 6 electivas)</dd>
            <dt>Modalidad</dt><dd>Cuatrimestral · Anual (4 materias)</dd>
            <dt>Duración</dt><dd>5 años · 10 cuatrimestres</dd>
            <dt>Créditos</dt><dd>240 totales · 24 por cuatri promedio</dd>
            <dt>Correlativas</dt><dd><span className="adm-vchip">✓ grafo válido</span> · 0 ciclos · 0 huérfanos</dd>
            <dt>Última edición</dt><dd>14 mar 2026 · sof.r</dd>
          </dl>
        </div>
        <div className="adm-card">
          <div className="h"><h3>Comisiones activas</h3><small>2026·1c</small></div>
          <div style={{fontSize:32, fontWeight:600, letterSpacing:'-0.02em', marginBottom:4}}>34<span style={{fontSize:14, color:'var(--ink-3)', fontWeight:400}}> activas</span></div>
          <div style={{fontSize:11.5, color:'var(--ink-3)', marginBottom:14}}>↑ 4 vs el cuatri pasado</div>
          <button className="adm-btn sm">Ver oferta del cuatri →</button>
        </div>
      </div>
    </AdmShell>
  );
}

// ── Plan · editor de materias ──────────────────────────────
function AdmPlanEditor() {
  const rows = [
    { id:1, code:'MAT101', name:'Análisis Matemático I',      year:1, mod:'1c',    cr:8, prereq:'—',          rev:120, st:'live' },
    { id:2, code:'PRG101', name:'Programación I',              year:1, mod:'1c',    cr:6, prereq:'—',          rev:98,  st:'live' },
    { id:3, code:'ALG101', name:'Álgebra I',                   year:1, mod:'1c',    cr:6, prereq:'—',          rev:84,  st:'live' },
    { id:4, code:'MAT102', name:'Análisis Matemático II',      year:1, mod:'2c',    cr:8, prereq:'MAT101',     rev:62,  st:'live' },
    { id:5, code:'PRG102', name:'Programación II',             year:1, mod:'2c',    cr:8, prereq:'PRG101',     rev:58,  st:'live' },
    { id:6, code:'FIS201', name:'Física I',                    year:2, mod:'anual', cr:10, prereq:'MAT101',    rev:74,  st:'live' },
    { id:7, code:'BD201',  name:'Bases de Datos',              year:2, mod:'1c',    cr:8, prereq:'PRG102',     rev:142, st:'live' },
    { id:8, code:'EDA201', name:'Estructuras de Datos',        year:2, mod:'1c',    cr:8, prereq:'PRG102',     rev:118, st:'live' },
    { id:9, code:'ISW301', name:'Ingeniería de Software I',    year:3, mod:'1c',    cr:10, prereq:'BD201, EDA201', rev:88, st:'live' },
    { id:10,code:'ISW302', name:'Ingeniería de Software II',   year:3, mod:'2c',    cr:10, prereq:'ISW301',    rev:64,  st:'live' },
    { id:11,code:'INT302', name:'Inteligencia Artificial I',   year:3, mod:'2c',    cr:8, prereq:'EDA201',     rev:52,  st:'live' },
    { id:12,code:'IA-NEW', name:'Aprendizaje Profundo',        year:4, mod:'1c',    cr:8, prereq:'INT302',     rev:0,   st:'draft' },
  ];
  return (
    <AdmShell active="car" crumbs={['Universidades','UNSTA','Ing. en Sistemas','Plan 2023']}
      pageEyebrow="UNSTA · ISI · Plan 2023"
      pageTitle="Editor de plan"
      pageSub="58 materias · 240 créditos. Edición directa. Cambios visibles para alumnos al guardar."
      actions={<>
        <button className="adm-btn ghost">Validar correlativas</button>
        <button className="adm-btn">Importar diff</button>
        <button className="adm-btn primary">+ Materia</button>
      </>}>
      <AdmFilters>
        <AdmFilterChip label="Todas" value="58" on/>
        <AdmFilterChip label="Año 1" value="11"/>
        <AdmFilterChip label="Año 2" value="12"/>
        <AdmFilterChip label="Año 3" value="12"/>
        <AdmFilterChip label="Año 4" value="11"/>
        <AdmFilterChip label="Año 5" value="6"/>
        <AdmFilterChip label="Electivas" value="6"/>
        <span style={{flex:1}}/>
        <span style={{fontSize:11, color:'var(--ink-3)', fontFamily:'IBM Plex Mono,monospace'}}>3 cambios sin guardar</span>
        <button className="adm-btn sm">Descartar</button>
        <button className="adm-btn sm primary">Guardar todo</button>
      </AdmFilters>
      <AdmTable
        columns={[
          { key:'code',   label:'Código',    w:'90px',  mono:true },
          { key:'name',   label:'Materia',   w:'2.2fr' },
          { key:'year',   label:'Año',       w:'50px',  mono:true, align:'center' },
          { key:'mod',    label:'Mod.',      w:'70px',  mono:true },
          { key:'cr',     label:'Créd.',     w:'60px',  mono:true, align:'right' },
          { key:'prereq', label:'Correl.',   w:'1.4fr', mono:true, muted:true },
          { key:'rev',    label:'Reseñas',   w:'80px',  mono:true, align:'right' },
          { key:'st',     label:'Estado',    w:'85px',
            cell: r => <span className={'adm-pill dot ' + (r.st === 'live' ? 'live' : 'draft')}>{r.st === 'live' ? 'activa' : 'nueva'}</span> },
          { key:'act',    label:'',          w:'80px',  align:'right',
            cell: () => <span style={{display:'flex', gap:3, justifyContent:'flex-end'}}>
              <button className="adm-btn sm ghost">✎</button>
              <button className="adm-btn sm ghost danger">×</button>
            </span> },
        ]}
        rows={rows}/>
    </AdmShell>
  );
}

// ── Editor de correlativas con validación ──────────────────
function AdmCorrelativasEditor() {
  return (
    <AdmShell active="car" crumbs={['Universidades','UNSTA','Ing. en Sistemas','Plan 2023','Correlativas']}
      pageEyebrow="UNSTA · ISI · Plan 2023"
      pageTitle="Correlativas"
      pageSub="Validamos el grafo entero: ciclos, huérfanos, materias inalcanzables, año desordenado."
      actions={<>
        <button className="adm-btn">Ver grafo</button>
        <button className="adm-btn primary">Re-validar</button>
      </>}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:14}}>
        <div className="adm-card">
          <div className="h"><h3>Reglas por materia</h3><small>cursar / rendir final</small></div>
          <AdmTable dense
            columns={[
              { key:'code', label:'Materia', w:'100px', mono:true },
              { key:'cur',  label:'Para cursar', w:'1.6fr', mono:true, muted:true },
              { key:'fin',  label:'Para rendir final', w:'1.6fr', mono:true, muted:true },
              { key:'val',  label:'Validación', w:'130px',
                cell: r => r.val === 'ok' ? <span className="adm-vchip">✓ ok</span> : r.val === 'warn' ? <span className="adm-vchip warn">⚠ revisar</span> : <span className="adm-vchip err">✕ error</span> },
              { key:'act',  label:'', w:'40px', align:'right',
                cell: () => <button className="adm-btn ghost sm">✎</button> },
            ]}
            rows={[
              { id:1, code:'MAT102', cur:'MAT101 reg.', fin:'MAT101 apr.', val:'ok' },
              { id:2, code:'PRG102', cur:'PRG101 reg.', fin:'PRG101 apr.', val:'ok' },
              { id:3, code:'BD201',  cur:'PRG102 reg.', fin:'PRG102 apr.', val:'ok' },
              { id:4, code:'ISW301', cur:'BD201 reg., EDA201 reg.', fin:'BD201 apr., EDA201 apr.', val:'ok' },
              { id:5, code:'ISW302', cur:'ISW301 reg.', fin:'ISW301 apr.', val:'ok' },
              { id:6, code:'INT302', cur:'EDA201 reg.', fin:'EDA201 apr.', val:'ok' },
              { id:7, code:'IA-NEW', cur:'INT302 apr., MAT204 apr.', fin:'INT302 apr.', val:'err' },
              { id:8, code:'SEG401', cur:'ISW302 reg.', fin:'ISW302 apr.', val:'warn' },
            ]}/>
        </div>
        <div className="adm-card">
          <div className="h"><h3>Salud del grafo</h3><small>análisis</small></div>
          <div style={{display:'flex', flexDirection:'column', gap:9}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--adm-line-2)'}}>
              <span style={{fontSize:12}}>Ciclos detectados</span>
              <span className="adm-vchip">0</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--adm-line-2)'}}>
              <span style={{fontSize:12}}>Materias huérfanas</span>
              <span className="adm-vchip">0</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--adm-line-2)'}}>
              <span style={{fontSize:12}}>Inalcanzables</span>
              <span className="adm-vchip warn">1</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--adm-line-2)'}}>
              <span style={{fontSize:12}}>Correlativa inválida</span>
              <span className="adm-vchip err">1</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0'}}>
              <span style={{fontSize:12}}>Año desordenado</span>
              <span className="adm-vchip">0</span>
            </div>
          </div>
          <div style={{marginTop:12, padding:10, background:'#fbe5d6', borderRadius:6, fontSize:11.5, color:'#b04a1c', lineHeight:1.5}}>
            <b>IA-NEW</b> requiere <code style={{fontFamily:'IBM Plex Mono,monospace'}}>MAT204</code> que no existe en este plan. Sugerencia: <code style={{fontFamily:'IBM Plex Mono,monospace'}}>MAT201</code>.
          </div>
          <button className="adm-btn sm primary" style={{width:'100%', marginTop:10}}>Aplicar sugerencias (1)</button>
        </div>
      </div>
    </AdmShell>
  );
}

// ── Importador con preview/diff ────────────────────────────
function AdmImportador() {
  return (
    <AdmShell active="imp" crumbs={['Importador']}
      pageEyebrow="Datos académicos"
      pageTitle="Importador"
      pageSub="Pegá un CSV o JSON y te mostramos un preview con diff antes de aplicar. Nunca se aplica solo."
      actions={<>
        <button className="adm-btn">Bajar plantilla</button>
        <button className="adm-btn">Ver formato esperado</button>
      </>}>
      <div className="adm-card" style={{marginBottom:14}}>
        <div className="h"><h3>Origen</h3><small>paso 1</small></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10}}>
          <div className="adm-field" style={{margin:0}}>
            <label>Universidad</label>
            <select defaultValue="unsta"><option value="unsta">UNSTA</option></select>
          </div>
          <div className="adm-field" style={{margin:0}}>
            <label>Carrera</label>
            <select defaultValue="isi"><option value="isi">Ing. en Sistemas</option></select>
          </div>
          <div className="adm-field" style={{margin:0}}>
            <label>Plan destino</label>
            <select defaultValue="2023"><option value="2023">Plan 2023 (vigente)</option></select>
          </div>
        </div>
        <textarea rows="5" style={{width:'100%', padding:'9px 11px', fontFamily:'IBM Plex Mono,monospace', fontSize:11, border:'1px solid var(--adm-line)', borderRadius:5, background:'var(--adm-bg-card)', outline:'none', resize:'vertical', lineHeight:1.5}}
          defaultValue={"code,name,year,mod,credits,prereq\nMAT101,Análisis Matemático I,1,1c,8,\nPRG101,Programación I,1,1c,6,\nMAT102,Análisis Matemático II,1,2c,8,MAT101\nPRG102,Programación II,1,2c,8,PRG101\nIA-NEW,Aprendizaje Profundo,4,1c,8,INT302"}></textarea>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
          <span style={{fontSize:11.5, color:'var(--ink-3)'}}>Detectadas: <b>5 filas</b> · separador: <code style={{fontFamily:'IBM Plex Mono,monospace'}}>,</code> · encoding: UTF-8</span>
          <button className="adm-btn primary sm">Generar preview →</button>
        </div>
      </div>

      <div className="adm-card">
        <div className="h">
          <h3>Preview · diff vs. plan vigente</h3>
          <small>paso 2 · revisá antes de aplicar</small>
        </div>
        <div style={{display:'flex', gap:10, marginBottom:10, fontSize:11.5}}>
          <span className="adm-vchip">+2 nuevas</span>
          <span className="adm-vchip warn">⚠ 1 modificada</span>
          <span className="adm-vchip err">✕ 1 inválida</span>
          <span className="adm-pill" style={{marginLeft:'auto'}}>3 sin cambio</span>
        </div>
        <div style={{border:'1px solid var(--adm-line)', borderRadius:6, overflow:'hidden'}}>
          <div className="adm-diff-row" style={{background:'var(--adm-bg-elev)', fontFamily:'IBM Plex Mono,monospace', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--ink-3)', padding:'7px 12px'}}>
            <div></div><div>código</div><div>nombre</div><div>año</div><div>mod</div><div>créd</div><div>correl.</div>
          </div>
          {[
            { cls:'',    gut:' ', code:'MAT101', name:'Análisis Matemático I',      year:'1', mod:'1c', cr:'8',  pre:'—',         note:null },
            { cls:'',    gut:' ', code:'PRG101', name:'Programación I',              year:'1', mod:'1c', cr:'6',  pre:'—',         note:null },
            { cls:'add', gut:'+', code:'MAT102', name:'Análisis Matemático II',      year:'1', mod:'2c', cr:'8',  pre:'MAT101',    note:'nueva' },
            { cls:'mod', gut:'~', code:'PRG102', name:'Programación II',             year:'1', mod:'2c', cr:'8',  pre:'PRG101',    note:'créditos: 6 → 8' },
            { cls:'add', gut:'+', code:'IA-NEW', name:'Aprendizaje Profundo',        year:'4', mod:'1c', cr:'8',  pre:'INT302',    note:'nueva · INT302 ✓' },
          ].map(r => (
            <div key={r.code} className={'adm-diff-row ' + r.cls}>
              <div className="gut">{r.gut}</div>
              <div style={{fontFamily:'IBM Plex Mono,monospace'}}>{r.code}</div>
              <div>
                {r.name}
                {r.note && <span style={{marginLeft:8, fontSize:10.5, color:'var(--ink-3)'}}>· {r.note}</span>}
              </div>
              <div style={{fontFamily:'IBM Plex Mono,monospace'}}>{r.year}</div>
              <div style={{fontFamily:'IBM Plex Mono,monospace'}}>{r.mod}</div>
              <div style={{fontFamily:'IBM Plex Mono,monospace', textAlign:'right'}}>{r.cr}</div>
              <div style={{fontFamily:'IBM Plex Mono,monospace', color:'var(--ink-3)'}}>{r.pre}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12, padding:'10px 12px', background:'#fbe5d6', borderRadius:6, fontSize:11.5, color:'#b04a1c', lineHeight:1.5}}>
          <b>1 fila descartada:</b> <code style={{fontFamily:'IBM Plex Mono,monospace'}}>FIS-X</code> — referencia correlativa <code style={{fontFamily:'IBM Plex Mono,monospace'}}>QUI301</code> que no existe en este plan. Resolvé antes de aplicar.
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:7, marginTop:14}}>
          <button className="adm-btn ghost">Descartar</button>
          <button className="adm-btn">Bajar diff</button>
          <button className="adm-btn primary">Aplicar 4 cambios</button>
        </div>
      </div>
    </AdmShell>
  );
}

// ── Materias · catálogo ────────────────────────────────────
function AdmMateriasList() {
  return (
    <AdmShell active="mat" crumbs={['Materias']}
      pageEyebrow="Datos académicos"
      pageTitle="Catálogo de materias"
      pageSub="1.247 materias en plan-b. Edición rápida, merge de duplicados, alertas de calidad."
      actions={<>
        <button className="adm-btn">Detectar duplicados</button>
        <button className="adm-btn primary">+ Materia</button>
      </>}>
      <AdmFilters>
        <AdmFilterChip label="Todas" value="1.247" on/>
        <AdmFilterChip label="UNSTA" value="312"/>
        <AdmFilterChip label="UTN" value="420"/>
        <AdmFilterChip label="UBA" value="240"/>
        <span style={{flex:1}}/>
        <AdmFilterChip label="Posibles duplicadas" value="14"/>
        <AdmFilterChip label="Sin reseñas" value="89"/>
      </AdmFilters>
      <AdmTable
        columns={[
          { key:'code',  label:'Código',   w:'95px',  mono:true },
          { key:'name',  label:'Materia',  w:'2fr' },
          { key:'uni',   label:'Uni · carrera', w:'1.6fr', muted:true },
          { key:'docs',  label:'Docentes', w:'80px', mono:true, align:'right' },
          { key:'rev',   label:'Reseñas',  w:'80px', mono:true, align:'right' },
          { key:'flag',  label:'Flags',    w:'150px',
            cell: r => r.flag ? <span className={'adm-vchip ' + (r.flag.tone || 'warn')}>{r.flag.txt}</span> : null },
          { key:'act',   label:'',         w:'80px', align:'right',
            cell: () => <button className="adm-btn sm">Abrir →</button> },
        ]}
        rows={[
          { id:1, code:'MAT101', name:'Análisis Matemático I',      uni:'UNSTA · ISI', docs:'4', rev:'120', flag:null },
          { id:2, code:'AM-1',   name:'Análisis Matemático I',      uni:'UTN-FRBA · ISI', docs:'8', rev:'320', flag:{txt:'posible duplicado UNSTA', tone:'warn'} },
          { id:3, code:'ANI',    name:'Análisis I',                  uni:'UBA-FCEN · LCD', docs:'6', rev:'180', flag:{txt:'posible duplicado UNSTA', tone:'warn'} },
          { id:4, code:'PRG101', name:'Programación I',              uni:'UNSTA · ISI', docs:'3', rev:'98',  flag:null },
          { id:5, code:'BD201',  name:'Bases de Datos',              uni:'UNSTA · ISI', docs:'2', rev:'142', flag:null },
          { id:6, code:'ISW302', name:'Ingeniería de Software II',   uni:'UNSTA · ISI', docs:'1', rev:'64',  flag:null },
          { id:7, code:'IA-NEW', name:'Aprendizaje Profundo',        uni:'UNSTA · ISI', docs:'0', rev:'0',   flag:{txt:'sin docente', tone:'warn'} },
          { id:8, code:'COM-X',  name:'Comunicación de Datos',       uni:'UTN-FRT · ISI', docs:'0', rev:'0', flag:{txt:'huérfana', tone:'err'} },
        ]}/>
    </AdmShell>
  );
}

// ── Materias · merge ────────────────────────────────────────
function AdmMateriasMerge() {
  const Pane = ({ side, code, sel }) => (
    <div className="adm-card" style={{borderColor: sel ? 'var(--accent)' : 'var(--adm-line)', boxShadow: sel ? '0 0 0 2px var(--accent-soft)' : 'none'}}>
      <div className="h">
        <h3>{side}</h3>
        <small>{code}</small>
      </div>
      <dl className="adm-kv">
        <dt>Nombre</dt>
        <dd style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>{side === 'A · UNSTA' ? 'Análisis Matemático I' : 'Análisis Mat. I'}</span>
          <input type="radio" name="name" defaultChecked={side === 'A · UNSTA'} style={{accentColor:'var(--accent)'}}/>
        </dd>
        <dt>Universidad</dt>
        <dd>{side === 'A · UNSTA' ? 'UNSTA · ISI · plan-2023' : 'UNSTA · IIN · plan-2022'}</dd>
        <dt>Código oficial</dt>
        <dd style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span style={{fontFamily:'IBM Plex Mono,monospace'}}>{code}</span>
          <input type="radio" name="code" defaultChecked={side === 'A · UNSTA'} style={{accentColor:'var(--accent)'}}/>
        </dd>
        <dt>Año</dt><dd>1</dd>
        <dt>Modalidad</dt><dd>1c</dd>
        <dt>Docentes</dt><dd>{side === 'A · UNSTA' ? '4 vinculados' : '2 vinculados'}</dd>
        <dt>Reseñas</dt><dd>{side === 'A · UNSTA' ? '120' : '34'} → mantener todas</dd>
        <dt>Creada</dt><dd>{side === 'A · UNSTA' ? 'mar 2023' : 'jul 2024'}</dd>
      </dl>
    </div>
  );
  return (
    <AdmShell active="mat" crumbs={['Materias','Mergear duplicado']}
      pageEyebrow="Materias · merge"
      pageTitle="Resolver duplicado"
      pageSub="Sistema detectó dos materias con nombres similares en UNSTA. Elegí qué campos sobreviven; las reseñas se preservan todas en la materia resultante."
      actions={<button className="adm-btn ghost">Marcar como no duplicadas</button>}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 60px 1fr', gap:14, alignItems:'flex-start', marginBottom:18}}>
        <Pane side="A · UNSTA" code="MAT101" sel/>
        <div style={{textAlign:'center', paddingTop:60, fontFamily:'IBM Plex Mono,monospace', fontSize:18, color:'var(--ink-3)'}}>⇒</div>
        <Pane side="B · UNSTA" code="AMI-101" sel={false}/>
      </div>
      <div className="adm-card" style={{background:'#e8f0e0', border:'1px solid #c8d8b0', maxWidth:780}}>
        <div style={{fontSize:13, fontWeight:600, marginBottom:6}}>Resultado del merge</div>
        <div style={{fontSize:12.5, color:'var(--ink-2)', lineHeight:1.6}}>
          Sobrevive: <b>Análisis Matemático I</b> · código <code style={{fontFamily:'IBM Plex Mono,monospace'}}>MAT101</code><br/>
          Se reasignan: <b>2 docentes</b> · <b>34 reseñas</b> · <b>3 comisiones</b> hacia <code style={{fontFamily:'IBM Plex Mono,monospace'}}>MAT101</code>.<br/>
          Se archiva: <code style={{fontFamily:'IBM Plex Mono,monospace'}}>AMI-101</code> con redirect permanente.
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:7, marginTop:14}}>
          <button className="adm-btn">Cancelar</button>
          <button className="adm-btn primary">Aplicar merge</button>
        </div>
      </div>
    </AdmShell>
  );
}

// ── Docentes · listado ─────────────────────────────────────
function AdmDocentesList() {
  return (
    <AdmShell active="doc" crumbs={['Docentes']}
      pageEyebrow="Datos académicos"
      pageTitle="Docentes"
      pageSub="380 docentes en plan-b. Sus datos los aporta la comunidad vía reseñas — el equipo modera y mergea."
      actions={<>
        <button className="adm-btn">Detectar duplicados</button>
        <button className="adm-btn primary">+ Docente</button>
      </>}>
      <AdmFilters>
        <AdmFilterChip label="Todos" value="380" on/>
        <AdmFilterChip label="UNSTA" value="86"/>
        <AdmFilterChip label="UTN" value="142"/>
        <span style={{flex:1}}/>
        <AdmFilterChip label="Sin verificar" value="34"/>
        <AdmFilterChip label="Con flags" value="6"/>
      </AdmFilters>
      <AdmTable
        columns={[
          { key:'id',     label:'ID',         w:'80px',  mono:true, muted:true },
          { key:'name',   label:'Nombre',     w:'2fr' },
          { key:'uni',    label:'Universidad', w:'120px', muted:true },
          { key:'mats',   label:'Materias',   w:'70px',  mono:true, align:'right' },
          { key:'rev',    label:'Reseñas',    w:'80px',  mono:true, align:'right' },
          { key:'rate',   label:'Rating',     w:'70px',  mono:true, align:'right' },
          { key:'flag',   label:'',           w:'120px',
            cell: r => r.flag ? <span className={'adm-vchip ' + (r.flag.tone || 'warn')}>{r.flag.txt}</span> : null },
          { key:'act',    label:'',           w:'70px',  align:'right',
            cell: () => <button className="adm-btn sm">Abrir →</button> },
        ]}
        rows={[
          { id:'doc_412', name:'Brandt, Carlos',     uni:'UNSTA',   mats:'2', rev:'88',  rate:'4.4', flag:null },
          { id:'doc_490', name:'Brandt C.',          uni:'UNSTA',   mats:'1', rev:'12',  rate:'4.1', flag:{txt:'posible dup. doc_412', tone:'warn'} },
          { id:'doc_213', name:'Reynoso, Ana',       uni:'UNSTA',   mats:'3', rev:'74',  rate:'4.7', flag:null },
          { id:'doc_088', name:'Iturralde, Mauro',   uni:'UNSTA',   mats:'1', rev:'52',  rate:'3.9', flag:null },
          { id:'doc_504', name:'Sosa, Romina',       uni:'UNSTA',   mats:'2', rev:'68',  rate:'4.2', flag:null },
          { id:'doc_611', name:'Castellanos, Luis',  uni:'UNSTA',   mats:'1', rev:'34',  rate:'3.6', flag:{txt:'2 reportes', tone:'err'} },
          { id:'doc_722', name:'Méndez, Carla',      uni:'UNSTA',   mats:'1', rev:'18',  rate:'4.0', flag:{txt:'sin verificar', tone:'warn'} },
          { id:'doc_891', name:'Pereyra, Hernán',    uni:'UTN-FRBA',mats:'2', rev:'140', rate:'3.8', flag:null },
        ]}/>
    </AdmShell>
  );
}

// ── Comisiones (oferta del cuatri) ──────────────────────────
function AdmComisiones() {
  return (
    <AdmShell active="com" crumbs={['Comisiones']}
      pageEyebrow="Datos académicos · oferta"
      pageTitle="Comisiones · 2026·1c"
      pageSub="Lo que se está dictando este cuatri. Cada cuatri se vuelve a publicar — los datos viejos quedan en el historial."
      actions={<>
        <button className="adm-btn">Cuatri anterior</button>
        <button className="adm-btn primary">Importar oferta</button>
      </>}>
      <AdmFilters>
        <AdmFilterChip label="Todas" value="384" on/>
        <AdmFilterChip label="UNSTA" value="34"/>
        <AdmFilterChip label="UTN-FRBA" value="120"/>
        <span style={{flex:1}}/>
        <AdmFilterChip label="Sin docente" value="8"/>
        <AdmFilterChip label="Sin horario" value="3"/>
      </AdmFilters>
      <AdmTable dense
        columns={[
          { key:'mat',   label:'Materia',  w:'2fr' },
          { key:'uni',   label:'Uni',      w:'90px',  muted:true },
          { key:'com',   label:'Com.',     w:'60px',  mono:true, align:'center' },
          { key:'doc',   label:'Docente',  w:'1.6fr', muted:true },
          { key:'hor',   label:'Horario',  w:'1.4fr', mono:true, muted:true },
          { key:'aula',  label:'Aula',     w:'80px',  mono:true, muted:true },
          { key:'cap',   label:'Cupo',     w:'70px',  mono:true, align:'right' },
          { key:'flag',  label:'',         w:'110px',
            cell: r => r.flag ? <span className={'adm-vchip ' + (r.flag.tone || 'warn')}>{r.flag.txt}</span> : null },
        ]}
        rows={[
          { id:1, mat:'Análisis Matemático I',      uni:'UNSTA',   com:'A', doc:'Brandt, Carlos',  hor:'Lu/Mi 18–21', aula:'B-203', cap:'42/50', flag:null },
          { id:2, mat:'Análisis Matemático I',      uni:'UNSTA',   com:'B', doc:'— sin asignar',   hor:'Ma/Ju 18–21', aula:'B-203', cap:'0/50',  flag:{txt:'sin docente', tone:'warn'} },
          { id:3, mat:'Programación I',              uni:'UNSTA',   com:'A', doc:'Iturralde, Mauro',hor:'Lu/Vi 9–12',  aula:'L-104', cap:'48/50', flag:null },
          { id:4, mat:'Bases de Datos',              uni:'UNSTA',   com:'A', doc:'Castellanos, L.', hor:'Mi/Vi 18–21', aula:'B-301', cap:'40/50', flag:null },
          { id:5, mat:'Ingeniería de Software II',   uni:'UNSTA',   com:'A', doc:'Brandt, Carlos',  hor:'Ma/Ju 18–21', aula:'L-203', cap:'34/40', flag:null },
          { id:6, mat:'Inteligencia Artificial I',   uni:'UNSTA',   com:'A', doc:'Iturralde, Mauro',hor:'Lu/Mi 19–22', aula:'L-104', cap:'38/40', flag:null },
          { id:7, mat:'Seguridad Informática',       uni:'UNSTA',   com:'A', doc:'Sosa, Romina',    hor:'—',           aula:'—',     cap:'0/30',  flag:{txt:'sin horario', tone:'warn'} },
          { id:8, mat:'Programación I',              uni:'UTN-FRBA',com:'C', doc:'Pereyra, Hernán', hor:'Sá 9–13',     aula:'A-220', cap:'45/45', flag:null },
        ]}/>
    </AdmShell>
  );
}

window.AdmUniList = AdmUniList;
window.AdmUniDetalle = AdmUniDetalle;
window.AdmCarreraDetalle = AdmCarreraDetalle;
window.AdmPlanEditor = AdmPlanEditor;
window.AdmCorrelativasEditor = AdmCorrelativasEditor;
window.AdmImportador = AdmImportador;
window.AdmMateriasList = AdmMateriasList;
window.AdmMateriasMerge = AdmMateriasMerge;
window.AdmDocentesList = AdmDocentesList;
window.AdmComisiones = AdmComisiones;
