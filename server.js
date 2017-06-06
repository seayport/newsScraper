/* Scraping into DB (18.2.5)
 * ========================== */

// Dependencies
var express = require("express");
// Set mongoose to leverage built in JavaScript ES6 Promises
var PORT = process.env.PORT || 8080;

// Initialize Express
var app = express();

// Setting up the Express app to handle data parsing


app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
 





































    