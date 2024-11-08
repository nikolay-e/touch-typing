package models

type Stats struct {
	TotalCount   int64                 `json:"totalCount"`
	CorrectCount int64                 `json:"correctCount"`
	TotalTime    int64                 `json:"totalTime"`
	CharStats    map[string]*Character `json:"characterStats"`
}

type Character struct {
	Total        int64            `json:"total"`
	Correct      int64            `json:"correct"`
	Incorrect    int64            `json:"incorrect"`
	TotalTime    int64            `json:"totalTime"`
	ConfusedWith map[string]int64 `json:"confusedWith"`
}

func NewStats() Stats {
	return Stats{
		CharStats: make(map[string]*Character),
	}
}
