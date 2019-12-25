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

const ExerciseUser = mongoose.model("ExerciseUser", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  if (req.body.username === "") {
    res.send("Path `username` is required");
  }
  ExerciseUser.findOne({ username: req.body.username }, function(
    err,
    userFound
  ) {
    if (err) {
      console.log("Error loading the database" + err);
      res.send("An error has occured.");
    }
    if (userFound !== null) {
      res.json({ username: userFound.username, _id: userFound._id });
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
