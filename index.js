const {
  openWeatherMapAPI,
  algoliaAPI,
  alogoliaAppID,
} = require("./config.json");

const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const fetch = require("node-fetch");
const { get } = require("http");
const ejs = require("ejs");
const moment = require("moment"); // require
const base = "https://api.openweathermap.org/data/2.5/";
const { lookup } = require("geoip-lite");

let weather = "";
let location = "";
let temp = "";
let desc = "";
let humidity = "";
let icon = "http://openweathermap.org/img/wn/02d@2x.png";
let date = moment().format("MMMM Do, YYYY");
let minTemp = "";
let maxTemp = "";
let ip = "";

const mongoose = require("mongoose");

const connectionString =
  "mongodb+srv://1234:DxZJ0OFiLFOTi3ey@cluster0.wlaov.mongodb.net/<dbname>?retryWrites=true&w=majority";
mongoose.connect(connectionString, { useNewUrlParser: true });

const loginSchema = {
  username: String, // String is shorthand for {type: String}
  password: String,
};

const Login = mongoose.model("logins", loginSchema);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;

  const newLogin = new Login({ username: user, password: pass });
  newLogin.save();

  res.redirect("/signin");
});

app.get("/signin", function (req, res) {
  res.render("signin");
});

app.post("/auth", (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;

  Login.findOne({username: user}, function(err, user){
    console.log(user);
    if(!(user === null))
    {
      if(user.password === pass){
        res.redirect("/location")
      }
      else {
        res.send("Wrong password");
      }
    }
    else {
      res.send("user not found");
    }
  })
    
});

app.get("/location", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  console.log(ip);
  console.log(lookup(ip));
  let query = 'Lahore';
  fetch(`${base}weather?q=${query}&units=metric&APPID=${openWeatherMapAPI}`)
    .then((weather) => {
      return weather.json();
    })
    .then(displayResults);

  function displayResults(response) {
    weather = response;
    location = `${weather.name}` + ", " + `${weather.sys.country}`;
    temp = Math.round(response.main.temp);
    desc = response.weather[0].description;
    humidity = response.main.humidity;
    icon = `http://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`;
    minTemp = Math.round(response.main.temp_min);
    maxTemp = Math.round(response.main.temp_max);

    res.render("home", {
      location: location,
      temp: temp,
      humidity: humidity,
      icon: icon,
      desc: desc,
      date: date,
      minTemp: minTemp,
      maxTemp: maxTemp,
    });
  }
});

app.get("/weather/:city", (req, res) => {
  res.render("weather", {
    location: location,
    temp: temp,
    humidity: humidity,
    icon: icon,
    desc: desc,
    date: date,
    minTemp: minTemp,
    maxTemp: maxTemp,
  });
});

app.post("/weather", (req, res) => {
  let query = req.body.placeName;

  function handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText).then(res.redirect("/location"));
    }
    return response;
  }

  fetch(`${base}weather?q=${query}&units=metric&APPID=${openWeatherMapAPI}`)
    .then(handleErrors)
    .then((weather) => {
      return weather.json();
    })
    .catch((error) => console.log(error))
    .then(displayResults);

  function displayResults(response) {
    weather = response;
    location = `${weather.name}` + ", " + `${weather.sys.country}`;
    temp = Math.round(response.main.temp);
    desc = response.weather[0].description;
    humidity = response.main.humidity;
    icon = `http://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`;
    minTemp = Math.round(response.main.temp_min);
    maxTemp = Math.round(response.main.temp_max);
    let link = "/weather/" + query;

    res.redirect(link);
  }
});

let port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
