// Package plugin is the version 1 API for portable Kea typegen builders.
package plugin

import (
	"encoding/json"
	"fmt"
	"os"
)

const Version = 1

// Property describes an object member. Type is populated for manifest typePaths.
type Property struct {
	Name, Kind, NameKind, ValueKind, Type string
	Properties                            []Property
}

type Request struct {
	Version                              int
	Builder, File, Logic, Argument, Kind string
	SupportsLogicFieldMembers            bool
	Properties                           []Property
}

type Parameter struct {
	Name, Type string
	Optional   bool
}

type Action struct {
	Name, Type string
	Params     []Parameter
}

type Value struct{ Name, Type string }
type Import struct{ File, Name string }

type Result struct {
	Actions             []Action
	Reducers, Selectors []Value
	Imports             []Import
	// LogicFieldMembers adds named members to object fields on the logic itself.
	LogicFieldMembers map[string][]Value `json:",omitempty"`
	// Delegate requests the package's JavaScript visitor for this file.
	Delegate bool
}

// Serve reads one request and writes one result. Compile the command with
// GOOS=wasip1 GOARCH=wasm and ship the module alongside typegen.json.
func Serve(visit func(Request) (Result, error)) {
	var request Request
	err := json.NewDecoder(os.Stdin).Decode(&request)
	if err == nil && request.Version != Version {
		err = fmt.Errorf("unsupported typegen protocol %d", request.Version)
	}
	if err == nil {
		var result Result
		result, err = visit(request)
		if err == nil {
			err = json.NewEncoder(os.Stdout).Encode(result)
		}
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
