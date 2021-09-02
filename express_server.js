const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "aba"
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
  if (req.cookies['user_id'] !== undefined) {
    id = req.cookies["user_id"];
    let updatedUrlDatabase = urlsForUser(id);
    const templateVars = { urls: updatedUrlDatabase, user_id: id };
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("not logged in");
  }


});

app.get("/urls/new", (req, res) => {
  if (req.cookies['user_id'] === undefined) {
    res.redirect('../urls');
  } else {
    let id = req.cookies['user_id'];
    res.render("urls_new", { user_id: id });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let id = null;
  if (req.cookies['user_id'] !== undefined) {
    id = req.cookies["user_id"];

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
  if (req.cookies['user_id'] !== undefined) {
    id = req.cookies["user_id"];
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
  let currentID = req.cookies['user_id'];
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
  const updatedUrlDatabase = urlsForUser(req.cookies['user_id']);

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
    urlDatabase[req.body.url] = { longURL: longURL, userID: req.cookies['user_id'] };
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