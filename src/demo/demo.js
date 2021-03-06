import initServer from '../init-server'
const port = process.env.DEMO_PORT === undefined ? 8080 : process.env.DEMO_PORT
const usesAuthentication = process.env.DEMO_AUTHENTICATION === undefined ? false : 1 === parseInt(process.env.DEMO_AUTHENTICATION, 10)

let authenticationStrategies

if (usesAuthentication) {
  authenticationStrategies = [
    {
      name: 'simple',
      validate: function (request, username, password, callback) {
        const isValid = username === 'hello' && password === 'world'

        return callback(null, isValid, { id: 42 })
      }
    }
  ]
} else {
  authenticationStrategies = []
}

const config = {
  api: {
    name: 'Demo server',
    version: '1',
    hasDocumentation: true,
    routes: [
      {
        method: 'GET',
        path:'/hello-world',
        handler: (request, reply) => {
          reply({
            hello: 'world'
          })
        },
        config: {
          description: 'Hello world'
        }
      },
      {
        method: 'GET',
        path:'/hello-world-promise',
        handler: (request, reply) => {
          reply(new Promise((resolve) => {
            return resolve({
              hello: 'world'
            })
          }))
        },
        config: {
          description: 'Hello world using promise'
        }
      },
      {
        method: 'GET',
        path:'/internal-server-error',
        handler: function () {
          throw new Error('err')
        },
        config: {
          description: 'Internal server error'
        }
      },
      {
        method: 'GET',
        path:'/internal-server-error-not-obj',
        handler: function () {
          throw 'err'
        },
        config: {
          description: 'Internal server error with non object'
        }
      },
      {
        method: 'GET',
        path:'/promise-unhandled-rejection',
        handler: function (request, reply) {
          reply(new Promise(() => {
            throw new Error('err')
          }))
        },
        config: {
          description: 'Promise with unhandled rejection'
        }
      },
      {
        method: 'GET',
        path:'/promise-unhandled-rejection-not-obj',
        handler: function (request, reply) {
          reply(new Promise(() => {
            throw 'err'
          }))
        },
        config: {
          description: 'Promise with unhandled rejection with non object'
        }
      },
      {
        method: 'GET',
        path:'/timeout',
        handler: function () {
          //Do nothing and wait for timeout
        },
        config: {
          timeout: {
            server: 200
          },
          description: 'Timeout'
        }
      }
    ],
    usesAuthentication,
    authenticationStrategies
  },
  server: {
    connections: [
      {
        port: port
      }
    ]
  }
}

if (usesAuthentication) {
  config.api.routes.push({
    method: 'GET',
    path:'/hello-world-protected',
    handler: (request, reply) => {
      reply({
        hello: 'world'
      })
    },
    config: {
      auth: 'simple',
      description: 'Hello world with authentication'
    }
  })
}

const exposedRoutes = [];

config.api.routes.forEach((route) => {
  exposedRoutes.push({
    path: 'http://localhost:8080' + route.path,
    description: route.config.description
  })
})

config.api.routes.push({
  method: 'GET',
  path:'/',
  handler: (request, reply) => {
    reply(exposedRoutes)
  },
  config: {
    description: 'Exposed routes'
  }
})

initServer(config).then((server) => {
  server.start(() => {
    console.log(`Server started, listening on port ${port} ${usesAuthentication ? 'with authentication': ''}`)
  })
})
