const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function emailLookup(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return false;
    }
  }
  return true;
}


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  console.log(urlDatabase["b2xVn2"]);
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let id = null;
  if (typeof req.cookies !== 'undefined') {
    id = req.cookies["user_id"];
  }
  const templateVars = { urls: urlDatabase, user_id: id };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let id = null;
  console.log("req.cookies1: ", req.cookies, "\n");
  if (req.cookies === null) {
    id = req.cookies["user_id"];
    console.log('true');
  } else {
    res.redirect("./");
    console.log('false');
  }
  res.render("urls_new", { user_id: id });
});

app.get("/urls/:shortURL", (req, res) => {
  let id = null;
  if (typeof req.cookies !== 'undefined') {
    id = req.cookies["user_id"];
  }
  let a = req.params.shortURL;
  console.log(a, ' :', urlDatabase[a]);
  const templateVars = { shortURL: a, longURL: urlDatabase[a], user_id: id };
  res.render("urls_show", templateVars);
});

function generateRandomString() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
}

app.post("/urls", (req, res) => {
  let id = null;
  if (typeof req.cookies !== 'undefined') {
    id = req.cookies["user_id"];
  }
  shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL], user_id: id };
  res.render("urls_show", templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  delete urlDatabase[shortURL];
  urlDatabase[req.body.url] = longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`)
});

app.post("/login", (req, res) => {
  loginEmail = req.body.email;
  loginPassword = req.body.password;
  for (let user in users) {
    if (users[user].email === loginEmail) {
      if (users[user].password === loginPassword) {
        res.cookie('user_id', users[user].id);
        res.redirect("/urls");
      }
    }
  }
  res.status(403).end();

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  const requestID = generateRandomString();
  const requestEmail = req.body.email;
  const requestPassword = req.body.password;
  if (emailLookup(requestEmail)) {
    users[requestID] = { id: requestID, email: requestEmail, password: requestPassword };
    res.cookie('user_id', requestID);
    console.log(users);
    res.redirect("/urls");
  } else res.status(400).end();
});

app.get("/login", (req, res) => {
  res.render("partials/login");
});