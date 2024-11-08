package main

import (
	"embed"
	"log"

	"github.com/nikolay-e/touch-typing/internal/app"
)

//go:embed static templates
var content embed.FS

func main() {
	app := app.New(content)
	log.Fatal(app.Start(":80"))
}
