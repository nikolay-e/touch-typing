package handlers

import (
	"html/template"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/nikolay-e/touch-typing/internal/models"
)

type Handler struct {
	templates *template.Template
	state     *models.AppState
	mu        sync.RWMutex
}

const (
	englishLetters = "abcdefghijklmnopqrstuvwxyz"
	russianLetters = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
	numbers        = "0123456789"
	specialChars   = "!@#$%^&*()_+-={}[]|\\:;\"'<>,.?/~`"
)

func New(tmpl *template.Template, state *models.AppState) *Handler {
	h := &Handler{
		templates: tmpl,
		state:     state,
	}
	h.initializeCharStats()
	h.updateCharacterSet()
	return h
}

func (h *Handler) initializeCharStats() {
	allChars := englishLetters + russianLetters + numbers + specialChars
	h.mu.Lock()
	defer h.mu.Unlock()

	for _, c := range allChars {
		h.state.Stats.CharStats[string(c)] = &models.Character{
			ConfusedWith: make(map[string]int64),
		}
		// Initialize uppercase variants for letters
		if (c >= 'a' && c <= 'z') || (c >= 'а' && c <= 'я') {
			upperChar := string(c - 32)
			h.state.Stats.CharStats[upperChar] = &models.Character{
				ConfusedWith: make(map[string]int64),
			}
		}
	}
}

func (h *Handler) updateCharacterSet() {
	h.mu.Lock()
	defer h.mu.Unlock()

	var chars string
	letters := englishLetters
	if h.state.CurrentLang == "russian" {
		letters = russianLetters
	}

	if h.state.Modes.Lowercase {
		chars += letters
	}
	if h.state.Modes.Uppercase {
		for _, c := range letters {
			chars += string(c - 32)
		}
	}
	if h.state.Modes.Numbers {
		chars += numbers
	}
	if h.state.Modes.Special {
		chars += specialChars
	}

	h.state.Characters = chars
	if chars != "" {
		h.state.CurrentChar = string(chars[rand.Intn(len(chars))])
	} else {
		h.state.CurrentChar = ""
	}
}

func (h *Handler) HandleIndex(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	h.templates.ExecuteTemplate(w, "index.html", h.state)
}

func (h *Handler) HandleCheckChar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	pressedChar := r.FormValue("char")
	timeTaken, _ := time.Parse(time.RFC3339Nano, r.FormValue("startTime"))
	duration := time.Since(timeTaken).Milliseconds()

	charStats := h.state.Stats.CharStats[h.state.CurrentChar]
	if charStats == nil {
		charStats = &models.Character{
			ConfusedWith: make(map[string]int64),
		}
		h.state.Stats.CharStats[h.state.CurrentChar] = charStats
	}

	charStats.Total++
	charStats.TotalTime += duration
	h.state.Stats.TotalCount++
	h.state.Stats.TotalTime += duration

	var correct bool
	if pressedChar == h.state.CurrentChar {
		charStats.Correct++
		h.state.Stats.CorrectCount++
		correct = true
	} else {
		charStats.Incorrect++
		charStats.ConfusedWith[pressedChar]++
	}

	type response struct {
		Correct    bool   `json:"correct"`
		TimeTaken  int64  `json:"timeTaken"`
		NewChar    string `json:"newChar"`
		QuickStats struct {
			Accuracy float64 `json:"accuracy"`
			AvgTime  float64 `json:"avgTime"`
		} `json:"quickStats"`
	}

	resp := response{
		Correct:   correct,
		TimeTaken: duration,
	}

	if h.state.Characters != "" {
		resp.NewChar = string(h.state.Characters[rand.Intn(len(h.state.Characters))])
		h.state.CurrentChar = resp.NewChar
	}

	if h.state.Stats.TotalCount > 0 {
		resp.QuickStats.Accuracy = float64(h.state.Stats.CorrectCount) / float64(h.state.Stats.TotalCount) * 100
		resp.QuickStats.AvgTime = float64(h.state.Stats.TotalTime) / float64(h.state.Stats.TotalCount)
	}

	h.templates.ExecuteTemplate(w, "character.html", h.state)
}

func (h *Handler) HandleToggleMode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	mode := r.URL.Query().Get("mode")
	switch mode {
	case "lowercase":
		h.state.Modes.Lowercase = !h.state.Modes.Lowercase
	case "uppercase":
		h.state.Modes.Uppercase = !h.state.Modes.Uppercase
	case "numbers":
		h.state.Modes.Numbers = !h.state.Modes.Numbers
	case "special":
		h.state.Modes.Special = !h.state.Modes.Special
	}

	h.updateCharacterSet()
	h.templates.ExecuteTemplate(w, "character.html", h.state)
}

func (h *Handler) HandleToggleLanguage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if h.state.CurrentLang == "english" {
		h.state.CurrentLang = "russian"
	} else {
		h.state.CurrentLang = "english"
	}

	h.updateCharacterSet()
	h.templates.ExecuteTemplate(w, "character.html", h.state)
}

func (h *Handler) HandleGetStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	h.templates.ExecuteTemplate(w, "stats.html", h.state)
}
