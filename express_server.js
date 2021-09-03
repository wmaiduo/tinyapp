const express = require("express");
let cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const { getUserByEmail, emailLookup, urlsForUser, userIsLoggedIn, generateRandomString } = require('./helper');

app.set("view engine", "ejs");

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


const password1 = "aba";
const hashedPassword1 = bcrypt.hashSync(password1, 10);
const password2 = "dishwasher-funk";
const hashedPassword2 = bcrypt.hashSync(password2, 10);

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: hashedPassword1
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: hashedPassword2
  }
};


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['userID']
}));


app.get("/", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let id = null;

  if (userIsLoggedIn(req.session.userID)) {
    id = req.session.userID;
    const email = users[id].email;
    let updatedUrlDatabase = urlsForUser(id, urlDatabase);
    const templateVars = { urls: updatedUrlDatabase, userID: id, userEmail: email };
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("not logged in");
  }
});

app.get("/urls/new", (req, res) => {
  if (!userIsLoggedIn(req.session.userID)) {
    res.redirect('../urls');
  } else {
    let id = req.session.userID;
    const email = users[id].email;
    res.render("urls_new", { userID: id, userEmail: email });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let id = null;
  if (userIsLoggedIn(req.session.userID)) {
    id = req.session.userID;
    let a = req.params.shortURL;
    let updatedUrlDatabase = urlsForUser(id, urlDatabase);

    let containingThisShortURL = false;
    for (let url in updatedUrlDatabase) {
      if (a === url) {
        containingThisShortURL = true;
      }
    }

    if (containingThisShortURL) {
      const templateVars = { shortURL: a, longURL: urlDatabase[a].longURL, userID: id, userEmail: users[id].email };
      res.render("urls_show", templateVars);
    } else {
      res.status(400).send("this website does not belong to you");
    }
  } else {
    res.status(400).send("not logged in");
  }

});

app.post("/urls", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    const id = req.session.userID;

    const shortURL = generateRandomString();

    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
    const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, userID: id, userEmail: users[id].email };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send('not logged in');
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    let currentID = req.session.userID;
    let updatedUrlDatabase = urlsForUser(currentID, urlDatabase);
    const shortURL = req.params.shortURL;

    let status400 = true;
    for (let url in updatedUrlDatabase) {
      if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
        delete urlDatabase[shortURL];
        status400 = false;
        res.redirect('/urls');
      }
    }

    if (status400) {
      res.status(400).send("trying to modify someone else's file");
    }
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedUrlDatabase = urlsForUser(req.session.userID, urlDatabase);

  let error400 = true;
  let loggedIn = true;
  if (req.session.userID === undefined) {
    loggedIn = false;
  }

  for (let url in updatedUrlDatabase) {
    if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
      error400 = false;
    }
  }
  if (urlDatabase[shortURL].userID === undefined) {
    error400 = false;
  }

  if (!error400) {
    const longURL = urlDatabase[shortURL].longURL;
    delete urlDatabase[shortURL];
    urlDatabase[req.body.url] = { longURL: longURL, userID: req.session.userID };
    res.redirect("/urls");
  } else {
    if (loggedIn) {
      res.status(400).send("accessing someone else's website");
    } else {
      res.status(400).send('not logged in');
    }
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  for (let user in users) {
    if (users[user].email === loginEmail) {
      if (bcrypt.compareSync(loginPassword, users[user].hashedPassword)) {
        req.session.userID = users[user].id;
        res.redirect("/urls");
      }
    }
  }
  res.status(403).end();

});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    res.redirect('/urls');
  } else {
    res.render("urls_register");
  }
});

app.post("/register", (req, res) => {
  const requestID = generateRandomString();
  const requestEmail = req.body.email;
  const requestPassword = req.body.password;
  if (requestEmail === '' || requestPassword === '') {
    res.status(400).send("email or password is empty");
  } else if (emailLookup(requestEmail, users)) {
    users[requestID] = { id: requestID, email: requestEmail, password: requestPassword };
    req.session.userID = requestID;
    res.redirect("/urls");
  } else res.status(400).send("email already exists");
});

app.get("/login", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    res.redirect('/urls');
  } else {
    res.render("partials/login");
  }
});