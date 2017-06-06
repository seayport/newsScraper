/* Scraping into DB (18.2.5)
 * ========================== */

// Dependencies
var express = require("express");
var bodyParser = require("body-parser")
var exphbs = require("express-handlebars")
var mongoose = require("mongoose")
var methodOverride = require("method-override")
var path = require("path");
// Requiring our models
var note = require("./models/note.js");
var article = require("./models/article.js");
// Require request and cheerio. This makes the scraping possible

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
 





































    