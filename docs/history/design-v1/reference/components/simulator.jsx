// Vista: Simulador de inscripción del cuatrimestre
function Calendar({ blocks, density='regular' }) {
  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb'];
  const hours = [];
  for (let h=8; h<=22; h++) hours.push(h);

  // detectar conflictos
  const conflicts = new Set();
  for (let i=0; i<blocks.length; i++) {
    for (let j=i+1; j<blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      if (a.day === b.day && !(a.end <= b.start || b.end <= a.start)) {
        conflicts.add(a.id); conflicts.add(b.id);
      }
    }
  }

  const ROW_H = density==='compact' ? 22 : density==='comfy' ? 32 : 26;

  return (
    <div className="cal" style={{gridTemplateRows: `auto repeat(${hours.length-1}, ${ROW_H}px)`}}>
      <div className="cal-h"></div>
      {days.map(d=><div key={d} className="cal-h">{d}</div>)}
      {hours.slice(0,-1).map((h,hi)=>(
        <React.Fragment key={h}>
          <div className="cal-time">{String(h).padStart(2,'0')}:00</div>
          {days.map(d=>{
            const block = blocks.find(b => b.day === d && b.start === h);
            return (
              <div key={d+h} className="cal-cell">
                {block && (
                  <div className={`cal-block ${conflicts.has(block.id)?'conflict':''}`}
                    style={{
                      height: ((block.end - block.start) * ROW_H + (block.end-block.start-1)) +'px',
                      background: block.color || 'var(--accent-soft)',
                      color: block.fg || 'var(--accent-ink)',
                    }}>
                    <div>
                      <div style={{fontWeight:600,fontSize:11}}>{block.code}</div>
                      <div style={{fontSize:10,opacity:0.8}}>{block.name}</div>
                    </div>
                    <div className="cb-meta">{block.prof}</div>
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// Subject row — estilo Apricot Soft (lista sobria con divider + meta pills)
function SubjectChip({ subject, commission, onRemove, onPickComm, isLast }) {
  const COMM = window.PB_DATA.COMMISSIONS[subject.code] || [];
  const sel = COMM.find(c=>c.id===commission);
  const diffClass = subject.diff >= 4 ? 'hi' : subject.diff === 3 ? 'mid' : 'lo';
  const diffBg = diffClass === 'hi' ? 'var(--accent-soft)' : diffClass === 'mid' ? '#f6ead7' : '#e8f0e0';
  const diffFg = diffClass === 'hi' ? 'var(--accent-ink)' : diffClass === 'mid' ? '#945a14' : '#3d5a1f';
  return (
    <div style={{padding:'12px 0', borderBottom: isLast ? 0 : '1px solid var(--line-2)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8, marginBottom:8}}>
        <div>
          <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em',marginBottom:1}}>{subject.code}</div>
          <div style={{fontWeight:500,fontSize:13,lineHeight:1.3,color:'var(--ink)'}}>{subject.name}</div>
        </div>
        <button onClick={()=>onRemove(subject.code)} aria-label="Quitar"
          style={{appearance:'none',border:0,background:'none',color:'var(--ink-4)',cursor:'pointer',fontSize:14,lineHeight:1,padding:'2px 4px'}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--ink)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}>×</button>
      </div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
        {sel && (
          <span style={{display:'inline-flex',alignItems:'center',fontFamily:'var(--font-mono)',fontSize:10.5,padding:'2px 8px',borderRadius:'var(--radius-pill)',background:'var(--bg)',color:'var(--ink-2)',fontWeight:500}}>
            Com {sel.code}
          </span>
        )}
        <span style={{display:'inline-flex',alignItems:'center',fontSize:10.5,padding:'2px 8px',borderRadius:'var(--radius-pill)',background:'var(--bg)',color:'var(--ink-2)',fontWeight:500}}>
          {subject.hours}h
        </span>
        {sel && (
          <span style={{display:'inline-flex',alignItems:'center',fontSize:10.5,padding:'2px 8px',borderRadius:'var(--radius-pill)',background:'var(--bg)',color:'var(--ink-2)',fontWeight:500}}>
            {sel.prof}
          </span>
        )}
        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10.5,padding:'2px 8px',borderRadius:'var(--radius-pill)',background:diffBg,color:diffFg,fontWeight:500}}>
          <span style={{width:4,height:4,borderRadius:'50%',background:'currentColor',opacity:0.8}}/>
          dif {subject.diff}
        </span>
      </div>
      {COMM.length > 1 && (
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:8}}>
          {COMM.map(c=>{
            const full = c.enrolled >= c.capacity;
            const isSel = commission === c.id;
            return (
              <button key={c.id}
                onClick={()=>onPickComm(subject.code, c.id)}
                disabled={full && !isSel}
                style={{
                  appearance:'none',
                  border: isSel ? '1px solid var(--ink)' : '1px solid var(--line)',
                  background: isSel ? 'var(--ink)' : 'transparent',
                  color: isSel ? 'var(--bg-card)' : 'var(--ink-3)',
                  fontFamily:'var(--font-mono)',
                  fontSize:10,
                  padding:'3px 7px',
                  borderRadius:'var(--radius-pill)',
                  cursor: full && !isSel ? 'not-allowed' : 'pointer',
                  opacity: full && !isSel ? 0.4 : 1,
                }}>
                {c.code} · {c.slots.map(s=>s.d).join('+')} · {c.enrolled}/{c.capacity}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SimulatorView({ subjects, states, density, simInfo }) {
  const PALETTE = [
    {bg:'oklch(0.92 0.06 35 / 0.6)', fg:'oklch(0.4 0.14 35)'},
    {bg:'oklch(0.92 0.06 200 / 0.6)', fg:'oklch(0.4 0.14 220)'},
    {bg:'oklch(0.92 0.06 145 / 0.6)', fg:'oklch(0.4 0.12 145)'},
    {bg:'oklch(0.92 0.06 290 / 0.6)', fg:'oklch(0.4 0.14 290)'},
    {bg:'oklch(0.92 0.06 70 / 0.6)', fg:'oklch(0.4 0.12 60)'},
  ];

  // Default selection: avanzado típico recursando 3er año + electiva
  const [selected, setSelected] = useState([
    { code: 'ISW302', commission: 'ISW302-A' },
    { code: 'MOV302', commission: 'MOV302-A' },
    { code: 'INT302', commission: 'INT302-A' },
    { code: 'SEG302', commission: 'SEG302-A' },
    { code: 'MAT201', commission: 'MAT201-A' }, // recursada
  ]);

  // Materias disponibles a agregar (no estado approved/coursing/regularized)
  const candidates = useMemo(()=>{
    return subjects.filter(s => {
      const st = states[s.code];
      if (['approved','regularized','coursing'].includes(st)) return false;
      if (selected.find(x=>x.code===s.code)) return false;
      const ok = (s.prereqs||[]).every(p=>['approved','regularized'].includes(states[p]));
      return ok || st === 'failed';
    }).slice(0,8);
  }, [subjects, states, selected]);

  const selSubjects = selected.map(s=>({...subjects.find(x=>x.code===s.code), commission:s.commission}));

  const blocks = useMemo(()=>{
    const out = [];
    selSubjects.forEach((s,i)=>{
      const comms = window.PB_DATA.COMMISSIONS[s.code] || [];
      const c = comms.find(x=>x.id===s.commission);
      if (!c) return;
      const color = PALETTE[i % PALETTE.length];
      c.slots.forEach((slot,si)=>{
        out.push({
          id: `${s.code}-${si}`, code: s.code, name: s.name,
          day: slot.d, start: slot.s, end: slot.e,
          color: color.bg, fg: color.fg, prof: c.prof,
        });
      });
    });
    return out;
  }, [selected]);

  // Métricas agregadas
  const totalHours = selSubjects.reduce((a,s)=>a+s.hours,0);
  const avgDiff = selSubjects.length ? selSubjects.reduce((a,s)=>a+s.diff,0)/selSubjects.length : 0;
  const avgPass = selSubjects.length ? selSubjects.reduce((a,s)=>a+s.passRate,0)/selSubjects.length : 0;
  const weeklyHours = blocks.reduce((a,b)=>a+(b.end-b.start),0);
  const conflicts = (() => {
    let c = 0;
    for (let i=0;i<blocks.length;i++) for (let j=i+1;j<blocks.length;j++) {
      const a=blocks[i],b=blocks[j];
      if (a.day===b.day && !(a.end<=b.start||b.end<=a.start)) c++;
    }
    return c;
  })();
  const histPercentile = 12; // % de alumnos que cursaron esta combinación
  const recepcionDelta = selSubjects.length >= 4 ? 0 : selSubjects.length === 3 ? 1 : 2;

  const remove = (code) => setSelected(sel=>sel.filter(s=>s.code!==code));
  const pickComm = (code, commission) => setSelected(sel=>sel.map(s=>s.code===code?{...s, commission}:s));
  const add = (code) => {
    const comms = window.PB_DATA.COMMISSIONS[code] || [];
    const first = comms.find(c=>c.enrolled<c.capacity) || comms[0];
    setSelected(sel=>[...sel, {code, commission: first?.id || null}]);
  };

  return (
    <div style={{padding:'var(--pad-xl) var(--pad-lg)',maxWidth:1400,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:24,marginBottom:24}}>
        <div>
          <div className="eyebrow" style={{marginBottom:8}}>Cuatrimestre 2026 · 1c · Borrador</div>
          <h1 className="h-display">Simular <em>inscripción</em></h1>
          <p className="lede" style={{marginTop:12}}>
            Editor, no recomendador. Combiná materias y comisiones,
            mirá los choques, leé qué dijeron quienes ya pasaron por acá.
          </p>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <span className="mono" style={{fontSize:11,color:'var(--ink-3)'}}>Guardado hace 2 min</span>
          <button className="btn secondary">Comparar escenarios</button>
          <button className="btn accent">Confirmar selección</button>
        </div>
      </div>

      {/* Stats — el "minimal" oculta las métricas avanzadas */}
      <div className="card" style={{display:'grid',gridTemplateColumns: simInfo==='minimal'?'repeat(3,1fr)':'repeat(6,1fr)',marginBottom:24}}>
        <Stat label="Materias" value={selSubjects.length}
          sub={`${totalHours}h totales`}/>
        <div style={{borderLeft:'1px solid var(--line)'}}>
          <Stat label="Carga semanal" value={weeklyHours} suffix="h"
            sub={weeklyHours>22?'⚠ alta':weeklyHours>16?'media':'baja'}/>
        </div>
        <div style={{borderLeft:'1px solid var(--line)'}}>
          <Stat label="Choques" value={conflicts}
            sub={conflicts ? 'Resolvé antes de inscribirte' : 'Sin solapamientos'}/>
        </div>
        {simInfo !== 'minimal' && <>
          <div style={{borderLeft:'1px solid var(--line)'}}>
            <Stat label="Dificultad combinada" value={avgDiff.toFixed(1)} suffix="/5"
              sub={`${selSubjects.filter(s=>s.diff>=4).length} materias 4+`}/>
          </div>
          <div style={{borderLeft:'1px solid var(--line)'}}>
            <Stat label="Aprobación esperada" value={(avgPass*100).toFixed(0)} suffix="%"
              sub="Promedio histórico"/>
          </div>
          <div style={{borderLeft:'1px solid var(--line)'}}>
            <Stat label="Recepción estimada" value={2027 + recepcionDelta} suffix={recepcionDelta?'·2c':'·2c'}
              sub={recepcionDelta?`+${recepcionDelta}c vs ideal`:'En tiempo'}/>
          </div>
        </>}
      </div>

      {/* Layout: izquierda picker, derecha calendar */}
      <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:24}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card" style={{padding:'14px 16px 8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
              <h2 className="h2" style={{fontSize:14,fontWeight:600,margin:0}}>Selección</h2>
              <span className="mono" style={{fontSize:11,color:'var(--ink-3)'}}>
                {selSubjects.length} / 6 máx
              </span>
            </div>
            {selSubjects.map((s, i)=>(
              <SubjectChip key={s.code} subject={s}
                commission={s.commission}
                isLast={i === selSubjects.length - 1}
                onRemove={remove}
                onPickComm={pickComm}/>
            ))}
          </div>

          <div style={{
            padding:14, background:'var(--bg-elev)',
            border:'1px dashed var(--line)', borderRadius:'var(--radius)'
          }}>
            <div className="eyebrow" style={{marginBottom:10}}>Sugerencias para tu nivel</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {candidates.map(c=>(
                <button key={c.code} onClick={()=>add(c.code)}
                  style={{
                    appearance:'none',border:0,background:'transparent',
                    textAlign:'left',padding:'6px 8px',cursor:'pointer',
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    borderRadius:5,
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--line-2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:0}}>
                    <span className="mono" style={{fontSize:10,color:'var(--ink-3)'}}>{c.code}</span>
                    <span style={{fontSize:12.5,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <DiffDots value={c.diff}/>
                    <span style={{fontSize:14,color:'var(--ink-3)'}}>＋</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h2 className="h2">Distribución semanal</h2>
            {conflicts > 0 && (
              <Pill tone="danger">{conflicts} choque{conflicts>1?'s':''} de horario</Pill>
            )}
          </div>
          <Calendar blocks={blocks} density={density}/>

          {simInfo !== 'minimal' && (
            <>
              {/* Insights crowd-sourced */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:8}}>
                <div className="card" style={{padding:'var(--pad-md)'}}>
                  <div className="eyebrow" style={{marginBottom:10}}>Combinación histórica</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:8}}>
                    <span className="h1 tabular" style={{fontSize:28}}>{histPercentile}%</span>
                    <span style={{fontSize:12,color:'var(--ink-3)'}}>de alumnos cursaron una combinación similar</span>
                  </div>
                  <div className="hist">
                    {[5,8,14,22,18,12,9,6,4,2].map((v,i)=>(
                      <i key={i} className={i===2?'on':''} style={{height:(v/22*100)+'%'}}/>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontFamily:'var(--font-mono)',fontSize:10,color:'var(--ink-4)'}}>
                    <span>2 mat.</span><span>5 mat.</span><span>8 mat.</span>
                  </div>
                </div>

                <div className="card" style={{padding:'var(--pad-md)'}}>
                  <div className="eyebrow" style={{marginBottom:10}}>Combinaciones que más fallan</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span className="mono" style={{fontSize:11}}>INT302 + ALG202</span>
                      <Pill tone="danger">62% recursa</Pill>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span className="mono" style={{fontSize:11}}>ISW302 + DIS402</span>
                      <Pill tone="warm">48% recursa</Pill>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span className="mono" style={{fontSize:11}}>SOP202 + RED302 + INT302</span>
                      <Pill tone="warm">41% recursa</Pill>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Calendar, SimulatorView, SubjectChip });
