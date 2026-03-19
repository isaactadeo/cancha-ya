package models

import "time"

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleEmpleado Role = "empleado"
	RoleCliente  Role = "cliente"
)

type User struct {
	ID           string    `json:"id"`
	FullName     string    `json:"full_name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone,omitempty"`
	PasswordHash string    `json:"-"` // nunca sale en JSON
	Role         Role      `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}
