import * as React from 'react';

/** =========================================================
 *  OMNIA — Medalleros (SVG con relieve metálico + descripciones)
 *  - Sin librerías externas
 *  - Paleta: negro/obsidiana + naranja + oro
 *  - 9 medallas: Torii, Aconcagua, Fuego, Triada, 5K, Kilimanjaro, Zen Enso, Iguazú, Jaguar
 *  - Usos:
 *      <OmniaMedalsGrid />
 *      // o individual
 *      <OmniaMedal kind="torii" title="Torii Miyajima" subtitle="Racha 7 días" />
 *  ========================================================= */

type MedalKind =
  | 'torii'
  | 'aconcagua'
  | 'fuego'
  | 'triada'
  | '5k'
  | 'kilimanjaro'
  | 'enso'
  | 'iguazu'
  | 'jaguar';

type MedalProps = {
  kind: MedalKind;
  title: string;
  subtitle: string;
  /** Tamaño horizontal en px (alto se calcula) */
  width?: number;
  /** Estado opcional */
  state?: 'earned' | 'progress' | 'locked';
};

const ACHIEVEMENTS: Array<{ id: MedalKind; title: string; subtitle: string }> = [
  { id: 'torii',        title: 'Torii Miyajima',        subtitle: 'Racha 7 días' },
  { id: 'aconcagua',    title: 'Aconcagua',             subtitle: 'Fondo 21 K' },
  { id: 'fuego',        title: 'Fuego OrangeCore',      subtitle: 'Kcal objetivo 20 días' },
  { id: 'triada',       title: 'Triada Omnia',          subtitle: 'Fuerza + Cardio + Movilidad' },
  { id: '5k',           title: '5K Logro',              subtitle: '5K completado' },
  { id: 'kilimanjaro',  title: 'Kilimanjaro',           subtitle: '30 sesiones' },
  { id: 'enso',         title: 'Zen Enso',              subtitle: 'Movilidad 30 min × 15' },
  { id: 'iguazu',       title: 'Iguazú',                subtitle: '10.000 pasos por 10 días' },
  { id: 'jaguar',       title: 'Jaguar',                subtitle: 'HIIT avanzado × 10' },
];

/* ---------- Helpers de color ---------- */
const COL = {
  obsidian: '#0F1012',
  graphite: '#1A1C1F',
  orange:   '#FF6A00',
  orange2:  '#FFA766',
  gold1:    '#E1BF5E',
  gold2:    '#B58C3B',
  gold3:    '#8A6B2E',
  silver1:  '#D7D8DD',
  silver2:  '#9AA0A6',
  gun:      '#101215',
};

function useSvgIds(prefix: string) {
  const uid = React.useId().replace(/:/g, '');
  const id = (name: string) => `${prefix}-${name}-${uid}`;
  return { id };
}

/* ---------- Íconos internos (simplificados pero vistosos) ---------- */
function IconTorii() {
  return (
    <g>
      {/* olas debajo */}
      <path d="M15 88 Q35 76 55 88 T95 88 T135 88" fill="url(#waveGrad)" />
      {/* sol */}
      <circle cx="105" cy="42" r="16" fill="#D0382C" opacity="0.9" />
      {/* torii */}
      <rect x="46" y="30" width="118" height="8" rx="2" fill="#C4311F" />
      <rect x="40" y="38" width="130" height="6" rx="2" fill="#AD2B1A" />
      <rect x="70" y="44" width="10" height="34" fill="#C4311F" />
      <rect x="134" y="44" width="10" height="34" fill="#C4311F" />
      <rect x="92" y="52" width="30" height="8" fill="#AD2B1A" />
    </g>
  );
}
function IconAconcagua() {
  return (
    <g>
      <polygon points="40,90 95,35 150,90" fill="url(#mountGrad)" />
      <polygon points="95,35 112,60 78,60" fill="#F2EFEA" />
      <circle cx="55" cy="52" r="8" fill="#D2551F" opacity="0.8" />
      <path d="M20 100 H180" stroke="rgba(255,255,255,.25)" strokeWidth="2" />
    </g>
  );
}
function IconFuego() {
  return (
    <g>
      <path
        d="M110 40c6 16-10 22-8 34 2 12 16 18 6 34-18 0-40-16-40-36s18-36 42-36z"
        fill="url(#flameGrad)"
      />
      <circle cx="102" cy="90" r="24" fill="url(#coreGrad)" />
    </g>
  );
}
function IconTriada() {
  return (
    <g>
      <polygon points="40,100 105,22 170,100" fill="url(#triGrad)" />
      <polygon points="60,95 105,35 150,95" fill="url(#triInnerGrad)" />
      <circle cx="105" cy="72" r="8" fill="#FFE7C1" />
      <rect x="101" y="66" width="8" height="12" rx="2" fill="#E6A64B" />
      <rect x="98" y="70" width="14" height="4" rx="2" fill="#E6A64B" />
    </g>
  );
}
function Icon5K() {
  return (
    <g>
      <circle cx="105" cy="66" r="42" fill="url(#coinGrad)" />
      <text
        x="105"
        y="74"
        textAnchor="middle"
        fontSize="34"
        fontWeight={900}
        fill="#3B2A09"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}
      >
        5K
      </text>
    </g>
  );
}
function IconKilimanjaro() {
  return (
    <g>
      <polygon points="40,92 95,48 150,92" fill="url(#mountGrad)" />
      <rect x="20" y="92" width="170" height="6" fill="rgba(255,255,255,.2)" />
      <circle cx="142" cy="56" r="10" fill="#E4882C" />
    </g>
  );
}
function IconEnso() {
  return (
    <g>
      <circle cx="105" cy="66" r="36" stroke="url(#ensoGrad)" strokeWidth="14" fill="none" />
      <path d="M70 78 Q105 96 140 66" stroke="rgba(0,0,0,.35)" strokeWidth="8" fill="none" />
    </g>
  );
}
function IconIguazu() {
  return (
    <g>
      {/* cascada */}
      <rect x="72" y="40" width="20" height="48" rx="5" fill="#9ED7FF" opacity="0.9" />
      <rect x="92" y="40" width="20" height="48" rx="5" fill="#BEE6FF" opacity="0.9" />
      <rect x="112" y="40" width="18" height="48" rx="5" fill="#8CCFFF" opacity="0.9" />
      {/* rocas */}
      <rect x="60" y="86" width="110" height="8" rx="4" fill="#6C5A3A" />
      {/* vegetación */}
      <circle cx="60" cy="52" r="10" fill="#2D6B3A" />
      <circle cx="148" cy="54" r="9" fill="#2D6B3A" />
    </g>
  );
}
function IconJaguar() {
  return (
    <g stroke="#E9C064" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* cara geométrica */}
      <path d="M75 50 L105 36 L135 50 L130 86 L105 98 L80 86 Z" />
      <path d="M92 70 L105 74 L118 70" />
      <path d="M90 82 Q105 90 120 82" />
      <path d="M88 60 Q105 66 122 60" />
      <circle cx="96" cy="62" r="2.5" fill="#E9C064" />
      <circle cx="114" cy="62" r="2.5" fill="#E9C064" />
    </g>
  );
}

/* ---------- Medalla base (ribbon + aro metálico + cara) ---------- */
export function OmniaMedal({
  kind,
  title,
  subtitle,
  width = 220,
  state = 'earned',
}: MedalProps) {
  const { id } = useSvgIds(`md-${kind}`);
  const W = width;
  const H = Math.round(W * 1.45); // proporción agradable
  const faceX = 20;
  const faceY = 64;
  const faceW = W - 40;
  const faceH = faceW; // circular

  const dim = { W, H, faceX, faceY, faceW, faceH };

  // estado visual
  const faceOpacity = state === 'locked' ? 0.5 : 1;
  const ribbonOpacity = state === 'locked' ? 0.45 : 1;
  const ringStroke = state === 'progress' ? '#D6A84C' : COL.gold1;

  // Ícono según medalla
  const renderIcon = () => {
    switch (kind) {
      case 'torii': return <IconTorii />;
      case 'aconcagua': return <IconAconcagua />;
      case 'fuego': return <IconFuego />;
      case 'triada': return <IconTriada />;
      case '5k': return <Icon5K />;
      case 'kilimanjaro': return <IconKilimanjaro />;
      case 'enso': return <IconEnso />;
      case 'iguazu': return <IconIguazu />;
      case 'jaguar': return <IconJaguar />;
    }
  };

  return (
    <div style={{ width: W, color: 'white', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <defs>
          {/* Gradientes metálicos / naranjas */}
          <linearGradient id={id('gold')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COL.gold1} />
            <stop offset="55%" stopColor={COL.gold2} />
            <stop offset="100%" stopColor={COL.gold3} />
          </linearGradient>
          <linearGradient id={id('rim')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F7E7A1" />
            <stop offset="40%" stopColor={COL.gold1} />
            <stop offset="85%" stopColor={COL.gold3} />
          </linearGradient>
          <linearGradient id={id('ribbon')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15171B" />
            <stop offset="50%" stopColor="#202428" />
            <stop offset="100%" stopColor="#15171B" />
          </linearGradient>
          <linearGradient id={id('ribbonStripe')} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COL.orange2} />
            <stop offset="100%" stopColor={COL.orange} />
          </linearGradient>
          <radialGradient id={id('faceGrad')} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#2A2F36" />
            <stop offset="100%" stopColor="#171A1E" />
          </radialGradient>
          <linearGradient id="mountGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B4C4D1" />
            <stop offset="100%" stopColor="#6A7E8D" />
          </linearGradient>
          <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD4A2" />
            <stop offset="40%" stopColor="#FF8A2A" />
            <stop offset="100%" stopColor="#D94A00" />
          </linearGradient>
          <radialGradient id="coreGrad" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#FFF0D2" />
            <stop offset="70%" stopColor="#FF9A3A" />
            <stop offset="100%" stopColor="#C94A00" />
          </radialGradient>
          <linearGradient id="triGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE8BB" />
            <stop offset="100%" stopColor="#D8A24D" />
          </linearGradient>
          <linearGradient id="triInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#353B42" />
            <stop offset="100%" stopColor="#1E2328" />
          </linearGradient>
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3D78B" />
            <stop offset="100%" stopColor="#C99C41" />
          </linearGradient>
          <linearGradient id="ensoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F4E1A5" />
            <stop offset="100%" stopColor="#C49334" />
          </linearGradient>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F06A48" />
            <stop offset="100%" stopColor="#8E2213" />
          </linearGradient>

          {/* Sombras / brillos */}
          <filter id={id('drop')} x="-40%" y="-40%" width="200%" height="200%">
            <feOffset dx="0" dy="8" />
            <feGaussianBlur stdDeviation="6" result="b" />
            <feColorMatrix in="b" type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 .45 0" />
          </filter>
          <filter id={id('inner')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="sa" />
            <feOffset dx="0" dy="2" in="sa" result="off" />
            <feComposite in="off" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner" />
            <feColorMatrix in="inner" type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 .6 0" />
            <feBlend in="SourceGraphic" mode="normal" />
          </filter>
          <filter id={id('gloss')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* —— CINTA —— */}
        <g opacity={ribbonOpacity}>
          <path
            d={`M${W / 2 - 80} 0 H${W / 2 + 80} L${W / 2 + 60} 44 H${W / 2 - 60} Z`}
            fill={`url(#${id('ribbon')})`}
          />
          {/* franjas naranjas */}
          <rect x={W / 2 - 80} y={0} width={14} height={44} fill={`url(#${id('ribbonStripe')})`} />
          <rect x={W / 2 + 66} y={0} width={14} height={44} fill={`url(#${id('ribbonStripe')})`} />
          {/* travesaño */}
          <rect x={W / 2 - 70} y={44} width={140} height={12} rx={6} fill={`url(#${id('gold')})`} filter={`url(#${id('drop')})`} />
        </g>

        {/* —— ARO / MEDALLÓN —— */}
        <g transform={`translate(${faceX}, ${faceY})`} opacity={faceOpacity}>
          {/* aro metálico */}
          <circle cx={faceW / 2} cy={faceH / 2} r={(faceW / 2)} fill={`url(#${id('rim')})`} />
          <circle cx={faceW / 2} cy={faceH / 2} r={(faceW / 2) - 8} fill={COL.gun} filter={`url(#${id('inner')})`} />
          {/* cara (fondo) */}
          <circle cx={faceW / 2} cy={faceH / 2} r={(faceW / 2) - 16} fill={`url(#${id('faceGrad')})`} />

          {/* icono específico */}
          <g transform="translate(0,6) scale(1)">
            {renderIcon()}
          </g>

          {/* brillo superior */}
          <ellipse
            cx={faceW / 2}
            cy={faceH * 0.28}
            rx={faceW * 0.36}
            ry={faceH * 0.18}
            fill="white"
            opacity="0.12"
            filter={`url(#${id('gloss')})`}
          />
          {/* aro externo fino */}
          <circle
            cx={faceW / 2}
            cy={faceH / 2}
            r={(faceW / 2) - 6}
            fill="none"
            stroke={ringStroke}
            strokeWidth={2}
            opacity="0.85"
          />
        </g>
      </svg>

      {/* Descripción bajo la medalla */}
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#B8BDC7' }}>{subtitle}</div>
      </div>
    </div>
  );
}

/* ---------- Grid listo para usar en la "Ventana de Medalleros" ---------- */
export function OmniaMedalsGrid() {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg,#0F1012 0%,#0B0C0E 100%)',
        padding: 20,
        borderRadius: 24,
        color: 'white',
      }}
    >
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18, color: COL.orange }}>OMNIA · Medalleros</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
          gap: 16,
        }}
      >
        {ACHIEVEMENTS.map((a, i) => (
          <OmniaMedal
            key={a.id}
            kind={a.id}
            title={a.title}
            subtitle={a.subtitle}
            state={i % 7 === 0 ? 'progress' : 'earned'} // demo
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Export por defecto: el grid ---------- */
export default OmniaMedalsGrid;

