const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

//User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const ExerciseUser = mongoose.model("ExerciseUser", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  if (req.body.username === null || req.body.username === "") {
    res.send("Path `username` is required" + req.body.username);
  } else {
    ExerciseUser.findOne({ username: req.body.username }, function(
      err,
      userFound
    ) {
      if (err) {
        console.log("Error loading the database" + err);
        res.send("An error has occured.");
      }
      if (userFound !== null) {
        res.send("Username already taken");
      } else {
        var newUser = new ExerciseUser({
          username: req.body.username
        });
        newUser.save(function(err, userSaved) {
          if (err) {
            console.log("Error loading the database" + err);
            res.send("An error has occured.");
          } else {
            res.json({ username: userSaved.username, _id: userSaved._id });
          }
        });
      }
    });
  }
});

app.get("/api/exercise/users", (req, res) => {
  ExerciseUser.find({}, function(err, usersFound) {
    if (err) {
      console.log("Error loading the database" + err);
      res.send("An error has occured.");
    }
    if (usersFound !== null) {
      res.send(usersFound);
    }
  });
});

app.post("/api/exercise/add", (req, res) => {
  if (req.body.userId === null || req.body.userId === "") {
    res.send("UserId is a required field");
  } else if (req.body.description === null || req.body.description === "") {
    res.send("Description is a required field");
  } else if (req.body.duration === null || req.body.duration === "") {
    res.send("Duration is a required field");
  } else {
    if (req.body.date === null || req.body.date === "") {
      var newExercise = new Exercise({
        userId: req.body.userId,
        description: req.body.description,
        duration: req.body.duration,
        date: new Date()
      });
    } else {
      var newExercise = new Exercise({
        userId: req.body.userId,
        description: req.body.description,
        duration: req.body.duration,
        date: new Date(req.body.date)
      });
    }
    newExercise.save(function(err, exerciseSaved) {
      if (err) {
        console.log("Failed to create exercise object: " + err);
        res.send("Error creating exercise");
      } else {
        ExerciseUser.findOne({ _id: exerciseSaved.userId }, function(
          err,
          userFound
        ) {
          if (err) {
            console.log("Error finding user: " + err);
            res.send("Error creating exercise");
          } else {
            res.json({ username: userFound.username, _id: userFound._id });
          }
        });
      }
    });
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
