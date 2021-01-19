import express from 'express'
var app = express()

// define a route handler for the default home page
app.get('/', (req, res) => {
  res.send('Hello world!')
})

app.listen(8520, () => {
  console.log('Server running on port 8520')
})
