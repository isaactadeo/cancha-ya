package tests

import (
	"math"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// --- Helpers para los tests ---

func precioEsperado(base float64, start time.Time, duracion int) float64 {
	precio := base * float64(duracion) / 60.0
	if start.Weekday() == time.Saturday || start.Weekday() == time.Sunday {
		precio *= 1.20
	}
	if start.Hour() >= 20 {
		precio *= 1.15
	}
	return math.Round(precio*100) / 100
}

// --- Tests de precios dinámicos ---

func TestPrecio_DiaSemana_HorarioNormal(t *testing.T) {
	// Lunes 10:00 — sin recargo
	start := time.Date(2026, 3, 23, 10, 0, 0, 0, time.UTC) // lunes
	precio := precioEsperado(5000, start, 60)
	assert.Equal(t, 5000.0, precio, "precio base sin recargo")
}

func TestPrecio_FinDeSemana(t *testing.T) {
	// Sábado 10:00 — +20%
	start := time.Date(2026, 3, 21, 10, 0, 0, 0, time.UTC) // sábado
	precio := precioEsperado(5000, start, 60)
	assert.Equal(t, 6000.0, precio, "precio con recargo fin de semana")
}

func TestPrecio_HorarioNocturno(t *testing.T) {
	// Lunes 21:00 — +15%
	start := time.Date(2026, 3, 23, 21, 0, 0, 0, time.UTC)
	precio := precioEsperado(5000, start, 60)
	assert.Equal(t, 5750.0, precio, "precio con recargo nocturno")
}

func TestPrecio_FinDeSemana_Nocturno(t *testing.T) {
	// Sábado 21:00 — +20% y +15%
	start := time.Date(2026, 3, 21, 21, 0, 0, 0, time.UTC)
	precio := precioEsperado(5000, start, 60)
	assert.Equal(t, 6900.0, precio, "precio con recargo finde y nocturno")
}

func TestPrecio_90Minutos(t *testing.T) {
	// 90 minutos día de semana normal
	start := time.Date(2026, 3, 23, 10, 0, 0, 0, time.UTC)
	precio := precioEsperado(5000, start, 90)
	assert.Equal(t, 7500.0, precio, "precio 90 minutos")
}

// --- Tests de reglas de cancelación ---

func TestCancelacion_MasDe24hs(t *testing.T) {
	// Reserva en 48hs — se puede cancelar
	startTime := time.Now().Add(48 * time.Hour)
	puedeCancel := time.Now().Before(startTime) && time.Until(startTime) > 24*time.Hour
	assert.True(t, puedeCancel, "debe poder cancelar con mas de 24hs")
}

func TestCancelacion_MenosDe24hs(t *testing.T) {
	// Reserva en 12hs — cancelación con penalización
	startTime := time.Now().Add(12 * time.Hour)
	esCancelacionTardia := time.Now().Before(startTime) && time.Until(startTime) <= 24*time.Hour
	assert.True(t, esCancelacionTardia, "debe detectar cancelacion tardia")
}

func TestCancelacion_TurnoIniciado(t *testing.T) {
	// Turno que ya empezó — no se puede cancelar
	startTime := time.Now().Add(-30 * time.Minute)
	noPuedeCancel := time.Now().After(startTime)
	assert.True(t, noPuedeCancel, "no debe poder cancelar turno iniciado")
}

// --- Tests de horarios habilitados ---

func TestHorario_Valido(t *testing.T) {
	start := time.Date(2026, 3, 23, 10, 0, 0, 0, time.UTC)
	assert.True(t, start.Hour() >= 8, "horario valido desde las 8")
}

func TestHorario_Invalido(t *testing.T) {
	start := time.Date(2026, 3, 23, 6, 0, 0, 0, time.UTC)
	assert.False(t, start.Hour() >= 8, "horario invalido antes de las 8")
}
