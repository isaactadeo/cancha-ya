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
        SELECT id, full_name, email, phone, password_hash, role, is_blocked, created_at
        FROM users WHERE email = $1`
	err := r.db.QueryRow(query, email).Scan(
		&u.ID, &u.FullName, &u.Email, &u.Phone,
		&u.PasswordHash, &u.Role, &u.IsBlocked, &u.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) FindAll() ([]models.User, error) {
	rows, err := r.db.Query(`
		SELECT id, full_name, email, phone, role, is_blocked, created_at
		FROM users
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.FullName, &u.Email, &u.Phone,
			&u.Role, &u.IsBlocked, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) SetBlocked(userID string, blocked bool) error {
	_, err := r.db.Exec(`UPDATE users SET is_blocked = $1 WHERE id = $2`, blocked, userID)
	return err
}