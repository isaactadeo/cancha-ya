package models

import "time"

type ReservationStatus string

const (
	StatusReservada ReservationStatus = "reservada"
	StatusCancelada ReservationStatus = "cancelada"
	StatusJugada    ReservationStatus = "jugada"
)

type Reservation struct {
	ID         string            `json:"id"`
	UserID     string            `json:"user_id"`
	CourtID    int               `json:"court_id"`
	StartTime  time.Time         `json:"start_time"`
	EndTime    time.Time         `json:"end_time"`
	TotalPrice float64           `json:"total_price"`
	Status     ReservationStatus `json:"status"`
	CreatedAt  time.Time         `json:"created_at"`
}

type ReservationRequest struct {
	CourtID   int    `json:"court_id"   binding:"required"`
	StartTime string `json:"start_time" binding:"required"`             // "2026-03-20T19:00:00"
	Duration  int    `json:"duration"   binding:"required,oneof=60 90"` // minutos
}
