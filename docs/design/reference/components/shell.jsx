// Sidebar de navegación + topbar
function Sidebar({ view, setView, user, onLogout, onShowOnboarding }) {
  const [meOpen, setMeOpen] = useState(false);
  const meRef = React.useRef(null);

  React.useEffect(() => {
    if (!meOpen) return;
    function onDoc(e) {
      if (meRef.current && !meRef.current.contains(e.target)) setMeOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [meOpen]);

  const navItems = [
    { sect: 'Mi cuatrimestre', items: [
      { id: 'home', label: 'Inicio', tag: '⌘1' },
      { id: 'plan', label: 'Plan de estudios', tag: '⌘2' },
      { id: 'simulator', label: 'Simulador', tag: '⌘3' },
    ]},
    { sect: 'Comunidad', items: [
      { id: 'subjects', label: 'Materias', tag: 'M' },
      { id: 'professors', label: 'Docentes', tag: 'D' },
      { id: 'reviews', label: 'Mis reseñas' },
    ]},
    { sect: 'Cuenta', items: [
      { id: 'history', label: 'Historial académico' },
      { id: 'settings', label: 'Configuración' },
    ]},
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={22}/>
      </div>
      <small style={{
        fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.1em',
        textTransform:'uppercase', color:'var(--ink-3)', padding:'0 6px'
      }}>UNSTA · Lic. Sistemas</small>
      <nav>
        {navItems.map(group=>(
          <React.Fragment key={group.sect}>
            <div className="nav-section">{group.sect}</div>
            {group.items.map(item=>(
              <button key={item.id} className="nav-item"
                data-active={view===item.id}
                onClick={()=>setView(item.id)}>
                <span>{item.label}</span>
                {item.tag && <span className="nav-tag">{item.tag}</span>}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>
      <div ref={meRef} style={{position:'relative'}}>
        <button className="me me-btn" onClick={()=>setMeOpen(v=>!v)}
          aria-expanded={meOpen}
          style={{
            appearance:'none',background:'transparent',border:0,
            width:'100%',cursor:'pointer',padding:0,
            color:'inherit',font:'inherit',textAlign:'left'
          }}>
          <div className="avatar">{user.initials}</div>
          <div className="who">
            <b>{user.name}</b>
            <small>{user.year}° año · {user.credits} cr.</small>
          </div>
          <span style={{
            color:'var(--ink-3)',fontSize:11,marginRight:6,
            transform: meOpen?'rotate(180deg)':'rotate(0)',
            transition:'transform .15s'
          }}>▾</span>
        </button>

        {meOpen && (
          <div style={{
            position:'absolute',
            bottom:'calc(100% + 6px)',left:8,right:8,
            background:'var(--bg)',
            border:'1px solid var(--line)',
            borderRadius:'var(--radius)',
            boxShadow:'0 12px 32px rgba(0,0,0,0.10)',
            padding:6,zIndex:10,
            animation:'fadein .12s ease'
          }}>
            <div style={{padding:'10px 10px 8px',borderBottom:'1px solid var(--line-2)',marginBottom:4}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{user.name}</div>
              <div className="mono" style={{fontSize:10.5,color:'var(--ink-3)',letterSpacing:'0.02em'}}>
                lucia.mansilla@unsta.edu.ar
              </div>
            </div>
            <MenuButton onClick={()=>{ setMeOpen(false); setView('profile'); }}>
              Mi perfil
            </MenuButton>
            <MenuButton onClick={()=>{ setMeOpen(false); setView('settings'); }}>
              Configuración
            </MenuButton>
            <MenuButton onClick={()=>{ setMeOpen(false); onShowOnboarding && onShowOnboarding(); }}>
              Ver onboarding otra vez
            </MenuButton>
            <MenuButton onClick={()=>{ setMeOpen(false); window.open('#','_blank'); }}>
              Ayuda y contacto
            </MenuButton>
            <div style={{height:1,background:'var(--line-2)',margin:'4px 0'}}/>
            <MenuButton danger onClick={()=>{ setMeOpen(false); onLogout && onLogout(); }}>
              Cerrar sesión
            </MenuButton>
          </div>
        )}
      </div>
    </aside>
  );
}

function MenuButton({ children, onClick, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        appearance:'none',width:'100%',textAlign:'left',
        padding:'8px 10px',borderRadius:6,border:0,cursor:'pointer',
        background: hover ? 'var(--bg-elev)' : 'transparent',
        color: danger ? 'var(--warn)' : 'var(--ink-2)',
        fontSize:12.5,fontFamily:'inherit'
      }}>
      {children}
    </button>
  );
}

function Topbar({ crumbs, right }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c,i)=>(
          <React.Fragment key={i}>
            {i>0 && <span style={{margin:'0 6px',color:'var(--ink-4)'}}>/</span>}
            {i===crumbs.length-1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="spacer"/>
      <div className="search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--ink-3)'}}>
          <circle cx="11" cy="11" r="7"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <input placeholder="Buscar materia, docente, código..."/>
        <kbd>⌘K</kbd>
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, MenuButton });
