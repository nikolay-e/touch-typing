package models

type AppState struct {
	CurrentChar string   `json:"currentChar"`
	Characters  string   `json:"characters"`
	CurrentLang string   `json:"currentLang"`
	Modes       AppModes `json:"modes"`
	Stats       Stats    `json:"stats"`
}

type AppModes struct {
	Lowercase bool `json:"lowercase"`
	Uppercase bool `json:"uppercase"`
	Numbers   bool `json:"numbers"`
	Special   bool `json:"special"`
}

func NewAppState() *AppState {
	return &AppState{
		CurrentLang: "english",
		Modes: AppModes{
			Lowercase: true,
			Uppercase: false,
			Numbers:   false,
			Special:   false,
		},
		Stats: NewStats(),
	}
}
