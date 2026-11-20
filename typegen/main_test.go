package main

import (
	"testing"

	"github.com/keajs/kea-typegen/plugin"
)

func TestWorkerMembers(t *testing.T) {
	req := plugin.Request{Builder: "workers", SupportsLogicFieldMembers: true, Properties: []plugin.Property{
		{Name: "sync", NameKind: "Identifier", Kind: "PropertyAssignment", ValueKind: "FunctionExpression"},
		{Name: "save", NameKind: "Identifier", Kind: "PropertyAssignment", ValueKind: "ArrowFunction"},
		{Name: "ignored", Kind: "MethodDeclaration"},
	}}
	out, err := workers(req)
	members := out.LogicFieldMembers["workers"]
	if err != nil || out.Delegate || len(members) != 2 || members[0].Name != "sync" || members[1].Name != "save" || len(out.Imports) != 1 {
		t.Fatal(out, err)
	}
	req.SupportsLogicFieldMembers = false
	if old, _ := workers(req); !old.Delegate {
		t.Fatal("old worker must use JavaScript")
	}
	req.SupportsLogicFieldMembers = true
	req.Properties[0].NameKind = "ComputedPropertyName"
	if computed, _ := workers(req); !computed.Delegate {
		t.Fatal("computed names must use JavaScript")
	}
}
