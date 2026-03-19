package repositories

import (
	"database/sql"
	"time"
)

type ReportRepository struct {
	db *sql.DB
}

func NewReportRepository(db *sql.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

type IngresosPorDia struct {
	Fecha    time.Time `json:"fecha"`
	Total    float64   `json:"total"`
	Cantidad int       `json:"cantidad"`
}

type OcupacionPorCancha struct {
	CourtID int     `json:"court_id"`
	Nombre  string  `json:"nombre"`
	Total   int     `json:"total_reservas"`
	Jugadas int     `json:"jugadas"`
	Tasa    float64 `json:"tasa_ocupacion"`
}

func (r *ReportRepository) IngresosPorPeriodo(desde, hasta time.Time) ([]IngresosPorDia, error) {
	rows, err := r.db.Query(`
		SELECT
			DATE(start_time) as fecha,
			SUM(total_price) as total,
			COUNT(*) as cantidad
		FROM reservations
		WHERE status != 'cancelada'
		  AND start_time BETWEEN $1 AND $2
		GROUP BY DATE(start_time)
		ORDER BY fecha`, desde, hasta)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []IngresosPorDia
	for rows.Next() {
		var r IngresosPorDia
		if err := rows.Scan(&r.Fecha, &r.Total, &r.Cantidad); err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	return result, nil
}

func (r *ReportRepository) OcupacionPorCancha(desde, hasta time.Time) ([]OcupacionPorCancha, error) {
	rows, err := r.db.Query(`
		SELECT
			c.id,
			c.name,
			COUNT(r.id) as total_reservas,
			COUNT(CASE WHEN r.status = 'jugada' THEN 1 END) as jugadas
		FROM courts c
		LEFT JOIN reservations r
			ON c.id = r.court_id
			AND r.start_time BETWEEN $1 AND $2
		GROUP BY c.id, c.name
		ORDER BY total_reservas DESC`, desde, hasta)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []OcupacionPorCancha
	for rows.Next() {
		var o OcupacionPorCancha
		if err := rows.Scan(&o.CourtID, &o.Nombre, &o.Total, &o.Jugadas); err != nil {
			return nil, err
		}
		if o.Total > 0 {
			o.Tasa = float64(o.Jugadas) / float64(o.Total) * 100
		}
		result = append(result, o)
	}
	return result, nil
}
