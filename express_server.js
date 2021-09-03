const express = require("express");
const cookieParser = require("cookie-parser");
var cookieSession = require('cookie-session')
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

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
}

function emailLookup(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return false;
    }
  }
  return true;
}

const getUserByEmail = function (email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    } else {
      return false
    }
  }
}


function urlsForUser(id) {
  let updatedUrlDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      updatedUrlDatabase[url] = { longURL: urlDatabase[url].longURL, userID: id };
    }
  };
  return updatedUrlDatabase;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}))


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
  if (req.session.user_id !== undefined) {
    id = req.session.user_id;
    let updatedUrlDatabase = urlsForUser(id);
    const templateVars = { urls: updatedUrlDatabase, user_id: id };
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("not logged in");
  }


});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('../urls');
  } else {
    let id = req.session.user_id;
    res.render("urls_new", { user_id: id });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let id = null;
  if (req.session.user_id !== undefined) {
    id = req.session.user_id;

    let a = req.params.shortURL;
    let updatedUrlDatabase = urlsForUser(id);

    let containingThisShortURL = false;
    for (let url in updatedUrlDatabase) {
      if (a === url) {
        containingThisShortURL = true;
      }
    }

    if (containingThisShortURL) {
      const templateVars = { shortURL: a, longURL: urlDatabase[a].longURL, user_id: id };
      res.render("urls_show", templateVars);
    } else {
      res.status(400).send("this website does not belong to you");
    }
  } else {
    res.status(400).send("not logged in");
  }

});

function generateRandomString() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
}

app.post("/urls", (req, res) => {
  let id = null;
  if (req.session.user_id !== undefined) {
    id = req.session.user_id;
  }
  shortURL = generateRandomString()

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, user_id: id };
  res.render("urls_show", templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let currentID = req.session.user_id;
  let updatedUrlDatabase = urlsForUser(currentID);
  const shortURL = req.params.shortURL;

  let status400 = true;
  for (let url in updatedUrlDatabase) {
    if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
      delete urlDatabase[shortURL];
      status400 = false;
      res.redirect('/urls')
    }
  }

  if (status400) {
    res.status(400).send("trying to modify someone else's file");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedUrlDatabase = urlsForUser(req.session.user_id);

  let error400 = true;

  for (let url in updatedUrlDatabase) {
    if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
      error400 = false;
    }
  }
  console.log(urlDatabase[shortURL]);
  if (urlDatabase[shortURL].userID === undefined) {
    error400 = false;
  }

  if (!error400) {
    const longURL = urlDatabase[shortURL].longURL;
    delete urlDatabase[shortURL];
    urlDatabase[req.body.url] = { longURL: longURL, userID: req.session.user_id };
    console.log("post urlDatabase: ", urlDatabase);
    res.redirect("/urls");
  } else {
    res.status(400).send("accessing someone else's website");
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`)
});

app.post("/login", (req, res) => {
  loginEmail = req.body.email;
  loginPassword = req.body.password;
  console.log("hashedPassword: ", users["userRandomID"].hashedPassword);
  console.log("hashed sync", bcrypt.hashSync(loginPassword, 10));
  for (let user in users) {
    console.log(users[user].hashedPassword);
    console.log(bcrypt.compareSync(loginPassword, users[user].hashedPassword));
    if (users[user].email === loginEmail) {
      if (bcrypt.compareSync(loginPassword, users[user].hashedPassword)) {
        req.session.user_id = users[user].id;
        console.log("accessed");
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
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  const requestID = generateRandomString();
  const requestEmail = req.body.email;
  const requestPassword = req.body.password;
  if (emailLookup(requestEmail)) {
    users[requestID] = { id: requestID, email: requestEmail, password: requestPassword };
    req.session.user_id = requestID;
    console.log(users);
    res.redirect("/urls");
  } else res.status(400).end();
});

app.get("/login", (req, res) => {
  res.render("partials/login");
});