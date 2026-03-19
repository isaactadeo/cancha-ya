package repositories

import (
	"database/sql"

	"github.com/isaactadeo/cancha-ya-api/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u *models.User) error {
	query := `
        INSERT INTO users (full_name, email, phone, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at`
	return r.db.QueryRow(query,
		u.FullName, u.Email, u.Phone, u.PasswordHash, u.Role,
	).Scan(&u.ID, &u.CreatedAt)
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	u := &models.User{}
	query := `
        SELECT id, full_name, email, phone, password_hash, role, created_at
        FROM users WHERE email = $1`
	err := r.db.QueryRow(query, email).Scan(
		&u.ID, &u.FullName, &u.Email, &u.Phone,
		&u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}
