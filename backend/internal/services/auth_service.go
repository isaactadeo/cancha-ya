package services

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/isaactadeo/cancha-ya-api/internal/models"
	"github.com/isaactadeo/cancha-ya-api/internal/repositories"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repositories.UserRepository
}

func NewAuthService(repo *repositories.UserRepository) *AuthService {
	return &AuthService{userRepo: repo}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.AuthResponse, error) {
	existing, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("el email ya está registrado")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		FullName:     req.FullName,
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: string(hash),
		Role:         models.RoleCliente,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("credenciales inválidas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	token, err := generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

func generateToken(user *models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-cambiar-en-produccion"
	}

	claims := jwt.MapClaims{
		"sub":       user.ID,
		"role":      user.Role,
		"email":     user.Email,    // ← nuevo
		"full_name": user.FullName, // ← nuevo
		"exp":       time.Now().Add(72 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
