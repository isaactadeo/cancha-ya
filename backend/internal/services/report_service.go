package services

import (
	"errors"
	"time"

	"github.com/isaactadeo/cancha-ya-api/internal/repositories"
)

type ReportService struct {
	reportRepo *repositories.ReportRepository
}

func NewReportService(repo *repositories.ReportRepository) *ReportService {
	return &ReportService{reportRepo: repo}
}

func (s *ReportService) Ingresos(desde, hasta string) (interface{}, error) {
	d, h, err := parsePeriodo(desde, hasta)
	if err != nil {
		return nil, err
	}
	return s.reportRepo.IngresosPorPeriodo(d, h)
}

func (s *ReportService) Ocupacion(desde, hasta string) (interface{}, error) {
	d, h, err := parsePeriodo(desde, hasta)
	if err != nil {
		return nil, err
	}
	return s.reportRepo.OcupacionPorCancha(d, h)
}

func parsePeriodo(desde, hasta string) (time.Time, time.Time, error) {
	if desde == "" || hasta == "" {
		return time.Time{}, time.Time{}, errors.New("parámetros desde y hasta requeridos")
	}
	d, err := time.Parse("2006-01-02", desde)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("formato inválido, usá: 2006-01-02")
	}
	h, err := time.Parse("2006-01-02", hasta)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("formato inválido, usá: 2006-01-02")
	}
	if h.Before(d) {
		return time.Time{}, time.Time{}, errors.New("hasta debe ser mayor que desde")
	}
	return d, h.Add(24*time.Hour - time.Second), nil
}
