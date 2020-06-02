const { EOL } = require('os')
const fs = require('fs')
const express = require('express')

const validHttpMethods = new Set(['GET', 'POST', 'PUT', 'DELETE'])

const wrapAsync = (fn) => {
  return (req, res, next) => {
    const result = fn(req, res, next);

    if (result.then) {
      return Promise.resolve(result).catch(next);
    } else {
      return result;
    }
  }
}

module.exports = (routeHandlers) => {
  const router = express.Router()
  const data = fs.readFileSync('./routes', 'utf8')
  const lines = data.split(EOL)
  routes = lines.forEach((line, i) => {
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
      throw new Error(`line ${i+1} could not be parsed into a route: "${line}"`)
    }
    const [httpMethod, routePath, routeHandler] = components
    if (!validHttpMethods.has(httpMethod)) {
      throw new Error(`line ${i+1} specifies an invalid http method: ${httpMethod}`)
    }

    // 3 - turn the components into an express route
    router[httpMethod.toLowerCase()](routePath, wrapAsync(routeHandlers[routeHandler]))
  })

  return router
}

