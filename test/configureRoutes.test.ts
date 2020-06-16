import { writeFileSync, existsSync, unlinkSync } from 'fs'
import express, { Handler } from 'express'
import request from 'supertest'
import configureRoutes from '../src/configureRoutes'

const routesFilePath = './routes'
const testResponseBody = 'this is fine'
const testResponseHandler: Handler = (req, res) => res.status(200).send(testResponseBody)

const writeRoutesFile = (contents: string) => {
  writeFileSync(routesFilePath, contents)
}

const clearRoutesFile = () => {
  if (existsSync(routesFilePath)) {
    unlinkSync(routesFilePath)
  }
}

describe('configureRoutes()', () => {
  afterEach(() => {
    clearRoutesFile()
  })

  it('should set up routes', async () => {
    writeRoutesFile(`
      GET      /testGet      getHandler
      POST     /testPost     postHandler
      PUT      /testPut      putHandler
      DELETE   /testDelete   deleteHandler
    `)

    const app = express()
    const handlers: { [key: string]: Handler } = {
      getHandler: jest.fn(testResponseHandler),
      postHandler: jest.fn(testResponseHandler),
      putHandler: jest.fn(testResponseHandler),
      deleteHandler: jest.fn(testResponseHandler)
    }
    const routes = configureRoutes(handlers)
    app.use('/', routes)

    const responses = [
      await request(app).get('/testGet'),
      await request(app).post('/testPost'),
      await request(app).put('/testPut'),
      await request(app).delete('/testDelete')
    ]

    for (const response of responses) {
      expect(response.status).toBe(200)
      expect(response.text).toBe(testResponseBody)
    }

    for (const handler in handlers) {
      expect(handlers[handler]).toHaveBeenCalledTimes(1)
    }
  })

  it('should ignore comments and empty lines', async () => {
    writeRoutesFile(`
      # this is a comment above a blank line

      GET    /test    testHandler     # another comment

      # GET /test thisIsCommentedOutSoWontWork
    `)

    const testHandler = jest.fn(testResponseHandler)
    const app = express()
    const routes = configureRoutes({ testHandler })
    app.use('/', routes)

    const response = await request(app).get('/test')

    expect(response.status).toBe(200)
    expect(response.text).toBe(testResponseBody)
    expect(testHandler).toHaveBeenCalledTimes(1)
  })

  it('should throw an error for routes with too many args', () => {
    writeRoutesFile(`
      GET    /test    testHandler    thisShouldCauseAnError
    `)

    const testHandler = jest.fn(testResponseHandler)
    expect(() => configureRoutes({ testHandler })).toThrow()
  })

  it('should throw an error for routes with too few args', () => {
    writeRoutesFile(`
      GET    /test
    `)

    const testHandler = jest.fn(testResponseHandler)
    expect(() => configureRoutes({ testHandler })).toThrow()
  })

  it('should throw an error for routes with an invalid http method', () => {
    writeRoutesFile(`
      WRONG    /test    testHandler
    `)

    const testHandler = jest.fn(testResponseHandler)
    expect(() => configureRoutes({ testHandler })).toThrow()
  })

  it.todo('should not mess with the flow of exceptions getting passed to next')

  it.todo('should wrap promise rejections and pass them to next')
})
