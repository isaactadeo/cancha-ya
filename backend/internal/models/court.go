package models

type Court struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	PricePerHour float64 `json:"price_per_hour"`
	IsActive     bool    `json:"is_active"`
}

type CourtRequest struct {
	Name         string  `json:"name"           binding:"required"`
	Type         string  `json:"type"           binding:"required,oneof=5 7 11"`
	PricePerHour float64 `json:"price_per_hour" binding:"required,gt=0"`
	IsActive     bool    `json:"is_active"`
}
