// Detalle de materia + reseñas
function SubjectDetail({ subject, onClose, openProf, openWriteReview }) {
  const reviews = window.PB_DATA.REVIEWS[subject.code] || [];
  const comms = window.PB_DATA.COMMISSIONS[subject.code] || [];
  const avgRating = reviews.length ? reviews.reduce((a,r)=>a+r.rating,0)/reviews.length : 0;
  const avgWorkload = reviews.length ? reviews.reduce((a,r)=>a+r.workload,0)/reviews.length : 0;
  const recPct = reviews.length ? reviews.filter(r=>r.recommend).length/reviews.length*100 : 0;

  return (
    <div className="drawer">
      <div className="drawer-h">
        <div>
          <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em'}}>
            {subject.code} · Año {subject.year} · {subject.sem}° cuatrimestre
          </div>
          <h2 className="h1" style={{fontSize:26,marginTop:4}}>{subject.name}</h2>
        </div>
        <button className="btn ghost" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-body">
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1px solid var(--line)'}}>
          <Stat label="Dificultad" value={subject.diff.toFixed(1)} suffix="/5"
            sub={`${reviews.length} reseñas`}/>
          <div style={{borderLeft:'1px solid var(--line)'}}>
            <Stat label="Aprobación" value={(subject.passRate*100).toFixed(0)} suffix="%"
              sub="Histórica"/>
          </div>
          <div style={{borderLeft:'1px solid var(--line)'}}>
            <Stat label="Carga" value={subject.hours} suffix="h"
              sub={`~${(subject.hours/16).toFixed(0)}h/sem`}/>
          </div>
          <div style={{borderLeft:'1px solid var(--line)'}}>
            <Stat label="Recomiendan" value={recPct.toFixed(0)} suffix="%"
              sub={`${reviews.filter(r=>r.recommend).length}/${reviews.length}`}/>
          </div>
        </div>

        {/* Comisiones */}
        <div style={{padding:'var(--pad-lg)'}}>
          <div className="eyebrow" style={{marginBottom:12}}>Comisiones · 2026·1c</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {comms.map(c => {
              const full = c.enrolled >= c.capacity;
              return (
                <div key={c.id} className="card" style={{padding:12,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,flex:1}}>
                    <div className="mono" style={{
                      width:36,height:36,display:'grid',placeItems:'center',
                      background:'var(--line-2)',borderRadius:6,fontSize:14,fontWeight:600
                    }}>{c.code}</div>
                    <div>
                      <button onClick={()=>openProf(c.prof)}
                        style={{appearance:'none',border:0,background:'transparent',cursor:'pointer',
                          padding:0,fontWeight:500,fontSize:13.5,textDecoration:'underline',
                          textDecorationColor:'var(--line)',textUnderlineOffset:3,color:'var(--ink)'}}>
                        {c.prof}
                      </button>
                      <div className="mono" style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
                        {c.slots.map(s=>`${s.d} ${s.s}-${s.e}h`).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{textAlign:'right'}}>
                      <div className="mono tabular" style={{fontSize:12}}>★ {c.profRating.toFixed(1)}</div>
                      <div className="mono" style={{fontSize:10,color:full?'var(--st-failed-fg)':'var(--ink-3)'}}>
                        {c.enrolled}/{c.capacity} {full?'· cupo lleno':''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reseñas */}
        <div style={{padding:'0 var(--pad-lg) var(--pad-lg)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div className="eyebrow">{reviews.length} reseñas</div>
            <button className="btn sm" onClick={()=>openWriteReview(subject)}>
              Escribir reseña
            </button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>Distribución</div>
              <RatingHist data={reviews.map(r=>r.rating)}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontFamily:'var(--font-mono)',fontSize:10,color:'var(--ink-4)'}}>
                <span>1★</span><span>2★</span><span>3★</span><span>4★</span><span>5★</span>
              </div>
            </div>
            <div className="card" style={{padding:14,display:'flex',flexDirection:'column',gap:8}}>
              <Meter value={avgWorkload} max={5} label="Carga real" sub={avgWorkload.toFixed(1)+'/5'} tone="warm"/>
              <Meter value={subject.diff} max={5} label="Dificultad" sub={subject.diff.toFixed(1)+'/5'} tone="warm"/>
              <Meter value={recPct} max={100} label="Recomendarían" sub={recPct.toFixed(0)+'%'}/>
            </div>
          </div>

          <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
            <button className="btn secondary sm" data-active="true">Todos los docentes</button>
            {[...new Set(reviews.map(r=>r.prof))].map(p=>(
              <button key={p} className="btn ghost sm">{p}</button>
            ))}
          </div>

          <div className="card">
            {reviews.map(r=>(
              <div key={r.id} className="review">
                <div className="review-h">
                  <div className="lhs">
                    <div className="ttl">{r.title}</div>
                    <div className="who">
                      {r.verified && <VerifiedBadge/>}
                      <span className="mono" style={{fontSize:10.5}}>{r.year}</span>
                      <span>·</span>
                      <span>{r.carreer}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <span className="mono tabular" style={{fontSize:13,fontWeight:600}}>★ {r.rating}.0</span>
                    {r.recommend ? <Pill tone="good">recomienda</Pill> : <Pill tone="danger">no recomienda</Pill>}
                  </div>
                </div>
                <div className="review-body">{r.body}</div>
                <div className="review-meta">
                  <span className="pill">cursó con {r.prof}</span>
                  <span>carga <b className="tabular">{r.workload}/5</b></span>
                  <span>dificultad <b className="tabular">{r.difficulty}/5</b></span>
                  <span style={{flex:1}}/>
                  <button className="btn ghost sm">útil ({r.helpful})</button>
                  <button className="btn ghost sm">↓ {r.notHelpful}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Detalle de docente
function ProfessorDetail({ profKey, onClose }) {
  const p = window.PB_DATA.PROFESSORS[profKey];
  if (!p) return null;
  const subjects = p.subjects.map(c=>window.PB_DATA.SUBJECTS.find(s=>s.code===c)).filter(Boolean);

  // Mock reseñas para el docente
  const profReviews = [
    { id: 1, rating: 4, year:'2025-1c', subject:'ISW302', verified:true,
      title:'Sabe lo que enseña',
      body:'Las consignas son largas pero claras. Si te trabás, manda mail y responde. Las clases del miércoles son las mejores.',
      reply: profKey==='Lic. Brandt' ? {
        author: p.name, date: '2025-08-12',
        body: 'Gracias. La extensión de las consignas es algo que estoy trabajando para 2026: pasamos a entregas más cortas y frecuentes.'
      } : null,
      helpful: 5 },
    { id: 2, rating: 2, year:'2024-2c', subject:'ISW302', verified:true,
      title:'Las correcciones llegan tarde',
      body:'Entregué el TP 1 en agosto y la nota llegó en noviembre. No pude saber si iba bien hasta el final.',
      reply: profKey==='Lic. Brandt' ? {
        author: p.name, date: '2025-01-04',
        body: 'Tenés razón. Este cuatri estoy probando entregas parciales con devolución en clase para evitar exactamente esto.'
      } : null,
      helpful: 11 },
    { id: 3, rating: 5, year:'2025-1c', subject:'GES401', verified:true,
      title:'La materia que más me sirvió',
      body:'Si pudiera elegiría todas las electivas con él. Conecta lo que ves con casos reales de empresa.',
      reply: null, helpful: 4 },
  ];

  return (
    <div className="drawer">
      <div className="drawer-h">
        <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
          <div className="avatar" style={{width:54,height:54,fontSize:18}}>
            {p.name.split(' ').slice(-2).map(w=>w[0]).join('')}
          </div>
          <div>
            <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.04em',display:'flex',alignItems:'center',gap:6}}>
              Docente
              {p.verified && <VerifiedBadge kind="teacher"/>}
            </div>
            <h2 className="h1" style={{fontSize:26,marginTop:4}}>{p.name}</h2>
            <div style={{display:'flex',gap:8,fontSize:12,color:'var(--ink-3)',marginTop:4,alignItems:'center'}}>
              <span className="mono tabular">★ {p.rating.toFixed(1)}</span>
              <span>·</span>
              <span>{p.ratings} reseñas</span>
              {p.replies > 0 && <>
                <span>·</span>
                <span style={{color:'var(--accent-ink)'}}>{p.replies} respuestas públicas</span>
              </>}
            </div>
          </div>
        </div>
        <button className="btn ghost" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-body">
        <div style={{padding:'var(--pad-lg)',borderBottom:'1px solid var(--line)'}}>
          <div className="eyebrow" style={{marginBottom:8}}>Resumen colectivo</div>
          <p style={{fontSize:14,lineHeight:1.55,color:'var(--ink-2)',margin:0}}>
            {p.summary}
          </p>
        </div>

        <div style={{padding:'var(--pad-lg)',borderBottom:'1px solid var(--line)'}}>
          <div className="eyebrow" style={{marginBottom:12}}>Materias que dicta</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {subjects.map(s=>(
              <div key={s.code} className="tag" style={{padding:'6px 10px',fontSize:12,background:'var(--bg-elev)',border:'1px solid var(--line)'}}>
                <span className="mono" style={{opacity:0.6}}>{s.code}</span>
                <span style={{marginLeft:6}}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:'var(--pad-lg)'}}>
          <div className="eyebrow" style={{marginBottom:12}}>Reseñas con respuesta del docente</div>
          <div className="card">
            {profReviews.map(r=>(
              <div key={r.id} className="review">
                <div className="review-h">
                  <div className="lhs">
                    <div className="ttl">{r.title}</div>
                    <div className="who">
                      {r.verified && <VerifiedBadge/>}
                      <span className="mono" style={{fontSize:10.5}}>{r.year}</span>
                      <span>·</span>
                      <span className="mono" style={{fontSize:10.5}}>{r.subject}</span>
                    </div>
                  </div>
                  <span className="mono tabular" style={{fontSize:13,fontWeight:600}}>★ {r.rating}.0</span>
                </div>
                <div className="review-body">{r.body}</div>
                {r.reply && (
                  <div style={{
                    marginTop:8, padding:12, paddingLeft:14,
                    background:'var(--accent-soft)',
                    borderRadius:'var(--radius-sm)',
                    borderLeft:'2px solid var(--accent)',
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,fontSize:11.5}}>
                      <b style={{color:'var(--accent-ink)'}}>{r.reply.author}</b>
                      <VerifiedBadge kind="teacher"/>
                      <span style={{color:'var(--ink-3)'}}>respondió · {r.reply.date}</span>
                    </div>
                    <div style={{fontSize:13,lineHeight:1.5,color:'var(--ink)'}}>{r.reply.body}</div>
                  </div>
                )}
                <div className="review-meta">
                  <span style={{flex:1}}/>
                  <button className="btn ghost sm">útil ({r.helpful})</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SubjectDetail, ProfessorDetail });
