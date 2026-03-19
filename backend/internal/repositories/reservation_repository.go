package repositories

import (
	"database/sql"
	"time"

	"github.com/isaactadeo/cancha-ya-api/internal/models"
)

type ReservationRepository struct {
	db *sql.DB
}

func NewReservationRepository(db *sql.DB) *ReservationRepository {
	return &ReservationRepository{db: db}
}

func (r *ReservationRepository) Create(res *models.Reservation) error {
	query := `
		INSERT INTO reservations (user_id, court_id, start_time, end_time, total_price, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at`
	return r.db.QueryRow(query,
		res.UserID, res.CourtID, res.StartTime, res.EndTime, res.TotalPrice, res.Status,
	).Scan(&res.ID, &res.CreatedAt)
}

func (r *ReservationRepository) FindByUser(userID string) ([]models.Reservation, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, court_id, start_time, end_time, total_price, status, created_at
		FROM reservations WHERE user_id = $1 ORDER BY start_time DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var res models.Reservation
		if err := rows.Scan(&res.ID, &res.UserID, &res.CourtID, &res.StartTime,
			&res.EndTime, &res.TotalPrice, &res.Status, &res.CreatedAt); err != nil {
			return nil, err
		}
		reservations = append(reservations, res)
	}
	return reservations, nil
}

func (r *ReservationRepository) FindByDate(date time.Time) ([]models.Reservation, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, court_id, start_time, end_time, total_price, status, created_at
		FROM reservations
		WHERE DATE(start_time) = DATE($1) AND status = 'reservada'
		ORDER BY start_time`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []models.Reservation
	for rows.Next() {
		var res models.Reservation
		if err := rows.Scan(&res.ID, &res.UserID, &res.CourtID, &res.StartTime,
			&res.EndTime, &res.TotalPrice, &res.Status, &res.CreatedAt); err != nil {
			return nil, err
		}
		reservations = append(reservations, res)
	}
	return reservations, nil
}

func (r *ReservationRepository) FindByID(id string) (*models.Reservation, error) {
	res := &models.Reservation{}
	err := r.db.QueryRow(`
		SELECT id, user_id, court_id, start_time, end_time, total_price, status, created_at
		FROM reservations WHERE id = $1`, id).
		Scan(&res.ID, &res.UserID, &res.CourtID, &res.StartTime,
			&res.EndTime, &res.TotalPrice, &res.Status, &res.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return res, err
}

func (r *ReservationRepository) UpdateStatus(id string, status models.ReservationStatus) error {
	_, err := r.db.Exec(`UPDATE reservations SET status = $1 WHERE id = $2`, status, id)
	return err
}
