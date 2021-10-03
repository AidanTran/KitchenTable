const express = require("express");
const mongoose = require("mongoose");
const sessions = require("express-session");
const methodOverride = require("method-override");
const MemoryStore = require("memorystore")(sessions);
const app = express();

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

//databaseurl
const url = "removed for privacy";

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("Mongo DB Connected"))
  .catch((err) => console.log(err));

//sessions
app.use(
  sessions({
    secret: "akljermnabsnmbkjchlkjh",
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

//Import Post Model
const Post = require("./models/Post");
const User = require("./models/User");

var session;

app.get("/", (req, res) => {
  session = req.session;
  console.log(session.userId);
  res.render("Home", { userId: session.userId });
});

app.get("/posts", (req, res) => {
  session = req.session;
  console.log(session.userId);
  const tenSecondsAgo = new Date().getTime() - 1000 * 60 * 60 * 24;
  console.log(tenSecondsAgo);
  Post.deleteMany({ date: { $lt: tenSecondsAgo } }).catch((err) =>
    console.log()
  );

  Post.find()
    .then((data) => {
      res.render("Posts", { data: data, userId: session.userId });
    })
    .catch((err) => console.log());
});

app.get("/myposts", (req, res) => {
  session = req.session;
  console.log(session.userId);

  Post.find({
    user_id: session.userName,
  })
    .then((data) => {
      res.render("MyPosts", { data: data, userId: session.userId });
    })
    .catch((err) => console.log());
});

app.get("/add", (req, res) => {
  session = req.session;
  console.log(session.userId);
  res.render("Add", { userId: session.userId });
});

app.post("/add-post", (req, res) => {
  session = req.session;
  const timeOfPost = new Date().getTime();
  const Data = new Post({
    meal_name: req.body.meal_name,
    calories: req.body.calories,
    protein: req.body.protein,
    carbohydrates: req.body.carbohydrates,
    fat: req.body.fat,
    user_id: session.userName,
    date: timeOfPost,
  });

  Data.save()
    .then(() => {
      res.redirect("/posts");
    })
    .catch((err) => console.log(err));
});

app.post("/register", (req, res) => {
  const Data = new User({
    username: req.body.user_id,
    password: req.body.password,
  });
  User.findOne({ username: req.body.user_id })
    .then((data) => {
      if (data) {
        res.redirect("/Failed");
        return;
      } else {
        Data.save()
          .then(() => {
            if (Data.password === req.body.password) {
              session = req.session;
              session.userId = Data._id;
              session.userName = Data.username;
              console.log(req.session);
              res.redirect("/posts");
            } else {
              res.redirect("/Failed");
            }
          })
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
});

app.post("/signin-check", (req, res) => {
  User.findOne({ username: req.body.user_id })
    .then((data) => {
      if (data) {
        if (data.password === req.body.password) {
          session = req.session;
          session.userId = data._id;
          session.userName = data.username;
          console.log(req.session);
          res.redirect("/posts");
        } else {
          res.redirect("/Failed");
          // res.send("Sign in failed!");
        }
      } else {
        res.redirect("/Failed");
        // res.send("Sign in failed!");
      }
    })
    .catch((err) => console.log(err));
});

app.get("/signup", (req, res) => {
  res.render("Signup");
});

app.get("/signin", (req, res) => {
  res.render("Signin");
});

app.get("/Failed", (req, res) => {
  res.render("Failed", { err: "Something went wrong!" });
});

app.delete("/delete/:id", (req, res) => {
  Post.remove({
    _id: req.params.id,
  })
    .then(() => {
      res.redirect("/MyPosts");
    })
    .catch((err) => console.log(err));
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(port, () => console.log("server is running"));
