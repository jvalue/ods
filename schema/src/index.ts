import express from 'express'
var app = express()

// define a route handler for the default home page
app.get('/schema/', (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify({ a: 1 }))
})

app.listen(8520, () => {
  console.log('Server running on port 8520')
})
