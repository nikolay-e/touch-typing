package utils

import "html/template"

var TemplateFuncs = template.FuncMap{
	"multiply": func(a, b float64) float64 {
		return a * b
	},
	"divide": func(a, b int64) float64 {
		if b == 0 {
			return 0
		}
		return float64(a) / float64(b)
	},
}
