package services

import (
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/isaactadeo/cancha-ya-api/internal/models"
	"github.com/isaactadeo/cancha-ya-api/internal/repositories"
)

const maxReservasActivas = 3

func zonaArgentina() *time.Location {
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		loc = time.FixedZone("ART", -3*60*60)
	}
	return loc
}

type ReservationService struct {
	reservationRepo *repositories.ReservationRepository
	courtRepo       *repositories.CourtRepository
	emailService    *EmailService
}

func NewReservationService(
	reservationRepo *repositories.ReservationRepository,
	courtRepo *repositories.CourtRepository,
	emailService *EmailService,
) *ReservationService {
	return &ReservationService{
		reservationRepo: reservationRepo,
		courtRepo:       courtRepo,
		emailService:    emailService,
	}
}

type CreateParams struct {
	Req       *models.ReservationRequest
	UserID    string
	UserEmail string
	UserName  string
	UserRole  string
}

func (s *ReservationService) Create(params CreateParams) (*models.Reservation, error) {
	court, err := s.courtRepo.FindByID(params.Req.CourtID)
	if err != nil {
		return nil, err
	}
	if court == nil || !court.IsActive {
		return nil, errors.New("cancha no disponible")
	}

	loc := zonaArgentina()

	startTime, err := time.ParseInLocation("2006-01-02T15:04:05", params.Req.StartTime, loc)
	if err != nil {
		return nil, errors.New("formato de fecha inválido, usá: 2006-01-02T15:04:05")
	}

	ahora := time.Now().In(loc)

	if startTime.Before(ahora) {
		return nil, errors.New("no podés reservar en el pasado")
	}

	hour := startTime.Hour()
	if hour < 8 {
		return nil, errors.New("horario no habilitado, reservas desde las 8:00")
	}

	endTime := startTime.Add(time.Duration(params.Req.Duration) * time.Minute)
	if endTime.Hour() == 0 && endTime.Minute() == 0 {
		// medianoche exacta está bien
	} else if endTime.After(startTime.Truncate(24*time.Hour).Add(24*time.Hour)) {
		return nil, errors.New("la reserva excede el horario permitido")
	}

	if params.UserRole != "admin" {
		activas, err := s.reservationRepo.CountActiveByUser(params.UserID)
		if err != nil {
			return nil, err
		}
		if activas >= maxReservasActivas {
			return nil, fmt.Errorf("ya tenés %d reservas activas, cancelá alguna antes de hacer una nueva", maxReservasActivas)
		}
	}

	price := calcularPrecio(court.PricePerHour, startTime, params.Req.Duration)

	reservation := &models.Reservation{
		UserID:     params.UserID,
		CourtID:    params.Req.CourtID,
		StartTime:  startTime,
		EndTime:    endTime,
		TotalPrice: price,
		Status:     models.StatusReservada,
	}

	if err := s.reservationRepo.Create(reservation); err != nil {
		if isOverlapError(err) {
			return nil, errors.New("ese horario ya está reservado")
		}
		return nil, err
	}

	go func() {
		err := s.emailService.SendReservationConfirmation(ReservationEmailData{
			UserName:   params.UserName,
			UserEmail:  params.UserEmail,
			CourtName:  court.Name,
			CourtType:  court.Type,
			StartTime:  startTime,
			EndTime:    endTime,
			TotalPrice: price,
		})
		if err != nil {
			fmt.Printf("[email] Error al enviar confirmación: %v\n", err)
		}
	}()

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

	if res.UserID != userID && userRole != "admin" {
		return errors.New("sin permisos para cancelar esta reserva")
	}

	if res.Status == models.StatusCancelada {
		return errors.New("la reserva ya está cancelada")
	}

	if userRole != "admin" && time.Now().After(res.StartTime) {
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

func (s *ReservationService) GetByDateWithUser(dateStr string) ([]models.ReservationWithUser, error) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, errors.New("formato de fecha inválido, usá: 2006-01-02")
	}
	return s.reservationRepo.FindByDateWithUser(date)
}

func calcularPrecio(precioBase float64, start time.Time, duracionMin int) float64 {
	precio := precioBase * float64(duracionMin) / 60.0
	if start.Weekday() == time.Saturday || start.Weekday() == time.Sunday {
		precio *= 1.20
	}
	if start.Hour() >= 20 {
		precio *= 1.15
	}
	return math.Round(precio*100) / 100
}

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