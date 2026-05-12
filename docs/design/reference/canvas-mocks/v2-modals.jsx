// v2 — Modales.
//
// Convención visual:
// - Backdrop oklch(0.18 0.02 60 / 0.36)
// - Card centrada, bordes 12, sombra fuerte
// - Header: kicker mono · título
// - Body: copy explicativo + (opcional) preview/form
// - Footer: ghost cancel · primary action (alineados a la derecha)
// - Destructivos usan accent rojo en el botón principal.

const ModalRedBg   = 'oklch(0.95 0.04 30)';
const ModalRedLine = 'oklch(0.78 0.12 30)';
const ModalRedInk  = 'oklch(0.42 0.14 30)';
const ModalRedBtn  = 'oklch(0.55 0.18 28)';

function ModalShell({ host, kicker, title, headerTone, children, footer, width=480 }) {
  const headerBg = headerTone === 'red' ? ModalRedBg : 'var(--bg-card)';
  const headerLine = headerTone === 'red' ? ModalRedLine : 'var(--line)';
  const kickerColor = headerTone === 'red' ? ModalRedInk : 'var(--ink-3)';
  const titleColor = headerTone === 'red' ? ModalRedInk : 'var(--ink)';

  return (
    <div style={{position:'relative'}}>
      {host}
      <div style={{
        position:'absolute', inset:0,
        background:'oklch(0.18 0.02 60 / 0.36)',
        zIndex:50,
      }}/>
      <div style={{
        position:'absolute',
        top:'50%', left:'50%', transform:'translate(-50%, -50%)',
        width, zIndex:60,
        background:'var(--bg-card)',
        border:'1px solid var(--line)',
        borderRadius:12,
        boxShadow:'0 16px 48px oklch(0.18 0.02 60 / 0.22)',
        overflow:'hidden',
      }}>
        <div style={{
          padding:'18px 22px 14px',
          background:headerBg,
          borderBottom:`1px solid ${headerLine}`,
        }}>
          {kicker && <div style={{
            fontFamily:'var(--font-mono)', fontSize:10.5,
            color:kickerColor, letterSpacing:'0.08em',
            textTransform:'uppercase', marginBottom:6,
          }}>{kicker}</div>}
          <h3 style={{
            fontSize:17, fontWeight:600, margin:0,
            color:titleColor, letterSpacing:'-0.01em',
            lineHeight:1.3,
          }}>{title}</h3>
        </div>
        <div style={{padding:'18px 22px'}}>{children}</div>
        <div style={{
          padding:'12px 22px',
          borderTop:'1px solid var(--line)',
          background:'var(--bg-elev)',
          display:'flex', gap:8, justifyContent:'flex-end',
          alignItems:'center',
        }}>{footer}</div>
      </div>
    </div>
  );
}

function MBtnGhost({ children }) {
  return (
    <button style={{
      padding:'8px 14px', borderRadius:8,
      border:'1px solid var(--line)',
      background:'var(--bg-card)', color:'var(--ink-2)',
      fontFamily:'inherit', fontSize:13, cursor:'pointer',
    }}>{children}</button>
  );
}
function MBtnPrimary({ children }) {
  return (
    <button style={{
      padding:'8px 14px', borderRadius:8,
      border:'1px solid var(--accent)',
      background:'var(--accent)', color:'var(--accent-on)',
      fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer',
    }}>{children}</button>
  );
}
function MBtnDestructive({ children }) {
  return (
    <button style={{
      padding:'8px 14px', borderRadius:8,
      border:`1px solid ${ModalRedBtn}`,
      background:ModalRedBtn, color:'white',
      fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer',
    }}>{children}</button>
  );
}

// 1 · Borrar reseña ──────────────────────────────────────────────
function V2ModalBorrarResena() {
  return (
    <ModalShell
      host={<V2Resenas tab="mias"/>}
      kicker="Acción permanente"
      title="¿Borrar tu reseña de ISW301?"
      headerTone="red"
      footer={<>
        <MBtnGhost>Cancelar</MBtnGhost>
        <MBtnDestructive>Borrar reseña</MBtnDestructive>
      </>}
    >
      <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:'0 0 14px'}}>
        Una vez borrada no podemos recuperarla. Vas a perder las
        <b> 23 marcas útiles</b> y las <b>4 respuestas</b> que recibió.
      </p>
      <div style={{
        padding:'12px 14px',
        background:'var(--bg-elev)',
        border:'1px solid var(--line)',
        borderRadius:8,
        display:'flex', flexDirection:'column', gap:6,
      }}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:10.5,
          color:'var(--ink-3)', letterSpacing:'0.08em',
          textTransform:'uppercase',
        }}>La reseña que vas a borrar</div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{color:'var(--accent-ink)', letterSpacing:1}}>★★★★☆</span>
          <span style={{fontSize:12, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>
            ISW301 · Brandt · 2025·2c · Com. A
          </span>
        </div>
        <p style={{
          fontSize:12.5, color:'var(--ink-2)', lineHeight:1.5,
          margin:0, fontStyle:'italic',
        }}>
          "Brandt explica clarísimo y se nota que le importa la materia. La cursada tiene mucha carga…"
        </p>
      </div>
      <p style={{fontSize:12, color:'var(--ink-3)', margin:'14px 0 0', lineHeight:1.5}}>
        Si querés actualizar lo que escribiste sin perder utilidad, mejor <b>editala</b>.
      </p>
    </ModalShell>
  );
}

// 2 · Cerrar sesión ──────────────────────────────────────────────
function V2ModalCerrarSesion() {
  return (
    <ModalShell
      host={<V2Inicio/>}
      kicker="Confirmar"
      title="¿Cerrar sesión?"
      width={420}
      footer={<>
        <MBtnGhost>Quedarme</MBtnGhost>
        <MBtnPrimary>Cerrar sesión</MBtnPrimary>
      </>}
    >
      <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>
        Vas a salir como <b>Lucía Mansilla</b>. Tus borradores y reseñas quedan guardados — los vas a ver cuando vuelvas a entrar.
      </p>
    </ModalShell>
  );
}

// 3 · Descartar borrador de Planificar ───────────────────────────
function V2ModalDescartarBorrador() {
  return (
    <ModalShell
      host={<V2Planificar tab="borrador1"/>}
      kicker="Acción permanente"
      title="¿Descartar este borrador?"
      headerTone="red"
      footer={<>
        <MBtnGhost>Cancelar</MBtnGhost>
        <MBtnDestructive>Descartar borrador</MBtnDestructive>
      </>}
    >
      <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:'0 0 14px'}}>
        Vas a perder el borrador de <b>2027·1c</b> con todos los cambios que armaste.
      </p>
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8,
        marginBottom:14,
      }}>
        {[
          ['5',  'materias'],
          ['12', 'cambios'],
          ['3 d',  'desde la última edición'],
        ].map(([v,l]) => (
          <div key={l} style={{
            padding:'10px 12px',
            background:'var(--bg-elev)',
            border:'1px solid var(--line)',
            borderRadius:8,
          }}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600, color:'var(--ink)'}}>{v}</div>
            <div style={{fontSize:11, color:'var(--ink-3)'}}>{l}</div>
          </div>
        ))}
      </div>
      <p style={{fontSize:12, color:'var(--ink-3)', margin:0, lineHeight:1.5}}>
        Si solo querés probar otra combinación, podés <b>duplicarlo</b> en lugar de descartarlo.
      </p>
    </ModalShell>
  );
}

// 4 · Publicar borrador como plan oficial ────────────────────────
function V2ModalPublicarPlan() {
  const checks = [
    { ok:true,  label:'Sin choques de horario',          sub:'verificado' },
    { ok:true,  label:'Todas las correlativas cumplidas', sub:'verificado' },
    { ok:true,  label:'5 materias · 21 hs/sem',          sub:'dentro de tu carga habitual' },
    { ok:false, label:'Falta confirmar comisión de ARQ301', sub:'asignamos B por defecto' },
  ];
  return (
    <ModalShell
      host={<V2Planificar tab="borrador1"/>}
      width={540}
      kicker="Cuatrimestre 2027·1c"
      title="Publicar este borrador como plan del cuatri"
      footer={<>
        <MBtnGhost>Cancelar</MBtnGhost>
        <MBtnPrimary>Publicar plan</MBtnPrimary>
      </>}
    >
      <p style={{fontSize:13.5, color:'var(--ink-2)', lineHeight:1.55, margin:'0 0 14px'}}>
        Lo que estás cursando ahora pasa al historial. Este borrador se vuelve tu período en curso. Plan-b te avisa de inscripciones, reseñas y cambios desde acá.
      </p>

      <div style={{
        display:'flex', flexDirection:'column',
        border:'1px solid var(--line)',
        borderRadius:8, overflow:'hidden',
      }}>
        {checks.map((c, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:10,
            padding:'10px 14px',
            borderTop: i === 0 ? 'none' : '1px solid var(--line)',
            background: c.ok ? 'var(--bg-card)' : 'oklch(0.96 0.04 75)',
          }}>
            <span aria-hidden="true" style={{
              flexShrink:0, marginTop:2,
              width:18, height:18, borderRadius:'50%',
              background: c.ok ? 'oklch(0.42 0.06 145)' : 'oklch(0.78 0.12 75)',
              color:'white',
              display:'grid', placeItems:'center',
              fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)',
            }}>{c.ok ? '✓' : '!'}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13, color:'var(--ink)'}}>{c.label}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:1}}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

// 5 · Reportar reseña ────────────────────────────────────────────
function V2ModalReportar() {
  const motivos = [
    ['No es sobre la cursada', 'Habla de cosas que no son la materia/docente'],
    ['Datos personales',       'Identifica a un alumno o expone información privada'],
    ['Lenguaje ofensivo',      'Insultos, discriminación o ataques personales'],
    ['Información falsa',      'Datos verificablemente incorrectos sobre la cursada'],
    ['Spam o promoción',       'Promociona algo ajeno a la materia'],
  ];
  return (
    <ModalShell
      host={<V2DocenteDetalle/>}
      width={520}
      kicker="Reportar"
      title="¿Por qué reportás esta reseña?"
      footer={<>
        <MBtnGhost>Cancelar</MBtnGhost>
        <MBtnPrimary>Enviar reporte</MBtnPrimary>
      </>}
    >
      <p style={{fontSize:13, color:'var(--ink-3)', lineHeight:1.55, margin:'0 0 14px'}}>
        El reporte es anónimo. Lo revisa el equipo de plan-b en menos de 24 hs.
      </p>

      <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:14}}>
        {motivos.map(([titulo, sub], i) => (
          <label key={titulo} style={{
            display:'flex', gap:10, alignItems:'flex-start',
            padding:'10px 12px',
            border: `1px solid ${i === 1 ? 'var(--accent)' : 'var(--line)'}`,
            borderRadius:8,
            background: i === 1 ? 'oklch(0.96 0.025 60)' : 'var(--bg-card)',
            cursor:'pointer',
          }}>
            <span style={{
              flexShrink:0, marginTop:2,
              width:14, height:14, borderRadius:'50%',
              border: `1.5px solid ${i === 1 ? 'var(--accent)' : 'var(--line-strong)'}`,
              background:'var(--bg-card)',
              display:'grid', placeItems:'center',
            }}>
              {i === 1 && <span style={{
                width:6, height:6, borderRadius:'50%',
                background:'var(--accent)',
              }}/>}
            </span>
            <div>
              <div style={{fontSize:13, color:'var(--ink)', fontWeight: i === 1 ? 600 : 400}}>{titulo}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:1, lineHeight:1.4}}>{sub}</div>
            </div>
          </label>
        ))}
      </div>

      <label style={{
        display:'block',
        fontFamily:'var(--font-mono)', fontSize:10.5,
        color:'var(--ink-3)', letterSpacing:'0.06em',
        textTransform:'uppercase', marginBottom:6,
      }}>Detalle (opcional)</label>
      <textarea
        readOnly
        defaultValue="Menciona el legajo y el apellido completo de un alumno cuando habla del trabajo final."
        style={{
          width:'100%', minHeight:64, padding:'10px 12px',
          border:'1px solid var(--line)', borderRadius:8,
          fontFamily:'inherit', fontSize:13, color:'var(--ink)',
          background:'var(--bg-card)', resize:'none',
        }}
      />
    </ModalShell>
  );
}

// 6 · Cambiar contraseña ─────────────────────────────────────────
function V2ModalCambiarContrasena() {
  return (
    <ModalShell
      host={<V2Ajustes/>}
      width={460}
      kicker="Seguridad"
      title="Cambiar contraseña"
      footer={<>
        <MBtnGhost>Cancelar</MBtnGhost>
        <MBtnPrimary>Cambiar contraseña</MBtnPrimary>
      </>}
    >
      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        <Field label="Contraseña actual" value="••••••••"/>
        <Field label="Nueva contraseña" value="•••••••••••" hint="Bien · 11 caracteres"/>
        <Field label="Confirmá la nueva" value="•••••••••••"/>
      </div>

      <div style={{
        marginTop:14, padding:'10px 12px',
        background:'var(--bg-elev)',
        border:'1px solid var(--line)',
        borderRadius:8, display:'flex', flexDirection:'column', gap:4,
      }}>
        {[
          ['✓', 'Mínimo 8 caracteres', true],
          ['✓', 'Mezcla de letras y números', true],
          ['·', 'Un símbolo te suma seguridad', false],
        ].map(([ic, t, ok], i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:8,
            fontSize:12, color: ok ? 'oklch(0.42 0.06 145)' : 'var(--ink-3)',
          }}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:11,
              color: ok ? 'oklch(0.42 0.06 145)' : 'var(--ink-4)',
            }}>{ic}</span>
            {t}
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function Field({ label, value, hint }) {
  return (
    <div>
      <label style={{
        display:'block', fontSize:12, color:'var(--ink-3)',
        marginBottom:5,
      }}>{label}</label>
      <input value={value} readOnly type="password" style={{
        width:'100%', padding:'9px 12px',
        border:'1px solid var(--line)', borderRadius:7,
        fontFamily:'inherit', fontSize:13.5, color:'var(--ink)',
        background:'var(--bg-card)',
      }}/>
      {hint && <div style={{
        marginTop:5, fontSize:11.5, color:'oklch(0.42 0.06 145)',
      }}>{hint}</div>}
    </div>
  );
}

Object.assign(window, {
  V2ModalBorrarResena,
  V2ModalCerrarSesion,
  V2ModalDescartarBorrador,
  V2ModalPublicarPlan,
  V2ModalReportar,
  V2ModalCambiarContrasena,
});
