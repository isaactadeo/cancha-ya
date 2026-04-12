package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const resendAPI = "https://api.resend.com/emails"

type EmailService struct{}

func NewEmailService() *EmailService {
	return &EmailService{}
}

type ReservationEmailData struct {
	UserName   string
	UserEmail  string
	CourtName  string
	CourtType  string
	StartTime  time.Time
	EndTime    time.Time
	TotalPrice float64
}

func (s *EmailService) SendReservationConfirmation(data ReservationEmailData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		// En desarrollo podés dejarlo vacío y simplemente loguear
		fmt.Println("[email] RESEND_API_KEY no configurada, mail no enviado")
		return nil
	}

	fecha := data.StartTime.Format("02/01/2006")
	horaInicio := data.StartTime.UTC().Format("15:04")
	horaFin := data.EndTime.UTC().Format("15:04")

	html := buildEmailHTML(data.UserName, data.CourtName, data.CourtType, fecha, horaInicio, horaFin, data.TotalPrice)

	payload := map[string]interface{}{
		"from":    "CanchaYA <onboarding@resend.dev>",
		"to":      []string{"tadeisaac7@gmail.com"},
		"subject": fmt.Sprintf("✅ Reserva confirmada — %s %s", fecha, horaInicio),
		"html":    html,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error al preparar el mail: %w", err)
	}

	req, err := http.NewRequest("POST", resendAPI, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("error al crear request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("error al enviar mail: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend devolvió status %d", resp.StatusCode)
	}

	fmt.Printf("[email] Confirmación enviada a %s\n", data.UserEmail)
	return nil
}

func buildEmailHTML(nombre, cancha, tipo, fecha, horaInicio, horaFin string, precio float64) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reserva confirmada</title>
</head>
<body style="margin:0;padding:0;background:#0f1a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f1a0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#1a2e1a;border-radius:16px;overflow:hidden;border:1px solid #2d4a2d;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3d1a,#0f2a0f);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:32px;font-weight:900;letter-spacing:2px;color:#ffffff;">
                Cancha<span style="color:#4ade80;">YA</span>
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#86efac;letter-spacing:1px;">
                SISTEMA DE RESERVAS
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">
                ¡Tu reserva está confirmada! ✅
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#86efac;">
                Hola <strong>%s</strong>, acá están los detalles de tu turno:
              </p>

              <!-- Detalle -->
              <table width="100%%" cellpadding="0" cellspacing="0"
                style="background:#0f1a0f;border-radius:12px;border:1px solid #2d4a2d;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #2d4a2d;">
                    <p style="margin:0;font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">Cancha</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#ffffff;">%s — Fútbol %s</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #2d4a2d;">
                    <p style="margin:0;font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">Fecha</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#ffffff;">%s</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #2d4a2d;">
                    <p style="margin:0;font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">Horario</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#ffffff;">%s — %s hs</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">Total</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#4ade80;">$%.0f</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#6b7f6b;line-height:1.6;">
                Si necesitás cancelar tu turno, podés hacerlo desde la app hasta antes de que empiece.
                Ante cualquier consulta respondé este mail.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f1a0f;padding:20px 40px;text-align:center;border-top:1px solid #2d4a2d;">
              <p style="margin:0;font-size:12px;color:#4a5e4a;">
                © 2025 CanchaYA · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`, nombre, cancha, tipo, fecha, horaInicio, horaFin, precio)
}
