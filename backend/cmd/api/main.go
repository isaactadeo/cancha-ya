package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/isaactadeo/cancha-ya-api/internal/handlers"
	"github.com/isaactadeo/cancha-ya-api/internal/middlewares"
	"github.com/isaactadeo/cancha-ya-api/internal/repositories"
	"github.com/isaactadeo/cancha-ya-api/internal/services"
	"github.com/isaactadeo/cancha-ya-api/pkg/utils"
)

func main() {
	db := utils.NewDB()
	defer db.Close()

	userRepo := repositories.NewUserRepository(db)
	courtRepo := repositories.NewCourtRepository(db)
	reservationRepo := repositories.NewReservationRepository(db)
	reportRepo := repositories.NewReportRepository(db)

	authService := services.NewAuthService(userRepo)
	courtService := services.NewCourtService(courtRepo)
	reservationService := services.NewReservationService(reservationRepo, courtRepo)
	reportService := services.NewReportService(reportRepo)

	authHandler := handlers.NewAuthHandler(authService)
	courtHandler := handlers.NewCourtHandler(courtService)
	reservationHandler := handlers.NewReservationHandler(reservationService)
	reportHandler := handlers.NewReportHandler(reportService)

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	auth := r.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	r.GET("/canchas", courtHandler.GetAll)
	r.GET("/canchas/:id", courtHandler.GetByID)

	api := r.Group("/api", middlewares.AuthRequired())
	{
		api.GET("/me", authHandler.Me)
		api.POST("/reservas", reservationHandler.Create)
		api.GET("/mis-reservas", reservationHandler.MyReservations)
		api.DELETE("/reservas/:id", reservationHandler.Cancel)
		api.GET("/reservas", reservationHandler.GetByDate)

		admin := api.Group("/admin", middlewares.RoleRequired("admin"))
		{
			admin.GET("/usuarios", authHandler.ListUsers)
			admin.POST("/canchas", courtHandler.Create)
			admin.PUT("/canchas/:id", courtHandler.Update)
			admin.DELETE("/canchas/:id", courtHandler.Delete)
			admin.GET("/reportes/ingresos", reportHandler.Ingresos)
			admin.GET("/reportes/ocupacion", reportHandler.Ocupacion)
		}
	}

	r.Run(":8080")
}
