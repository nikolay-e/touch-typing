package app

import (
	"embed"
	"html/template"
	"io/fs"
	"log"
	"net/http"

	"github.com/nikolay-e/touch-typing/internal/handlers"
	"github.com/nikolay-e/touch-typing/internal/models"
	"github.com/nikolay-e/touch-typing/internal/utils"
)

type App struct {
	mux       *http.ServeMux
	templates *template.Template
	state     *models.AppState
}

func New(content embed.FS) *App {
	app := &App{
		mux:   http.NewServeMux(),
		state: models.NewAppState(),
	}

	var err error
	app.templates, err = template.New("").Funcs(utils.TemplateFuncs).ParseFS(content, "templates/*.html")
	if err != nil {
		log.Fatal(err)
	}

	app.setupRoutes(content)

	return app
}

func (a *App) setupRoutes(content embed.FS) {
	h := handlers.New(a.templates, a.state)

	// Serve static files
	staticFS, err := fs.Sub(content, "static")
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.FS(staticFS))
	a.mux.Handle("/static/", http.StripPrefix("/static/", fileServer))

	// Routes
	a.mux.HandleFunc("/", h.HandleIndex)
	a.mux.HandleFunc("/check-char", h.HandleCheckChar)
	a.mux.HandleFunc("/toggle-mode", h.HandleToggleMode)
	a.mux.HandleFunc("/toggle-language", h.HandleToggleLanguage)
	a.mux.HandleFunc("/get-stats", h.HandleGetStats)
}

func (a *App) Start(addr string) error {
	log.Printf("Server starting on %s", addr)
	return http.ListenAndServe(addr, a.mux)
}
