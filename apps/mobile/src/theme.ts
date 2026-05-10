/**
 * Design system — colores, tipografía y espaciado centralizados.
 */

export const Colors = {
  // Primarios
  primary:       '#1A73E8',
  primaryDark:   '#1557B0',
  primaryLight:  '#E8F0FE',

  // Semánticos
  success:       '#2E7D32',
  successLight:  '#E8F5E9',
  warning:       '#F57F17',
  warningLight:  '#FFF8E1',
  danger:        '#C62828',
  dangerLight:   '#FFEBEE',
  info:          '#0277BD',
  infoLight:     '#E1F5FE',

  // Neutros
  white:         '#FFFFFF',
  background:    '#F4F6FB',
  surface:       '#FFFFFF',
  border:        '#E0E6F0',
  borderLight:   '#F0F4FA',

  // Texto
  textPrimary:   '#1A1A2E',
  textSecondary: '#5A6478',
  textMuted:     '#9AA3B2',
  textOnPrimary: '#FFFFFF',

  // Severidad interacciones
  sevLeve:       '#F57F17',
  sevLeveBg:     '#FFF8E1',
  sevModerada:   '#E65100',
  sevModeradaBg: '#FBE9E7',
  sevGrave:      '#B71C1C',
  sevGraveBg:    '#FFEBEE',

  // Categorías de condiciones
  catDolor:             '#856404',
  catDolorBg:           '#FFF3CD',
  catInfeccion:         '#721C24',
  catInfeccionBg:       '#F8D7DA',
  catCardiovascular:    '#721C24',
  catCardiovascularBg:  '#F8D7DA',
  catDigestivo:         '#0C5460',
  catDigestivoBg:       '#D1ECF1',
  catRespiratorio:      '#004085',
  catRespiratoriBg:     '#CCE5FF',
  catNeurologico:       '#4A235A',
  catNeurologicoBg:     '#E2D9F3',
  catEndocrino:         '#155724',
  catEndocrinoBg:       '#D4EDDA',
  catMusculo:           '#856404',
  catMusculoBg:         '#FFF3CD',
  catDerma:             '#784212',
  catDermaBg:           '#FDEBD0',
  catOtro:              '#383D41',
  catOtroBg:            '#E2E3E5',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  full: 999,
};

export const Typography = {
  h1:      { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2:      { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3:      { fontSize: 18, fontWeight: '700' as const, color: Colors.textPrimary },
  h4:      { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  body:    { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyBold:{ fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
  small:   { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  tiny:    { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted },
  label:   { fontSize: 11, fontWeight: '700' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
};

export const Shadow = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
};
