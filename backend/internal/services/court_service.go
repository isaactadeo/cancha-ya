package services

import (
	"database/sql"
	"errors"

	"github.com/isaactadeo/cancha-ya-api/internal/models"
	"github.com/isaactadeo/cancha-ya-api/internal/repositories"
)

type CourtService struct {
	courtRepo *repositories.CourtRepository
}

func NewCourtService(repo *repositories.CourtRepository) *CourtService {
	return &CourtService{courtRepo: repo}
}

func (s *CourtService) GetAll() ([]models.Court, error) {
	return s.courtRepo.FindAll()
}

func (s *CourtService) GetByID(id int) (*models.Court, error) {
	court, err := s.courtRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if court == nil {
		return nil, errors.New("cancha no encontrada")
	}
	return court, nil
}

func (s *CourtService) Create(req *models.CourtRequest) (*models.Court, error) {
	court := &models.Court{
		Name:         req.Name,
		Type:         req.Type,
		PricePerHour: req.PricePerHour,
		IsActive:     true,
	}
	if err := s.courtRepo.Create(court); err != nil {
		return nil, err
	}
	return court, nil
}

func (s *CourtService) Update(id int, req *models.CourtRequest) (*models.Court, error) {
	court, err := s.courtRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if court == nil {
		return nil, errors.New("cancha no encontrada")
	}

	court.Name = req.Name
	court.Type = req.Type
	court.PricePerHour = req.PricePerHour
	court.IsActive = req.IsActive

	if err := s.courtRepo.Update(court); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("cancha no encontrada")
		}
		return nil, err
	}
	return court, nil
}

func (s *CourtService) Delete(id int) error {
	err := s.courtRepo.Delete(id)
	if err == sql.ErrNoRows {
		return errors.New("cancha no encontrada")
	}
	return err
}
