// admin-screens-3: Moderación + operación.

// ── Reportes · cola ────────────────────────────────────────
function AdmReportesCola() {
  const rows = [
    { id:'rep_1108', when:'hace 12 min', who:'usr_4421', target:'rev_8821',  reason:'Insulto al docente',           snippet:'"…es un inútil que no debería dar clases…"', tone:'urgent' },
    { id:'rep_1107', when:'hace 38 min', who:'usr_3144', target:'rev_8814',  reason:'Información personal',          snippet:'"…vive cerca de la facu en la calle Junín…"', tone:'urgent' },
    { id:'rep_1106', when:'hace 1 h',    who:'usr_8800', target:'rev_8809',  reason:'Spam',                          snippet:'"comprá apuntes en mi insta @apuntes…"',     tone:'normal' },
    { id:'rep_1105', when:'hace 2 h',    who:'usr_4421', target:'rev_8801',  reason:'Crítica al curso, no al docente', snippet:'"…la materia está mal armada, hay que cambiarla…"', tone:'low' },
    { id:'rep_1104', when:'hace 4 h',    who:'usr_5512', target:'rev_8794',  reason:'Datos falsos',                  snippet:'"…dice que tomó parcial pero ese cuatri no se rindió…"', tone:'normal' },
    { id:'rep_1103', when:'hace 8 h',    who:'usr_2241', target:'rev_8780',  reason:'Insulto al docente',            snippet:'"…es un inepto y un nepotista…"',           tone:'urgent' },
    { id:'rep_1102', when:'hace 1 d',    who:'usr_7770', target:'rev_8744',  reason:'Discurso de odio',              snippet:'"…las mujeres no deberían dar matemática…"', tone:'urgent' },
    { id:'rep_1101', when:'hace 1 d',    who:'usr_1100', target:'rev_8731',  reason:'Discrimina',                    snippet:'"…ese profe es un boliviano que no entiende…"', tone:'urgent' },
    { id:'rep_1100', when:'hace 2 d',    who:'usr_3344', target:'rev_8704',  reason:'Spam',                          snippet:'"…descuentos en libros, escribime al…"',      tone:'normal' },
    { id:'rep_1099', when:'hace 3 d',    who:'usr_5511', target:'rev_8688',  reason:'Repetida',                      snippet:'"…ya reportada hace 2 días por otro usuario…"', tone:'low' },
  ];
  const ToneDot = ({ t }) => {
    const c = t === 'urgent' ? '#b04a1c' : t === 'normal' ? '#945a14' : 'var(--ink-4)';
    return <span style={{display:'inline-block', width:7, height:7, borderRadius:'50%', background:c}}/>;
  };
  return (
    <AdmShell active="rep" crumbs={['Reportes']}
      pageEyebrow="Moderación"
      pageTitle="Cola de reportes"
      pageSub="14 abiertos · 3 con +48h sin tocar. Orden: urgencia primero, después antigüedad."
      actions={<>
        <button className="adm-btn ghost">Asignar a alguien</button>
        <button className="adm-btn">Exportar cola</button>
      </>}>
      <AdmFilters>
        <AdmFilterChip label="Abiertos" value="14" on/>
        <AdmFilterChip label="Cerrados (7d)" value="58"/>
        <span style={{flex:1}}/>
        <AdmFilterChip label="🔴 Urgentes" value="5"/>
        <AdmFilterChip label="🟡 Normales" value="6"/>
        <AdmFilterChip label="⚪ Bajos" value="3"/>
      </AdmFilters>
      <AdmTable
        columns={[
          { key:'tone',   label:'',         w:'24px', cell: r => <ToneDot t={r.tone}/> },
          { key:'id',     label:'Reporte',  w:'90px', mono:true },
          { key:'reason', label:'Motivo',   w:'180px' },
          { key:'snippet',label:'Cita',     w:'2fr',  muted:true,
            cell: r => <span style={{fontStyle:'italic'}}>{r.snippet}</span> },
          { key:'target', label:'Reseña',   w:'90px', mono:true, muted:true },
          { key:'who',    label:'Reportó',  w:'90px', mono:true, muted:true },
          { key:'when',   label:'Hace',     w:'90px', muted:true, align:'right' },
          { key:'act',    label:'',         w:'90px', align:'right',
            cell: () => <button className="adm-btn sm">Decidir →</button> },
        ]}
        rows={rows}/>
    </AdmShell>
  );
}

// ── Reporte · detalle ──────────────────────────────────────
function AdmReporteDetalle() {
  return (
    <AdmShell active="rep" crumbs={['Reportes','rep_1108']}
      pageEyebrow="Reporte · rep_1108 · hace 12 min"
      pageTitle="Insulto al docente"
      pageSub="Reseña rev_8821 sobre Brandt, Carlos · Ingeniería de Software II · UNSTA · cuatri 2025·2c."
      actions={<button className="adm-btn ghost">Saltar reporte</button>}>
      <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:14}}>
        {/* La reseña */}
        <div className="adm-card">
          <div className="h">
            <h3>Reseña reportada</h3>
            <small>rev_8821 · pública</small>
          </div>
          <div style={{display:'flex', gap:8, marginBottom:10, fontSize:11.5, color:'var(--ink-3)'}}>
            <span>Anónimo</span>
            <span>·</span>
            <span>4° año</span>
            <span>·</span>
            <span>cursó 2025·2c · com. A</span>
            <span>·</span>
            <span style={{fontFamily:'IBM Plex Mono,monospace'}}>verificada</span>
          </div>
          <div style={{padding:'10px 14px', background:'var(--adm-bg-elev)', borderRadius:6, fontSize:13.5, lineHeight:1.55, color:'var(--ink)'}}>
            La cursada estuvo bien armada, los TPs eran exigentes pero claros.
            Ahora, el docente a cargo deja mucho que desear. <b style={{background:'#fbe5d6', padding:'1px 4px'}}>Es un inútil que no debería dar clases</b>, no responde mails, llega tarde, y cuando la clase no entiende algo se enoja en lugar de explicar de nuevo.
            Si te toca esta comisión, andá preparado.
          </div>
          <div style={{display:'flex', gap:14, marginTop:12, fontSize:11.5, color:'var(--ink-3)'}}>
            <span>Materia: <b style={{color:'var(--ink-2)'}}>★ 4 / 5</b></span>
            <span>Docente: <b style={{color:'var(--ink-2)'}}>★ 1 / 5</b></span>
            <span>Comisión: <b style={{color:'var(--ink-2)'}}>★ 3 / 5</b></span>
          </div>
        </div>

        {/* Decisión */}
        <div className="adm-card">
          <div className="h"><h3>Decisión</h3><small>queda en audit log</small></div>
          <div style={{display:'flex', flexDirection:'column', gap:7, marginBottom:14}}>
            {[
              ['Aprobar', 'La crítica es legítima aunque dura. Se queda visible.', 'live'],
              ['Pedir edición al autor', 'Mensaje al autor con plazo de 48h para suavizar.', 'draft'],
              ['Ocultar reseña', 'Solo visible al autor. No banea.', 'draft'],
              ['Ocultar + advertir al autor', 'Strike 1. Otra y va a ban temporal.', 'danger'],
              ['Ocultar + banear al autor', 'Acción terminal. Solo casos serios.', 'danger'],
            ].map(([t, s, tone], i) => (
              <label key={t} style={{display:'flex', gap:9, alignItems:'flex-start', padding:'8px 10px', border:'1px solid '+ (i === 3 ? 'var(--accent)' : 'var(--adm-line)'), borderRadius:6, cursor:'pointer', background: i === 3 ? 'var(--accent-soft)' : 'var(--adm-bg-card)'}}>
                <input type="radio" name="decision" defaultChecked={i === 3} style={{marginTop:2, accentColor:'var(--accent)'}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12.5, fontWeight:500, color: tone === 'danger' ? '#b04a1c' : 'var(--ink)'}}>{t}</div>
                  <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2, lineHeight:1.45}}>{s}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="adm-field" style={{margin:0}}>
            <label>Nota interna (opcional)</label>
            <textarea rows="3" placeholder="Razón de la decisión, para futuro." style={{padding:'8px 10px', fontSize:12, fontFamily:'inherit', border:'1px solid var(--adm-line)', borderRadius:5, background:'var(--adm-bg-card)', resize:'vertical', outline:'none'}}/>
          </div>
          <button className="adm-btn primary" style={{width:'100%', marginTop:10}}>Aplicar decisión</button>
        </div>
      </div>

      {/* Contexto del autor */}
      <div className="adm-card" style={{marginTop:14}}>
        <div className="h"><h3>Contexto del autor</h3><small>usr_4421 — Anónimo público</small></div>
        <div style={{display:'flex', gap:18, fontSize:12.5}}>
          <div><span style={{color:'var(--ink-3)'}}>Cuenta desde:</span> <b>2024·1c</b></div>
          <div><span style={{color:'var(--ink-3)'}}>Reseñas escritas:</span> <b>23</b></div>
          <div><span style={{color:'var(--ink-3)'}}>Reportes recibidos:</span> <b>3</b> (2 desestimados, 1 pendiente)</div>
          <div><span style={{color:'var(--ink-3)'}}>Strikes:</span> <b style={{color:'#945a14'}}>0</b></div>
          <div><span style={{color:'var(--ink-3)'}}>Estado:</span> <span className="adm-pill dot live">activo</span></div>
        </div>
      </div>
    </AdmShell>
  );
}

// ── Usuarios · listado ─────────────────────────────────────
function AdmUsuariosList() {
  return (
    <AdmShell active="usr" crumbs={['Usuarios']}
      pageEyebrow="Moderación"
      pageTitle="Usuarios"
      pageSub="8.412 alumnos verificados. Búsqueda por email, legajo, ID interno."
      actions={<button className="adm-btn">Exportar</button>}>
      <AdmFilters>
        <AdmFilterChip label="Activos" value="8.412" on/>
        <AdmFilterChip label="Con strikes" value="42"/>
        <AdmFilterChip label="Baneados" value="18"/>
        <AdmFilterChip label="Pendientes verif." value="120"/>
        <span style={{flex:1}}/>
        <span style={{fontSize:11, color:'var(--ink-3)', fontFamily:'IBM Plex Mono,monospace'}}>orden: actividad ↓</span>
      </AdmFilters>
      <AdmTable
        columns={[
          { key:'id',     label:'ID',         w:'90px',  mono:true, muted:true },
          { key:'email',  label:'Email',      w:'2.2fr', mono:true,
            cell: r => <span><span style={{color:'var(--ink)'}}>{r.email.split('@')[0]}</span><span style={{color:'var(--ink-3)'}}>@{r.email.split('@')[1]}</span></span> },
          { key:'uni',    label:'Uni',        w:'90px',  muted:true },
          { key:'rev',    label:'Reseñas',    w:'80px',  mono:true, align:'right' },
          { key:'stk',    label:'Strikes',    w:'70px',  mono:true, align:'right',
            cell: r => r.stk > 0 ? <span style={{color:'#945a14'}}>{r.stk}</span> : <span style={{color:'var(--ink-4)'}}>0</span> },
          { key:'last',   label:'Últ. login', w:'110px', muted:true, mono:true, align:'right' },
          { key:'st',     label:'Estado',     w:'95px',
            cell: r => <span className={'adm-pill dot ' + (r.st === 'banned' ? 'danger' : r.st === 'warn' ? 'draft' : 'live')}>{r.st === 'banned' ? 'baneado' : r.st === 'warn' ? 'strike' : 'activo'}</span> },
          { key:'act',    label:'',           w:'70px', align:'right',
            cell: () => <button className="adm-btn sm">Abrir →</button> },
        ]}
        rows={[
          { id:'usr_4421', email:'lourdes.aguero@unsta.edu.ar',  uni:'UNSTA',   rev:'23',  stk:0, last:'hace 2 h',  st:'active' },
          { id:'usr_3144', email:'l.mansilla@unsta.edu.ar',      uni:'UNSTA',   rev:'18',  stk:0, last:'hace 4 h',  st:'active' },
          { id:'usr_8800', email:'jperez@frba.utn.edu.ar',       uni:'UTN-FRBA',rev:'8',   stk:1, last:'hace 1 d',  st:'warn' },
          { id:'usr_2241', email:'msosa@unt.edu.ar',             uni:'UNT',     rev:'34',  stk:0, last:'hace 3 h',  st:'active' },
          { id:'usr_3344', email:'r.escudero@frba.utn.edu.ar',   uni:'UTN-FRBA',rev:'2',   stk:3, last:'hace 8 d',  st:'banned' },
          { id:'usr_5512', email:'a.giraldez@unc.edu.ar',        uni:'UNC',     rev:'12',  stk:0, last:'hace 1 h',  st:'active' },
          { id:'usr_7770', email:'spam01@itba.edu.ar',           uni:'ITBA',    rev:'1',   stk:2, last:'hace 5 d',  st:'banned' },
          { id:'usr_1100', email:'p.romero@uba.ar',              uni:'UBA',     rev:'19',  stk:1, last:'hace 6 h',  st:'warn' },
          { id:'usr_5511', email:'cgomez@austral.edu.ar',        uni:'AUSTRAL', rev:'40',  stk:0, last:'hace 12 h', st:'active' },
        ]}/>
    </AdmShell>
  );
}

// ── Usuario · detalle ──────────────────────────────────────
function AdmUsuarioDetalle() {
  return (
    <AdmShell active="usr" crumbs={['Usuarios','usr_4421']}
      pageEyebrow="Usuario · usr_4421"
      pageTitle="lourdes.aguero@unsta.edu.ar"
      pageSub="UNSTA · ISI · plan-2018 · 4° año · cuenta desde 2024·1c. Hacia afuera figura como Anónimo."
      actions={<>
        <button className="adm-btn">Mandar mensaje</button>
        <button className="adm-btn ghost danger">Banear…</button>
      </>}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:14}}>
        {[
          ['Reseñas escritas','23'],
          ['Reportes recibidos','3 · 2 desestimados'],
          ['Strikes','0'],
          ['Cuenta desde','feb 2024'],
        ].map(([l,v]) => (
          <div key={l} className="adm-stat">
            <div className="lbl">{l}</div>
            <div className="val" style={{fontSize:18}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="adm-tabs">
        <div className="tab on">Actividad <span className="n">23</span></div>
        <div className="tab">Reportes <span className="n">3</span></div>
        <div className="tab">Audit log</div>
      </div>

      <AdmTable dense
        columns={[
          { key:'when',   label:'Cuándo',  w:'120px', mono:true, muted:true },
          { key:'kind',   label:'Acción',  w:'130px' },
          { key:'about',  label:'Sobre',   w:'2fr',   muted:true },
          { key:'st',     label:'Estado',  w:'120px',
            cell: r => <span className={'adm-pill dot ' + (r.st === 'live' ? 'live' : r.st === 'flag' ? 'draft' : 'archived')}>{r.st === 'live' ? 'visible' : r.st === 'flag' ? 'reportada' : 'oculta'}</span> },
          { key:'act',    label:'',        w:'80px',  align:'right',
            cell: () => <button className="adm-btn sm ghost">Ver →</button> },
        ]}
        rows={[
          { id:1, when:'hace 12 min',  kind:'Escribió reseña',  about:'Brandt, C. · ISW302 · 2025·2c · com. A',     st:'flag' },
          { id:2, when:'hace 2 d',     kind:'Editó reseña',     about:'Iturralde, M. · INT302 · 2025·2c',           st:'live' },
          { id:3, when:'hace 5 d',     kind:'Reportó reseña',   about:'rev_8801 · Spam — desestimado',              st:'archived' },
          { id:4, when:'hace 8 d',     kind:'Escribió reseña',  about:'Sosa, R. · SEG302 · 2025·2c',                st:'live' },
          { id:5, when:'hace 12 d',    kind:'Cerró cuatri',     about:'Marcó 5 materias como aprobadas',            st:'live' },
          { id:6, when:'hace 14 d',    kind:'Publicó plan',     about:'Plan 2026·1c · 5 materias · 22 créditos',    st:'live' },
          { id:7, when:'hace 22 d',    kind:'Escribió reseña',  about:'Reynoso, A. · MAT401',                       st:'live' },
        ]}/>
    </AdmShell>
  );
}

// ── Migración de plan ──────────────────────────────────────
function AdmMigracionPlan() {
  return (
    <AdmShell active="mig" crumbs={['Migraciones','UNSTA · ISI','plan-2008 → plan-2023']}
      pageEyebrow="Operación · migración"
      pageTitle="Mapear plan 2008 → 2023"
      pageSub="62 alumnos siguen activos en el plan 2008. Mapeamos cada materia a su equivalente nuevo para que no pierdan progreso."
      actions={<>
        <button className="adm-btn ghost">Cancelar</button>
        <button className="adm-btn">Guardar borrador</button>
        <button className="adm-btn primary">Aplicar a 62 alumnos</button>
      </>}>
      <div style={{display:'flex', gap:10, marginBottom:14}}>
        {[
          ['Plan origen','2008','62 alumnos · 54 materias'],
          ['Plan destino','2023','58 materias · vigente'],
          ['Mapeadas','38','de 54'],
          ['Sin equivalente','4','requieren decisión'],
          ['Resueltas auto','12','match exacto por código'],
        ].map(([l, v, s]) => (
          <div key={l} className="adm-stat" style={{flex:1}}>
            <div className="lbl">{l}</div>
            <div className="val" style={{fontSize:18}}>{v}</div>
            <div className="delta">{s}</div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <div className="h"><h3>Mapeo materia por materia</h3><small>54 filas · plan 2008</small></div>
        <AdmTable dense
          columns={[
            { key:'old',  label:'Plan 2008',          w:'1.6fr', mono:true },
            { key:'arr',  label:'',                   w:'30px',  align:'center', cell: () => <span style={{color:'var(--ink-4)'}}>→</span> },
            { key:'new',  label:'Plan 2023',          w:'1.6fr', mono:true,
              cell: r => r.new === '—' ? <span style={{color:'#b04a1c'}}>— sin equivalente</span> : <span>{r.new}</span> },
            { key:'kind', label:'Tipo',               w:'140px',
              cell: r => <span className={'adm-vchip ' + (r.kind === 'auto' ? '' : r.kind === 'manual' ? 'warn' : 'err')}>{r.kind === 'auto' ? '✓ auto' : r.kind === 'manual' ? '✎ manual' : '✕ falta resolver'}</span> },
            { key:'aff',  label:'Afectados',          w:'90px',  mono:true, align:'right' },
            { key:'act',  label:'',                   w:'80px',  align:'right',
              cell: r => r.kind === 'pending' ? <button className="adm-btn sm primary">Mapear</button> : <button className="adm-btn sm ghost">✎</button> },
          ]}
          rows={[
            { id:1,  old:'MAT101 · Análisis Mat. I',          new:'MAT101 · Análisis Matemático I',     kind:'auto',    aff:'62' },
            { id:2,  old:'MAT102 · Análisis Mat. II',         new:'MAT102 · Análisis Matemático II',    kind:'auto',    aff:'58' },
            { id:3,  old:'PRG-1 · Algorítmica I',             new:'PRG101 · Programación I',            kind:'manual',  aff:'62' },
            { id:4,  old:'PRG-2 · Algorítmica II',            new:'PRG102 · Programación II',           kind:'manual',  aff:'52' },
            { id:5,  old:'BD · Bases de Datos',               new:'BD201 · Bases de Datos',             kind:'manual',  aff:'42' },
            { id:6,  old:'IS-1 · Ingeniería de Software',     new:'ISW301 · Ingeniería de Software I',  kind:'manual',  aff:'34' },
            { id:7,  old:'IS-2 · Ingeniería de Software 2',   new:'ISW302 · Ingeniería de Software II', kind:'manual',  aff:'18' },
            { id:8,  old:'COMP · Computación Cuántica',       new:'—',                                  kind:'pending', aff:'12' },
            { id:9,  old:'TEC · Tecnologías Web',             new:'—',                                  kind:'pending', aff:'8'  },
            { id:10, old:'OPT-1 · Electiva Compiladores',     new:'OPT-COMP · Compiladores',            kind:'manual',  aff:'6'  },
          ]}/>
      </div>

      <div className="adm-card" style={{marginTop:14, background:'#f6ead7', border:'1px solid #e8d3a0', maxWidth:780}}>
        <div style={{fontSize:13, fontWeight:600, marginBottom:6}}>4 materias sin equivalente</div>
        <div style={{fontSize:12.5, color:'var(--ink-2)', lineHeight:1.55}}>
          Antes de aplicar la migración tenemos que decidir qué hacer con las materias que no existen en el plan 2023.
          Opciones: <b>(a)</b> dar por aprobada con nota original, <b>(b)</b> dar por equivalencia parcial a otra materia, <b>(c)</b> dejar sin equivalente y que el alumno lo resuelva con la facu.
        </div>
      </div>
    </AdmShell>
  );
}

window.AdmReportesCola = AdmReportesCola;
window.AdmReporteDetalle = AdmReporteDetalle;
window.AdmUsuariosList = AdmUsuariosList;
window.AdmUsuarioDetalle = AdmUsuarioDetalle;
window.AdmMigracionPlan = AdmMigracionPlan;
