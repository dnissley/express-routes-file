# express-routes-file

Ever worked with rails, play framework, or some other web framework that used a 'routes' file to do the simple work of hooking up urls to code? Dislike the overly flexible nature of express routing and wish you had something like a routes file instead? This library is for you.

## Usage

1. To install run this command: `npm install express-routes-file`

2. Create a file named `routes` in the root directory of your project:

    ```javascript
    GET     /                 someFunction      # first: http method, second: url
    POST    /with-param/:id   anotherFunction   # feel free to add comments and blank lines too
    ```

3. Set up your app like this:

    ```javascript
    const express = require('express')
    const configureRoutes = require('express-routes-file')

    const app = express()

    // configureRoutes() returns an express.Router
    const routes = configureRoutes({
      someFunction: (req, res) => res.send('hello from someFunction()'),
      anotherFunction: (req, res) => res.send('hi from anotherFunction()')
    })

    app.use('/', routes)

    app.listen(3000, () => console.log('listening on port 3000'))
    ```
