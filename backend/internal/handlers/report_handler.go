package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/isaactadeo/cancha-ya-api/internal/services"
)

type ReportHandler struct {
	reportService *services.ReportService
}

func NewReportHandler(s *services.ReportService) *ReportHandler {
	return &ReportHandler{reportService: s}
}

func (h *ReportHandler) Ingresos(c *gin.Context) {
	data, err := h.reportService.Ingresos(
		c.Query("desde"),
		c.Query("hasta"),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *ReportHandler) Ocupacion(c *gin.Context) {
	data, err := h.reportService.Ocupacion(
		c.Query("desde"),
		c.Query("hasta"),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}
