package repositories

import (
	"database/sql"

	"github.com/isaactadeo/cancha-ya-api/internal/models"
)

type CourtRepository struct {
	db *sql.DB
}

func NewCourtRepository(db *sql.DB) *CourtRepository {
	return &CourtRepository{db: db}
}

func (r *CourtRepository) FindAll() ([]models.Court, error) {
	rows, err := r.db.Query(`SELECT id, name, type, price_per_hour, is_active FROM courts`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courts []models.Court
	for rows.Next() {
		var c models.Court
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.PricePerHour, &c.IsActive); err != nil {
			return nil, err
		}
		courts = append(courts, c)
	}
	return courts, nil
}

func (r *CourtRepository) FindByID(id int) (*models.Court, error) {
	c := &models.Court{}
	err := r.db.QueryRow(
		`SELECT id, name, type, price_per_hour, is_active FROM courts WHERE id = $1`, id,
	).Scan(&c.ID, &c.Name, &c.Type, &c.PricePerHour, &c.IsActive)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (r *CourtRepository) Create(c *models.Court) error {
	return r.db.QueryRow(
		`INSERT INTO courts (name, type, price_per_hour, is_active)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		c.Name, c.Type, c.PricePerHour, c.IsActive,
	).Scan(&c.ID)
}

func (r *CourtRepository) Update(c *models.Court) error {
	result, err := r.db.Exec(
		`UPDATE courts SET name=$1, type=$2, price_per_hour=$3, is_active=$4 WHERE id=$5`,
		c.Name, c.Type, c.PricePerHour, c.IsActive, c.ID,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *CourtRepository) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM courts WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
