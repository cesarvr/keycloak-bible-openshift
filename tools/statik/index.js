var express = require('express')
var okd_runner = require('okd-runner')
var app = express()

app.use(express.static('public'))


console.log('listening in port 8080')
app.listen(8080)
