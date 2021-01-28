import express from 'express'
var app = express()
app.use(express.json())

// define a route handler for the default home page
app.post('/fastGen', (req: express.Request, res: express.Response) => {
  console.log(req.body)
  res.send(req.body)
})

// define a route handler for the default home page
app.post('/detailedGen', (req: express.Request, res: express.Response) => {
  console.log(req.body)
  res.send(req.body)
})

app.get('/', (req: express.Request, res: express.Response) => {
  res.send(200)
})

app.listen(8520, () => {
  console.log('Server running on port 8520')
})
