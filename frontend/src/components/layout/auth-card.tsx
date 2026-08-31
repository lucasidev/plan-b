/**
 * Shell de las pantallas de transición del route group `(auth)`: las que le dicen a alguien qué
 * pasó o qué sigue, sin pedirle nada (`/sign-up/check-inbox`, `/verify-email`).
 *
 * No es `AuthShell`. Ese es el shell de dos columnas de las pantallas que piden algo (sign-in,
 * sign-up), y su columna izquierda existe para convencer. Acá la persona ya convirtió o ya
 * clickeó el link del mail: poner marketing al lado sería hablarle a alguien que ya entró.
 *
 * Solo pone el fondo y la caja centrada. La alineación de adentro la decide cada página: el
 * resultado de verificar va alineado a la izquierda con sus botones full-width, y check-inbox va
 * centrado.
 */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)',
        padding: '48px 24px',
      }}
    >
      {/* Dos glows radiales para dar calidez, la misma receta que la columna de hero del shell
          de dos columnas. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgb(224 122 77 / 18%) 0, transparent 40%), radial-gradient(circle at 20% 90%, rgb(224 122 77 / 12%) 0, transparent 35%)',
        }}
      />

      <div
        className="relative z-10 bg-bg-card border border-line shadow-card"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '48px 40px',
          borderRadius: 18,
        }}
      >
        {children}
      </div>
    </main>
  );
}
