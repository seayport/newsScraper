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
var Note = require("./models/note.js");
var Article = require("./models/article.js");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Setting up the Express app to handle data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// Serving static content for the app from the "public" directory in the app directory
app.use(express.static(process.cwd() + "/public"));

// Overriding with POST having ?_method=DELETE
app.use(methodOverride("_method"));

// Setting up the Database configuration with mongoose
mongoose.connect("mongodb://localhost/articlesDB");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// SETTING UP HANDLEBARS
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");


// Routes*********************/ 
app.get("/", function(req, res) {
   res.render("index");
});

// Scrape data from NYTimes 
app.get("/scrape", function(req, res) {
  // Make a request for the news section of NYT
  request("http://nytimes.com/", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
 // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
          if (error) {
            // Log the error
            console.log(error);
          }
          // Otherwise,
          else {
            // Log the saved doc
            console.log(doc);
          }
        });
      
    });
  });

  // Done scraping show articles list
  res.redirect("/articles");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // if no errors render our page with articles we scraped 
    else {
      res.render("scrape", {
        allArticles: doc 
      });
    }    
  });
});
//Grab an article by it's ObjectID and load the notes
app.get("/articles/:id", function(req, res) {
  // Use id passed in id param and quert finds matching one
  Article.findOne({ "_id": req.params.id })
  // populate associated notes
    .populate("note")
    //execute the query
    .exec(function(err, doc) {
      console.log(doc)
      // Log any errors
      if (err) {
        console.log(err);
      }
      else {
        // no errors render page
        res.render("comments", {
          articles: doc
        });      
      }
    });
    
});

app.post("/articles/:id", function(req, res) {
   // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);
  var currentArticleID = req.params.id;
  //And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
        // Execute the above query
        .exec(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          } else {
            // Or send the document to the browser
            res.redirect("/articles/" + currentArticleID)
          } 
       });
    }
  });
});
//saving an article
app.post("/save/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
    // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
          console.log(err);
      } else {
        // Or send the user back to the all articles page once it saved
        res.redirect("/saved");
      }
    });
})

//deleting the article from the saved list
app.put("/delete/:id", function(req, res) {
  // Delete an article based on it's ObjectId
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false })
  // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
        console.log(err);
      }
      else {
       res.redirect("/saved");
     }
   });
})

// show saved articles
app.get("/saved", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.find({ "saved": true }, function(error, doc) {
   if (error) {
      console.log(error);
    }  else {
      res.render("savedArticles", {
        allArticles: doc
      });
    }
  });
});

// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
