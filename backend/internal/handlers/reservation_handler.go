package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/isaactadeo/cancha-ya-api/internal/models"
	"github.com/isaactadeo/cancha-ya-api/internal/services"
)

type ReservationHandler struct {
	reservationService *services.ReservationService
}

func NewReservationHandler(s *services.ReservationService) *ReservationHandler {
	return &ReservationHandler{reservationService: s}
}

func (h *ReservationHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var req models.ReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := h.reservationService.Create(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

func (h *ReservationHandler) Cancel(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	id := c.Param("id")

	if err := h.reservationService.Cancel(id, userID, userRole); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "reserva cancelada"})
}

func (h *ReservationHandler) MyReservations(c *gin.Context) {
	userID := c.GetString("user_id")
	reservations, err := h.reservationService.GetByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reservations)
}

func (h *ReservationHandler) GetByDate(c *gin.Context) {
	date := c.Query("fecha")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetro fecha requerido"})
		return
	}
	reservations, err := h.reservationService.GetByDate(date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reservations)
}
