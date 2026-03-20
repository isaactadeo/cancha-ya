package services

import (
	"errors"
	"math"
	"time"

	"github.com/isaactadeo/cancha-ya-api/internal/models"
	"github.com/isaactadeo/cancha-ya-api/internal/repositories"
)

type ReservationService struct {
	reservationRepo *repositories.ReservationRepository
	courtRepo       *repositories.CourtRepository
}

func NewReservationService(
	reservationRepo *repositories.ReservationRepository,
	courtRepo *repositories.CourtRepository,
) *ReservationService {
	return &ReservationService{
		reservationRepo: reservationRepo,
		courtRepo:       courtRepo,
	}
}

func (s *ReservationService) Create(userID string, req *models.ReservationRequest) (*models.Reservation, error) {
	// Verificar que la cancha existe y está activa
	court, err := s.courtRepo.FindByID(req.CourtID)
	if err != nil {
		return nil, err
	}
	if court == nil || !court.IsActive {
		return nil, errors.New("cancha no disponible")
	}

	// Parsear horario
	startTime, err := time.Parse("2006-01-02T15:04:05", req.StartTime)
	if err != nil {
		return nil, errors.New("formato de fecha inválido, usá: 2006-01-02T15:04:05")
	}

	// Validar que sea en el futuro
	if startTime.Before(time.Now()) {
		return nil, errors.New("no podés reservar en el pasado")
	}

	// Validar horario habilitado (8:00 - 24:00)
	hour := startTime.Hour()
	if hour < 8 {
		return nil, errors.New("horario no habilitado, reservas desde las 8:00")
	}

	endTime := startTime.Add(time.Duration(req.Duration) * time.Minute)
	if endTime.Hour() == 0 && endTime.Minute() == 0 {
		// medianoche exacta está bien
	} else if endTime.After(startTime.Truncate(24 * time.Hour).Add(24 * time.Hour)) {
		return nil, errors.New("la reserva excede el horario permitido")
	}

	// Calcular precio dinámico
	price := calcularPrecio(court.PricePerHour, startTime, req.Duration)

	reservation := &models.Reservation{
		UserID:     userID,
		CourtID:    req.CourtID,
		StartTime:  startTime,
		EndTime:    endTime,
		TotalPrice: price,
		Status:     models.StatusReservada,
	}

	// El constraint de la DB rechaza solapamientos automáticamente
	if err := s.reservationRepo.Create(reservation); err != nil {
		if isOverlapError(err) {
			return nil, errors.New("ese horario ya está reservado")
		}
		return nil, err
	}

	return reservation, nil
}

func (s *ReservationService) Cancel(reservationID string, userID string, userRole string) error {
	res, err := s.reservationRepo.FindByID(reservationID)
	if err != nil {
		return err
	}
	if res == nil {
		return errors.New("reserva no encontrada")
	}

	// Solo el dueño o un admin pueden cancelar
	if res.UserID != userID && userRole != "admin" {
		return errors.New("sin permisos para cancelar esta reserva")
	}

	if res.Status == models.StatusCancelada {
		return errors.New("la reserva ya está cancelada")
	}

	// No se puede cancelar si ya empezó
	if time.Now().After(res.StartTime) {
		return errors.New("no se puede cancelar un turno ya iniciado")
	}

	return s.reservationRepo.UpdateStatus(reservationID, models.StatusCancelada)
}

func (s *ReservationService) GetByUser(userID string) ([]models.Reservation, error) {
	return s.reservationRepo.FindByUser(userID)
}

func (s *ReservationService) GetByDate(dateStr string) ([]models.Reservation, error) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, errors.New("formato de fecha inválido, usá: 2006-01-02")
	}
	return s.reservationRepo.FindByDate(date)
}

// calcularPrecio aplica las reglas de precio dinámico
func calcularPrecio(precioBase float64, start time.Time, duracionMin int) float64 {
	precio := precioBase * float64(duracionMin) / 60.0

	// +20% fin de semana
	if start.Weekday() == time.Saturday || start.Weekday() == time.Sunday {
		precio *= 1.20
	}

	// +15% horario nocturno (20:00 - 24:00)
	if start.Hour() >= 20 {
		precio *= 1.15
	}

	return math.Round(precio*100) / 100
}

// isOverlapError detecta el error del constraint de exclusión de Postgres
func isOverlapError(err error) bool {
	return err != nil && contains(err.Error(), "no_overlap")
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func (s *ReservationService) GetByDateWithUser(dateStr string) ([]models.ReservationWithUser, error) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, errors.New("formato de fecha inválido, usá: 2006-01-02")
	}
	return s.reservationRepo.FindByDateWithUser(date)
}
