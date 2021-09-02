const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(cookieParser());

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "a@a.com",
    password: "aaa"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const getUserByEmail = (email, users) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  console.log(req.cookies["user_id"]);
  const templateVars = { urls: urlDatabase,
    username: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    username: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => { // creating new url
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = users[req.cookies["user_id"]].id;
  urlDatabase[shortURL] = {}; // set object first
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].userID = userID;
// if (urlDatabase[shortURL].userID === userID) {
//   // show the longurl from this userID
//} 
console.log("userID is:", userID);


  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => { /// edit the url
  const shortURL = req.params.shortURL;
  let editedURL = req.body.edited;
  urlDatabase[shortURL].longURL = editedURL;
  res.redirect("/urls/");
});

app.post("/login", (req, res) => { /// cookie username
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("Email address is not found.");
  }
  if (user.password !== password) {
    return res.status(403).send("Wrong credentials.");
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});


app.post("/logout", (req, res) => { //logout
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register");
});


app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  res.cookie("user_id", user_id);
  let email = req.body.email;
  let password = req.body.password;

  const newUser = {
    id: user_id,
    email,
    password
  };

  if (email === "" || password === "") {
    return res.status(400).send("Email/Password field cannot be empty.");
  }
  
  for (let userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("Email address already exists. Please try again.");
    }
  }
  users[user_id] = newUser;
  console.log(users);
  res.redirect("/urls");
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

let generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};
