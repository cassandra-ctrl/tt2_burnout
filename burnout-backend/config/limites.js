// CONFIGURACIÓN DE LÍMITES DEL PROGRAMA
// burnout-backend/config/limites.js
//
// Para activar el límite diario:
//   1. Cambia LIMITE_DIARIO_ACTIVO a true
//   2. Ajusta MAX_ACTIVIDADES_POR_DIA según la duración deseada
//
// Ejemplo para programa de 1 mes (28 actividades en ~30 días):
//   MAX_ACTIVIDADES_POR_DIA = 1  →  mínimo 28 días para completar
//   MAX_ACTIVIDADES_POR_DIA = 2  →  mínimo 14 días para completar

module.exports = {
  // ── Bandera principal ──────────────────────────────────────────────────────
  // false = sin restricción (comportamiento actual)
  // true  = activa el límite diario
  LIMITE_DIARIO_ACTIVO: false,

  // ── Cuántas actividades nuevas puede completar un paciente por día ─────────
  MAX_ACTIVIDADES_POR_DIA: 2,

  // ── Referencia de planificación (no afecta la lógica) ─────────────────────
  DURACION_PROGRAMA_DIAS: 30,
  TOTAL_ACTIVIDADES: 28,
};
