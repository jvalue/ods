import express from 'express'
var app = express()
app.use(express.json())

// define a route handler for the default home page
app.post('/suggestion/fast', (req: express.Request, res: express.Response) => {
  res.send(req.body)
})

// define a route handler for the default home page
app.post('/suggestion/detailed', (req: express.Request, res: express.Response) => {
  res.send(req.body)
})

app.get('/', (req: express.Request, res: express.Response) => {
  res.send(200)
})

app.listen(8080, () => {
  console.log('Server running on port 8520')
})
