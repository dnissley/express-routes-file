import { writeFileSync, existsSync, unlinkSync } from 'fs'
import express from 'express'
import request from 'supertest'
import configureRoutes from '../src/configureRoutes'

const routesFilePath = './routes'

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

  it('should set up a basic route', async () => {
    writeRoutesFile(`
      GET    /test    testHandler
    `)

    const testResponseBody = 'this is fine'
    const testHandler = jest.fn((req, res) => res.status(200).send(testResponseBody))
    const app = express()
    const routes = configureRoutes({ testHandler })
    app.use('/', routes)

    const response = await request(app).get('/test')

    expect(response.status).toBe(200)
    expect(response.text).toBe(testResponseBody)
    expect(testHandler).toHaveBeenCalledTimes(1)
  })

  it('should ignore comments and empty lines', async () => {
    writeRoutesFile(`
      # this is a comment above a blank line

      GET    /test    testHandler     # another comment

      # GET /test thisIsCommentedOutSoWontWork
    `)

    const testResponseBody = 'this is fine'
    const testHandler = jest.fn((req, res) => res.status(200).send(testResponseBody))
    const app = express()
    const routes = configureRoutes({ testHandler })
    app.use('/', routes)

    const response = await request(app).get('/test')

    expect(response.status).toBe(200)
    expect(response.text).toBe(testResponseBody)
    expect(testHandler).toHaveBeenCalledTimes(1)
  })
})
