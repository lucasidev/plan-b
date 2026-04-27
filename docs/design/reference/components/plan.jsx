// Vista: Plan de estudios como tabla/grilla con celdas coloreadas por estado
function PlanGrid({ subjects, states, planned, onCellClick }) {
  // Agrupar por año
  const byYear = useMemo(()=>{
    const out = {};
    subjects.forEach(s => {
      out[s.year] = out[s.year] || { 1: [], 2: [] };
      out[s.year][s.sem].push(s);
    });
    return out;
  }, [subjects]);

  const getState = (s) => {
    if (planned && planned.includes(s.code)) return 'planned';
    if (states[s.code]) return states[s.code];
    // available si todas las correlativas están approved/regularized
    const prereqs = s.prereqs || [];
    const ok = prereqs.every(p => ['approved','regularized'].includes(states[p]));
    return ok ? 'available' : 'pending';
  };

  const isLocked = (s) => {
    const st = getState(s);
    if (st === 'pending' && (s.prereqs||[]).length) return true;
    return false;
  };

  const years = Object.keys(byYear).sort();

  return (
    <div className="plan-grid">
      {years.map(y => {
        const totalH = [...byYear[y][1], ...byYear[y][2]].reduce((a,s)=>a+s.hours,0);
        return (
          <div key={y} className="plan-col">
            <div className="plan-col-h">
              <span className="yr">Año {y}</span>
              <span className="yr-meta">{totalH}h</span>
            </div>
            {[1,2].map(sem => (
              <div key={sem} className="plan-sem">
                <div className="plan-sem-label">{sem}° cuatrimestre</div>
                {byYear[y][sem].map(s => {
                  const st = getState(s);
                  const locked = isLocked(s);
                  return (
                    <div key={s.code} className="plan-cell"
                      data-st={st} data-locked={locked}
                      onClick={()=>!locked && onCellClick && onCellClick(s)}>
                      <div className="pc-code">{s.code}</div>
                      <div className="pc-name">{s.name}</div>
                      <div className="pc-meta">
                        <span>{s.hours}h</span>
                        <span>·</span>
                        <span>{(s.passRate*100).toFixed(0)}% pasa</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PlanLegend() {
  const items = [
    { st: 'approved', label: 'Aprobada' },
    { st: 'regularized', label: 'Regularizada' },
    { st: 'coursing', label: 'Cursando' },
    { st: 'failed', label: 'Recursando' },
    { st: 'available', label: 'Disponible' },
    { st: 'pending', label: 'Bloqueada' },
    { st: 'planned', label: 'Planificada' },
  ];
  return (
    <div className="legend">
      {items.map(i=>(
        <div key={i.st} className="legend-item">
          <span className="legend-sw" style={{background:`var(--st-${i.st}-bg)`,outline:i.st==='planned'?'1px dashed var(--st-planned-fg)':'none',outlineOffset:-1}}/>
          <span>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

// Vista principal del plan de estudios
function PlanView({ user, subjects, states, planned, openSubject }) {
  const [layout, setLayout] = useState('year'); // 'year' | 'graph'
  const counts = useMemo(()=>{
    const c = { approved:0, regularized:0, coursing:0, failed:0, pending:0, total: subjects.length };
    subjects.forEach(s => {
      const st = states[s.code];
      if (c[st] != null) c[st]++;
      else c.pending++;
    });
    return c;
  }, [subjects, states]);

  const progress = ((counts.approved + counts.regularized*0.5) / counts.total * 100).toFixed(0);
  const totalHrs = subjects.filter(s=>['approved','regularized'].includes(states[s.code])).reduce((a,s)=>a+s.hours,0);

  return (
    <div style={{padding:'var(--pad-xl) var(--pad-lg)', maxWidth:1400, margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:24,marginBottom:24}}>
        <div>
          <div className="eyebrow" style={{marginBottom:8}}>Tu trayectoria · UNSTA · Lic. en Sistemas</div>
          <h1 className="h-display">Plan de <em>estudios</em></h1>
          <p className="lede" style={{marginTop:12}}>
            Cada celda es una materia. El color cuenta tu historia con ella —
            no la del plan ideal.
          </p>
        </div>
        <div style={{display:'flex',gap:12}}>
          <button className="btn secondary">Exportar</button>
          <button className="btn">Editar historial</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="card" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',marginBottom:20}}>
        <Stat label="Avance" value={progress} suffix="%" sub={`${counts.approved+counts.regularized}/${counts.total} materias`}/>
        <div style={{borderLeft:'1px solid var(--line)'}}>
          <Stat label="Aprobadas" value={counts.approved} sub={`${totalHrs}h cursadas`}/>
        </div>
        <div style={{borderLeft:'1px solid var(--line)'}}>
          <Stat label="Pendientes de final" value={counts.regularized} sub="Regularizadas"/>
        </div>
        <div style={{borderLeft:'1px solid var(--line)'}}>
          <Stat label="Recursando" value={counts.failed} sub="Materias arrastradas"/>
        </div>
        <div style={{borderLeft:'1px solid var(--line)'}}>
          <Stat label="Recepción estimada" value="2027" suffix="·2c" sub="A ritmo actual"/>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div className="pill-toggle">
          <button data-active={layout==='year'} onClick={()=>setLayout('year')}>Por año</button>
          <button data-active={layout==='graph'} onClick={()=>setLayout('graph')}>Por correlativas</button>
        </div>
        <PlanLegend/>
      </div>

      {layout==='year'
        ? <PlanGrid subjects={subjects} states={states} planned={planned} onCellClick={openSubject}/>
        : <PlanGraph subjects={subjects} states={states} planned={planned} onCellClick={openSubject}/>}
    </div>
  );
}

// ─── Grafo de correlativas ───────────────────────────────────────
function PlanGraph({ subjects, states, planned, onCellClick }) {
  const [hover, setHover] = useState(null);

  const getState = (s) => {
    if (planned && planned.includes(s.code)) return 'planned';
    if (states[s.code]) return states[s.code];
    const ok = (s.prereqs||[]).every(p => ['approved','regularized'].includes(states[p]));
    return ok ? 'available' : 'pending';
  };

  // Layout: columnas = año-cuatri (10 columnas), filas = orden dentro del cuatri
  const COLS = 10; // 5 años × 2 cuatrimestres
  const COL_W = 138;
  const ROW_H = 64;
  const NODE_W = 116;
  const NODE_H = 50;
  const PAD_X = 30;
  const PAD_TOP = 36;

  // Agrupar por (year, sem)
  const groups = {};
  subjects.forEach(s => {
    const key = `${s.year}-${s.sem}`;
    (groups[key] = groups[key] || []).push(s);
  });

  // Asignar posiciones
  const pos = {};
  let maxRows = 0;
  for (let y=1; y<=5; y++) {
    for (let sem=1; sem<=2; sem++) {
      const key = `${y}-${sem}`;
      const list = groups[key] || [];
      const col = (y-1)*2 + (sem-1);
      list.forEach((s, i) => {
        pos[s.code] = {
          x: PAD_X + col * COL_W + COL_W/2,
          y: PAD_TOP + 24 + i * ROW_H + NODE_H/2,
        };
      });
      if (list.length > maxRows) maxRows = list.length;
    }
  }

  const W = PAD_X*2 + COLS * COL_W;
  const H = PAD_TOP + 24 + maxRows * ROW_H + 24;

  // Color por estado
  const stateColor = (st) => {
    const map = {
      approved: { bg: 'var(--st-approved-bg)', fg: 'var(--st-approved-fg)', border: 'var(--st-approved-fg)' },
      regularized: { bg: 'var(--st-regularized-bg)', fg: 'var(--st-regularized-fg)', border: 'var(--st-regularized-fg)' },
      coursing: { bg: 'var(--st-coursing-bg)', fg: 'var(--st-coursing-fg)', border: 'var(--st-coursing-fg)' },
      failed: { bg: 'var(--st-failed-bg)', fg: 'var(--st-failed-fg)', border: 'var(--st-failed-fg)' },
      pending: { bg: 'var(--bg-elev)', fg: 'var(--ink-3)', border: 'var(--line)' },
      available: { bg: 'var(--st-available-bg)', fg: 'var(--st-available-fg)', border: 'var(--ink-4)' },
      planned: { bg: 'var(--st-planned-bg)', fg: 'var(--st-planned-fg)', border: 'var(--st-planned-fg)' },
    };
    return map[st] || map.pending;
  };

  // Edges
  const edges = [];
  subjects.forEach(s => {
    (s.prereqs || []).forEach(p => {
      if (pos[p] && pos[s.code]) {
        edges.push({ from: p, to: s.code });
      }
    });
  });

  // Hover destaca: aristas conectadas y nodos vecinos
  const hoverEdges = new Set();
  const hoverNodes = new Set();
  if (hover) {
    hoverNodes.add(hover);
    edges.forEach((e, i) => {
      if (e.from === hover || e.to === hover) {
        hoverEdges.add(i);
        hoverNodes.add(e.from);
        hoverNodes.add(e.to);
      }
    });
  }

  return (
    <div className="graph-wrap">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div className="muted" style={{fontSize:12}}>
          Pasá el mouse sobre una materia para ver sus correlativas. Las flechas van de la previa a la siguiente.
        </div>
        <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em'}}>
          {subjects.length} materias · {edges.length} correlativas
        </div>
      </div>

      <div style={{overflowX:'auto', overflowY:'hidden'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{minWidth:W}}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--line)"/>
            </marker>
            <marker id="arrow-h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/>
            </marker>
          </defs>

          {/* Year dividers + labels */}
          {[1,2,3,4,5].map(y => {
            const x = PAD_X + (y-1)*2*COL_W;
            return (
              <g key={y}>
                {y > 1 && <line x1={x} y1={PAD_TOP - 4} x2={x} y2={H - 8} className="graph-year-divider"/>}
                <text x={x + COL_W} y={PAD_TOP - 14} className="graph-year-label" textAnchor="middle">
                  AÑO {y}
                </text>
                <text x={x + COL_W/2} y={PAD_TOP + 8} className="graph-year-label" textAnchor="middle"
                  style={{fontSize:9, fill:'var(--ink-4)'}}>
                  1° cuatri
                </text>
                <text x={x + COL_W + COL_W/2} y={PAD_TOP + 8} className="graph-year-label" textAnchor="middle"
                  style={{fontSize:9, fill:'var(--ink-4)'}}>
                  2° cuatri
                </text>
              </g>
            );
          })}

          {/* Edges */}
          {edges.map((e, i) => {
            const a = pos[e.from], b = pos[e.to];
            const x1 = a.x + NODE_W/2, y1 = a.y;
            const x2 = b.x - NODE_W/2, y2 = b.y;
            const mx = (x1 + x2) / 2;
            const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
            const isH = hoverEdges.has(i);
            return (
              <path key={i} d={path}
                className={`graph-edge ${isH ? 'highlight' : ''}`}
                markerEnd={isH ? 'url(#arrow-h)' : 'url(#arrow)'}
                style={{opacity: hover && !isH ? 0.2 : 1}}/>
            );
          })}

          {/* Nodes */}
          {subjects.map(s => {
            const p = pos[s.code];
            if (!p) return null;
            const st = getState(s);
            const c = stateColor(st);
            const isH = hover && hoverNodes.has(s.code);
            const dim = hover && !isH;
            return (
              <g key={s.code} className="graph-node"
                transform={`translate(${p.x - NODE_W/2}, ${p.y - NODE_H/2})`}
                onMouseEnter={()=>setHover(s.code)}
                onMouseLeave={()=>setHover(null)}
                onClick={()=>onCellClick && onCellClick(s)}
                style={{opacity: dim ? 0.35 : 1}}>
                <rect width={NODE_W} height={NODE_H} fill={c.bg} stroke={c.border}
                  strokeDasharray={st==='planned' ? '4 3' : 'none'}/>
                <text x={NODE_W/2} y={16} className="gn-code" fill={c.fg}>{s.code}</text>
                <text x={NODE_W/2} y={32} fill={c.fg} fontWeight="600">
                  {s.name.length > 22 ? s.name.slice(0,21) + '…' : s.name}
                </text>
                <text x={NODE_W/2} y={44} className="gn-code" fill={c.fg} style={{opacity:0.65}}>
                  {(s.passRate*100).toFixed(0)}% · ●{s.diff.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

Object.assign(window, { PlanGrid, PlanLegend, PlanView, PlanGraph });
