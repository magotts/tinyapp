const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
app.use(bodyParser.urlencoded({ extended: true }));
const cookieSession = require("cookie-session");
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');


app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const users = {
  "user1RandomID": {
    id: "user1RandomID",
    email: "a@a.com",
    password: bcrypt.hashSync("aaa", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "b@b.com",
    password: bcrypt.hashSync("bbb", 10)
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user1RandomID",
    dateCreated: "2021/08/29"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user1RandomID",
    dateCreated: "2021/09/01"
  },
  ABCDE1: {
    longURL: "https://www.ebgames.ca",
    userID: "user2RandomID",
    dateCreated: "2021/08/27"
  },
  EFG23A: {
    longURL: "https://www.reddit.ca",
    userID: "user2RandomID",
    dateCreated: "2021/09/02"
  }
};

// REDIRECT TO LOGIN IF NOT LOGGED IN
// REDIRECT TO URLS_INDEX IF LOGGED IN
app.get("/", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    return res.redirect("/login");
  }
  const user = users[userID];
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// MAIN PAGE - GET
// DISPLAY USER'S OWN URL CREATION WHEN LOGGED IN AS THEM
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

// SHORTURL - GET
// ERROR WHEN USER TRIES TO ACCESS SOMEONE ELSE'S SHORTURL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];

  if (userID !== url.userID) {
    return res.status(401).send("ERROR: You are trying to access someone else's URL.");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };

  res.render("urls_show", templateVars);
});

// CREATE NEW URL - GET
app.get("/urls/new", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  const templateVars = { user };
  res.render('urls_new', templateVars);
});

// CREATE NEW URL - POST
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = users[req.session["user_id"]].id;
  let dateCreated = new Date().toJSON().slice(0,10).replace(/-/g,'/');
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].userID = userID;
  urlDatabase[shortURL].dateCreated = dateCreated;
  res.redirect(`/urls/${shortURL}`);
});

// BY CLICKING THE SHORT URL, IT WILL GO TO THE LONG URL - GET
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// DELETE URL - POST
// USER CAN ONLY DELETE THEIR OWN URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = users[req.session["user_id"]];

  if (!user || urlDatabase[shortURL].userID !== user.id) {
    return res.status(403).send("ERROR: You are restricted to delete other people's URL.");
  }
   
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

// EDIT URL - POST
// USER CAN ONLY EDIT THEIR OWN URL
app.post("/urls/:shortURL", (req, res) => { /// edit the url
  const shortURL = req.params.shortURL;
  const userID = req.session["user_id"];
  if (!userID) {
    return res.redirect("/login");
  }
  const url = urlDatabase[shortURL];
  if (!url) {
    return res.status(403).send("Invalid URL");
  }
  if (userID !== url.userID) {
    return res.status(403).send("ERROR: You are restricted to edit other people's URL.");
  }

  let editedURL = req.body.edited;
  urlDatabase[shortURL].longURL = editedURL;
  res.redirect("/urls");
});

// LOGIN - GET
app.get("/login", (req, res) => {
  res.render("login");
});

// LOGIN - POST
app.post("/login", (req, res) => { /// cookie username
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("Email address is not found.");
  } else if (!bcrypt.compareSync(password, users[user.id]["password"])) {
    return res.status(403).send("Wrong credentials.");
  }
 
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

// LOGOUT - POST
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// REGISTER - GET
app.get("/register", (req, res) => {
  res.render("register");
});

// REGISTER - POST
app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  req.session["user_id"] = user_id;
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: user_id,
    email,
    password: hashedPassword
  };

  if (email === "" || password === "") {
    return res.status(400).send("ERROR: Email/Password field cannot be empty.");
  }
  
  for (let userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("ERROR: Email address already exists. Please try again.");
    }
  }
 
  users[user_id] = newUser;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
