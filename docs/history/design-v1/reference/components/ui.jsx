// Componentes UI compartidos
const { useState, useEffect, useMemo, useRef } = React;

// Logo (estilo Apricot Soft: sans bold + dot apricot al lado)
function Logo({ size = 28 }) {
  const dotSize = Math.max(5, Math.round(size * 0.32));
  return (
    <span className="brand-logo" style={{display:'inline-block', lineHeight:1}}>
      <span style={{
        fontFamily:'var(--font-display)', fontSize:size,
        letterSpacing:'-0.01em', fontWeight:600, color:'var(--ink)'
      }}>plan-b</span>
      <i style={{
        width:dotSize, height:dotSize,
        background:'var(--accent)', borderRadius:'50%',
        display:'inline-block', marginLeft:Math.round(size*0.12),
        verticalAlign:'middle', transform:`translateY(-${Math.round(size*0.28)}px)`
      }}/>
    </span>
  );
}

function DiffDots({ value, max=5 }) {
  return (
    <span className="diff-dots" title={`Dificultad ${value.toFixed(1)}/5`}>
      {Array.from({length:max}).map((_,i)=>(
        <i key={i} className={i < Math.round(value) ? 'on' : ''}/>
      ))}
    </span>
  );
}

function Meter({ value, max=100, label, sub, tone }) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div className="meter">
      <div className="meter-label"><span>{label}</span><span className="tabular">{sub}</span></div>
      <div className={`meter-bar ${tone||''}`}><i style={{width: pct+'%'}}/></div>
    </div>
  );
}

function Stat({ label, value, suffix, sub }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-val tabular">{value}{suffix && <small>{suffix}</small>}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function VerifiedBadge({ kind = 'student' }) {
  // student: alumno que cursó la materia (validado vs su historial)
  // teacher: docente con email institucional UNSTA
  const label = kind === 'teacher' ? 'docente UNSTA' : 'verificado que cursó';
  return <span className="verified-badge" data-kind={kind}>{label}</span>;
}

function Pill({ children, tone }) {
  const styles = tone === 'warm' ? {background:'var(--accent-soft)',color:'var(--accent-ink)'}
    : tone === 'danger' ? {background:'var(--st-failed-bg)',color:'var(--st-failed-fg)'}
    : tone === 'good' ? {background:'var(--st-approved-bg)',color:'var(--st-approved-fg)'}
    : {};
  return <span className="tag" style={styles}>{children}</span>;
}

// histogram of integer rating bins (1..5)
function RatingHist({ data }) {
  // data: array of integers 1..5
  const bins = [0,0,0,0,0];
  data.forEach(v => { if(v>=1 && v<=5) bins[v-1]++; });
  const max = Math.max(...bins, 1);
  return (
    <div className="hist">
      {bins.map((v,i)=>(
        <i key={i} className={v>0?'on':''} style={{height: (v/max*100)+'%'}}/>
      ))}
    </div>
  );
}

Object.assign(window, { Logo, DiffDots, Meter, Stat, VerifiedBadge, Pill, RatingHist });
