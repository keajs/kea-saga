import { Plugin, VisitKeaPropertyArguments } from 'kea-typegen'
import * as ts from 'typescript'
const factory = ts.factory

/** Kea v2 TypeGen support */
export default {
  visitKeaProperty(args) {
    if (args.name === 'workers') {
      workers(args)
    }
  },
} as Plugin

export function workers({ parsedLogic, node }: VisitKeaPropertyArguments) {
  // extract `() => ({})` to just `{}`
  if (
    ts.isArrowFunction(node) &&
    ts.isParenthesizedExpression(node.body) &&
    ts.isObjectLiteralExpression(node.body.expression)
  ) {
    node = node.body.expression
  }

  // make sure we have a {}
  if (!ts.isObjectLiteralExpression(node)) {
    return
  }

  const workers: string[] = []

  // go through each property
  for (const property of node.properties) {
    const key = property.name?.getText()
    debugger
    if (key && ts.isFunctionLike(property)) {
      workers.push(key)
    }
  }

  if (workers.length > 0) {
    const oldWorkers =
      'workers' in parsedLogic.extraLogicFields && ts.isTypeLiteralNode(parsedLogic.extraLogicFields['workers'])
        ? parsedLogic.extraLogicFields['workers'].members
        : null

    parsedLogic.extraLogicFields['workers'] = factory.createTypeLiteralNode([
      ...(oldWorkers ?? []),
      ...workers.map((key) =>
        factory.createPropertySignature(
          undefined,
          factory.createIdentifier(key),
          undefined,
          factory.createTypeReferenceNode('Saga'),
        ),
      ),
    ])

    // add deps
    if (!parsedLogic.typeReferencesToImportFromFiles['node_modules/redux-saga']) {
      parsedLogic.typeReferencesToImportFromFiles['node_modules/redux-saga'] = new Set()
    }
    parsedLogic.typeReferencesToImportFromFiles['node_modules/redux-saga'].add('Saga')
  }
}
