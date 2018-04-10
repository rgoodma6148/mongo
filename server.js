var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;
var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/mongoPractice';

var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {});

app.get("/scrape", function(req, res) {
  axios.get("https://www.theonion.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("article").each(function(i, element) {
      var result = {};

      result.title = $(this).find("header h1.headline a").text();
      result.link = $(this).find("header h1.headline a").attr('href');
      result.summary = $(this).find("div.item__content div.excerpt p").text();

      db.Article.create(result).then(function(dbArticle) {
        console.log(dbArticle);
      }).catch(function(err) {
        res.json(err);
      });
    });
    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({}).then(function(dbArticle) {
    res.json(dbArticle);
  }).catch(function(err) {
    res.json(err);
  });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({_id: req.params.id}).populate("note").then(function(dbArticle) {
    res.json(dbArticle);
  }).catch(function(err) {
    res.json(err);
  });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body).then(function(dbNote) {
    return db.Article.findOneAndUpdate({
      _id: req.params.id
    }, {
      note: dbNote._id
    }, {new: true});
  }).then(function(dbArticle) {
    res.json(dbArticle);
  }).catch(function(err) {
    res.json(err);
  });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
