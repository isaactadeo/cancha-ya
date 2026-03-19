package utils

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func NewDB() *sql.DB {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "canchauser"),
		getEnv("DB_PASSWORD", "canchapass"),
		getEnv("DB_NAME", "canchadb"),
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("error abriendo DB: %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("error conectando a DB: %v", err)
	}

	log.Println("DB conectada")
	return db
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
