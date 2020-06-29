import { EOL } from 'os'
import { readFileSync } from 'fs'
import 'array-flat-polyfill'
import express from 'express'

const validHttpMethods = new Set(['GET', 'POST', 'PUT', 'DELETE'])

const wrapAsync = (requestHandler: express.Handler): express.Handler => {
  return (req, res, next) => {
    const result = requestHandler(req, res, next) as PromiseLike<any> | unknown

    if (result instanceof Promise) {
      return Promise.resolve(result).catch(next)
    } else {
      return result
    }
  }
}

const configureRoutes = (namedRequestHandlers: { [key: string]: express.Handler }): express.Router => {
  const router = express.Router()
  const data = readFileSync('./routes', 'utf8')
  const lines = data.split(EOL)
  lines.forEach((line, i) => {
    // 1 - clean up the string: remove comments, trim whitespace
    let evolvingLine = line
    if (evolvingLine.includes('#')) {
      evolvingLine = evolvingLine.substr(0, evolvingLine.indexOf('#'))
    }
    const cleanLine = evolvingLine.trim()
    if (cleanLine === '') return

    // 2 - split the array by tabs and spaces into an array of route components, getting rid of empty substrings
    const components = cleanLine.split('\t').map(piece => piece.split(' ')).flat().filter(_ => _)
    if (components.length !== 3) {
      throw new Error(`line ${i + 1} could not be parsed into a route: "${line}"`)
    }
    const [httpMethodUncased, routePath, routeHandler] = components
    const httpMethod = httpMethodUncased.toUpperCase()
    if (!validHttpMethods.has(httpMethod)) {
      throw new Error(`line ${i + 1} specifies an invalid http method: ${httpMethod}`)
    }

    // 3 - turn the components into an express route
    const asyncSafeHandler = wrapAsync(namedRequestHandlers[routeHandler])
    switch (httpMethod) {
      case 'GET':
        router.get(routePath, asyncSafeHandler)
        break
      case 'POST':
        router.post(routePath, asyncSafeHandler)
        break
      case 'PUT':
        router.put(routePath, asyncSafeHandler)
        break
      case 'DELETE':
        router.delete(routePath, asyncSafeHandler)
        break
    }
  })

  return router
}

export = configureRoutes
