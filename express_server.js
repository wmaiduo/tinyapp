const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const {
  emailLookup,
  urlsForUser,
  userIsLoggedIn,
  generateRandomString,
} = require("./helper");

app.set("view engine", "ejs");

const urlDatabase = {
};


//default user database
const users = {
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["userID"],
  })
);

app.get("/", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//render with database
app.get("/urls", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    const id = req.session.userID;
    const email = users[id].email;

    //urlsForUser specifies the URL from the database for this specific user
    const updatedUrlDatabase = urlsForUser(id, urlDatabase);
    const templateVars = {
      urls: updatedUrlDatabase,
      userID: id,
      userEmail: email,
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//get for creating new URL
app.get("/urls/new", (req, res) => {
  if (!userIsLoggedIn(req.session.userID)) {
    res.redirect("/login");
  } else {
    const id = req.session.userID;
    const email = users[id].email;
    res.render("urls_new", { userID: id, userEmail: email });
  }
});

//get information about the input URL
app.get("/urls/:id", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    const id = req.session.userID;
    const newShortURL = req.params.id;
    const updatedUrlDatabase = urlsForUser(id, urlDatabase);
    //check whether this URL already exists
    let containingThisShortURL = false;
    for (let url in updatedUrlDatabase) {
      if (newShortURL === url) {
        containingThisShortURL = true;
      }
    }
    if (containingThisShortURL) {
      const templateVars = {
        shortURL: newShortURL,
        longURL: urlDatabase[newShortURL].longURL,
        userID: id,
        userEmail: users[id].email,
      };
      res.render("urls_show", templateVars);
    } else {
      res
        .status(403)
        .send("this website does not exist or does not belong to you");
    }
  } else {
    res.status(401).send("not logged in");
  }
});

//redirect using shortURL id
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("website does not exist");
  } else {
    let websiteHeader = "";
    for (let i = 0; i <= 3; i++) {
      websiteHeader += urlDatabase[req.params.id].longURL[i];
    }

    //check whether the longURL has "http" in the front, if not then http is added to make sure the link works
    if (!urlDatabase[req.params.id].longURL.includes("www.")) {
      res.redirect("https://www." + urlDatabase[req.params.id].longURL);
    } else {
      res.redirect("https://" + urlDatabase[req.params.id].longURL);
    }
  }
});

//register
app.get("/register", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", { userID: false });
  }
});

//generate an URL
app.post("/urls", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    const id = req.session.userID;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
    const templateVars = {
      shortURL: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      userID: id,
      userEmail: users[id].email,
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("not logged in");
  }
});

app.get("/login", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    res.redirect("/urls");
  } else {
    res.render("partials/login", { userID: false });
  }
});

//delete the shortURL and its data
app.post("/urls/:id/delete", (req, res) => {
  if (userIsLoggedIn(req.session.userID)) {
    const currentID = req.session.userID;
    const updatedUrlDatabase = urlsForUser(currentID, urlDatabase);
    const shortURL = req.params.id;

    let status403;
    for (let url in updatedUrlDatabase) {
      if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
        //check whether the URL belongs to the current user
        delete urlDatabase[shortURL];
        status403 = false;
        res.redirect("/urls");
      }
    }
    //give an error if the URL does not belong to this user
    if (status403) {
      res.status(403).send("trying to modify someone else's file");
    }
  }
});

//change the short URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  //get URLdatabase for the current user
  const updatedUrlDatabase = urlsForUser(req.session.userID, urlDatabase);

  //check whether is logged in
  if (!req.session.userID) {
    return res.status(401).send("not logged in");
  }

  //check whether this URL belongs to the current user
  for (let url in updatedUrlDatabase) {
    if (updatedUrlDatabase[url].userID !== urlDatabase[shortURL].userID) {
      return res
        .status(403)
        .send("trying to update a resource that is not yours");
    }
  }

  //check whether this url exists
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("nonexistent url");
  }

  //update shortURL according to user input
  urlDatabase[shortURL] = {
    longURL: req.body.url,
    userID: req.session.userID,
  };
  res.redirect("/urls");
});

//post for edit the id
app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  res.redirect(`/urls/${shortURL}`);
});

//redirect to login if everthing is correct
app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;

  const user = Object.values(users).find((u) => {
    return u.email === loginEmail;
  });

  if (!user) {
    return res.status(404).send("no user with this email, please register");
  }

  if (!bcrypt.compareSync(loginPassword, user.hashedPassword)) {
    return res.status(403).send("wrong password");
  }

  //log in if the login email or password matches with user database
  req.session.userID = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  //delete cookies
  req.session = null;
  res.redirect("/login");
});

//post for register user
app.post("/register", (req, res) => {
  const requestID = generateRandomString(); //id is generated randomly
  const requestEmail = req.body.email;
  const requestPassword = req.body.password;
  if (requestEmail === "" || requestPassword === "") {
    //return error if user mail or password is empty
    res.status(400).send("email or password is empty");
  } else if (emailLookup(requestEmail, users)) {
    //if the user does not exist, register
    users[requestID] = {
      id: requestID,
      email: requestEmail,
      hashedPassword: bcrypt.hashSync(requestPassword, 10),
    };
    req.session.userID = requestID;
    res.redirect("/urls");
  } else res.status(400).send("email already exists");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
