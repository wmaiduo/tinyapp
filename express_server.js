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
  let name = null;
  if (typeof req.cookies !== 'undefined') {
    name = req.cookies["username"];
  }
  const templateVars = { urls: urlDatabase, username: name };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let name = null;
  if (typeof req.cookies !== 'undefined') {
    name = req.cookies["username"];
  }
  res.render("urls_new", { username: name });
});

app.get("/urls/:shortURL", (req, res) => {
  let name = null;
  if (typeof req.cookies !== 'undefined') {
    name = req.cookies["username"];
  }
  let a = req.params.shortURL;
  console.log(a, ' :', urlDatabase[a]);
  const templateVars = { shortURL: a, longURL: urlDatabase[a], username: name };
  res.render("urls_show", templateVars);
});

function generateRandomString() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
}

app.post("/urls", (req, res) => {
  let name = null;
  if (typeof req.cookies !== 'undefined') {
    name = req.cookies["username"];
  }
  shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL], username: name };
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
  username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});