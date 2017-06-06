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
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
var PORT = process.env.PORT || 443;

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

//-------------------Database configuration with Mongoose----------------------------------------------
//--------------------Define local MongoDB URI-----------------------
var databaseUri = "mongodb://localhost/articlesDB";
//------------------------------------------------------------------
if (process.env.MONGODB_URI) {
  //THIS EXECUTES IF THIS IS BEING EXECUTED IN YOUR HEROKU APP
mongoose.connect("mongodb://heroku_ssf18l2s:laj94u8p5ilcoqnnjii0pcs471@ds111922.mlab.com:11922/heroku_ssf18l2s")

} else {
  //THIS EXECUTES IF THIS IS BEING EXECUTED ON YOUR LOCAL MACHINE
mongoose.connect(databaseUri);
}
//-------------------End database configuration--------------------------

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
/*app.get("/", function(req, res) {
   res.render("index");
});*/

// Scrape data from NYTimes 
app.get("/scrape", function(req, res) {
  // Make a request for the news section of NYT
  request("https://www.nytimes.com/", function(error, response, html) {
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
  res.redirect("/");
});

// This will get the articles we scraped from the mongoDB
app.get("/", function(req, res) {
  // Grab every doc in the Articles array
  article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    //Or send the doc to the browser
    else {
        res.render("index", {
           article: doc
        });
      }
  });
});

app.put("/:id", function(req, res) {
  // Use the article id to find and update it's status to "saved"
  article.findOneAndUpdate({ "_id": req.params.id }, { "saved": req.body.saved })
  // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
        console.log(err);
      }
      else {
        // Or send the document to the browser
        console.log(doc);
      }
    });
    res.redirect("/");
});

app.get("/saved", function(req, res) {
  // Grab every doc in the Articles array that is saved
  article.find({ saved: true }, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }

    // Or send the doc to the browser
    else {
      var articleObj = {
        article: doc
      };
      res.render("saved", articleObj);
    }
  });
});


app.put("/delete/:id", function(req, res) {
  // Delete an article based on it's ObjectId
  article.findOneAndUpdate({ "_id": req.params.id }, { "saved": req.body.saved })
  // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
        console.log(err);
      }
      else {
        // Or send the document to the browser
        console.log(doc);
      }
    });
  res.redirect("/saved");
});

// Grab an article by it's ObjectId
app.get("/saved/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  article.findOne({ "_id": req.params.id })
  // Populating all of the notes associated with it
  .populate("note")
  // Executing the query
  .exec(function(error, doc) {
    // Logging any errors
    if (error) {
      console.log(error);
    }
    // Sending the doc to the browser as a JSON object
    else {
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
app.post("/submit", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);
  var currentArticleID = req.params.id;
  // And save the new note the db
  newNote.save(function(error, doc) {

    // Log any errors
    if (error) {
      res.send(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      article.findOneAndUpdate({}, { $push: { "notes": doc._id } }, { new: true}, function(error, newdoc)  {

       // send any errors to the browserLog any errors
        if (err) {
          res.send(err);
        }
        else {
          // Or send the newdoc to the browser
          res.send(newdoc);
        }
      });
    }
  });
});

app.get("/saved/:id", function(req, res) {
  // Grab every doc in the Articles array that is saved
  note.find({ saved: true }, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser
    else {
      var articleObj = {
        article: doc
      };
      res.render("saved", articleObj);
    }
  });
});
// Route to see notes we have added
app.get("/notes", function(req, res) {
  // Find all notes in the note collection with our Note model
  Note.find({}, function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Or send the doc to the browser
    else {
      res.send(doc);
    }
  });
});
// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
 





































    