var express = require('express')
var cors = require('cors')
var request = require('request')
const https = require("https");
const bodyParser = require('body-parser');
var path = require('path');
var app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

// get data from the API
app.get("/getMax", (req, res) => {
    const url = "http://lsatmaxadmin.us/interview/loadData.php";
    request(url, function (error, response, body) {
      res.send(body)
    });
});

app.listen(3300, function () {
    console.log('Example app listening on port 3300!')
})
  