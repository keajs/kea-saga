package main

import (
	"strings"

	"github.com/keajs/kea-typegen/plugin"
)

func main() { plugin.Serve(workers) }

func workers(req plugin.Request) (plugin.Result, error) {
	var out plugin.Result
	if req.Builder != "workers" {
		return out, nil
	}
	var members []plugin.Value
	for _, p := range req.Properties {
		if p.Kind != "PropertyAssignment" || (p.ValueKind != "ArrowFunction" && p.ValueKind != "FunctionExpression") {
			continue
		}
		if !req.SupportsLogicFieldMembers || p.NameKind != "Identifier" || strings.Contains(p.Name, `\`) {
			return plugin.Result{Delegate: true}, nil
		}
		members = append(members, plugin.Value{Name: p.Name, Type: "Saga"})
	}
	if len(members) != 0 {
		out.LogicFieldMembers = map[string][]plugin.Value{"workers": members}
		out.Imports = []plugin.Import{{File: "node_modules/redux-saga", Name: "Saga"}}
	}
	return out, nil
}
