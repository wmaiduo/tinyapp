const express = require("express");
let cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const {
  getUserByEmail,
  emailLookup,
  urlsForUser,
  userIsLoggedIn,
  generateRandomString,
} = require("./helper");

app.set("view engine", "ejs");

//Database for different url
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

//default users and passwords (mainly for testing purposes):
//default password
const password1 = "aba";
const hashedPassword1 = bcrypt.hashSync(password1, 10);
const password2 = "dishwasher-funk";
const hashedPassword2 = bcrypt.hashSync(password2, 10);
//default user database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: hashedPassword1,
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: hashedPassword2,
  },
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

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

//render with database
app.get("/urls", (req, res) => {
  let id = null;
  if (userIsLoggedIn(req.session.userID)) {
    id = req.session.userID;
    const email = users[id].email;
    let updatedUrlDatabase = urlsForUser(id, urlDatabase); //urlsForUser specifies the URL from the database for this specific user
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
    res.redirect("../login");
  } else {
    let id = req.session.userID;
    const email = users[id].email;
    res.render("urls_new", { userID: id, userEmail: email });
  }
});

//get information about the input URL
app.get("/urls/:id", (req, res) => {
  let id = null;
  if (userIsLoggedIn(req.session.userID)) {
    id = req.session.userID;
    let newShortURL = req.params.id;
    let updatedUrlDatabase = urlsForUser(id, urlDatabase);
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
        .status(400)
        .send("this website does not exist or does not belong to you");
    }
  } else {
    res.status(400).send("not logged in");
  }
});

//redirect using shortURL id
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(400).send("website does not exist");
  } else {
    let websiteHeader = "";
    for (let i = 0; i <= 3; i++) {
      websiteHeader += urlDatabase[req.params.id].longURL[i];
    }

    //check whether the longURL has "http" in the front, if not then http is added to make sure the link works
    if (!urlDatabase[req.params.id].longURL.includes("www.")) {
      res.redirect("https://www." + urlDatabase[req.params.id].longURL);
    } else {
      res.status(301).redirect('https://' + urlDatabase[req.params.id].longURL);
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
    const shortURL = generateRandomString(); //initialize with a random string first, will be changed later
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
    const templateVars = {
      shortURL: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      userID: id,
      userEmail: users[id].email,
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("not logged in");
  }
});

//login
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
    let currentID = req.session.userID;
    let updatedUrlDatabase = urlsForUser(currentID, urlDatabase);
    const shortURL = req.params.id;

    let status400 = true;
    for (let url in updatedUrlDatabase) {
      if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
        //check whether the URL belongs to the current user
        delete urlDatabase[shortURL];
        status400 = false;
        res.redirect("/urls");
      }
    }
    //give an error if the URL does not belong to this user
    if (status400) {
      res.status(400).send("trying to modify someone else's file");
    }
  }
});

//change the short URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const updatedUrlDatabase = urlsForUser(req.session.userID, urlDatabase); //get URLdatabase for the current user

  let error400 = true;
  let loggedIn = true;
  if (req.session.userID === undefined) {
    //check whether is logged in
    loggedIn = false;
  }
  for (let url in updatedUrlDatabase) {
    if (updatedUrlDatabase[url].userID === urlDatabase[shortURL].userID) {
      //check whether this URL belongs to the current user
      error400 = false;
    }
  }
  if (urlDatabase[shortURL].userID === undefined) {
    //check whether this url exists
    error400 = false;
  }
  if (!error400) {
    //happy path
    //update shortURL according to user input
    urlDatabase[shortURL] = {
      longURL: req.body.url,
      userID: req.session.userID,
    };
    res.redirect("/urls");
  } else {
    //error
    if (loggedIn) {
      res.status(400).send("accessing someone else's website");
    } else {
      res.status(400).send("not logged in");
    }
  }
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
  let error400 = true;
  for (let user in users) {
    if (users[user].email === loginEmail) {
      if (bcrypt.compareSync(loginPassword, users[user].hashedPassword)) {
        //log in if the login email or password matches with user database
        req.session.userID = users[user].id;
        error400 = false;
        res.redirect("/urls");
      }
    }
  }
  if (error400) {
    res.status(400).send("wrong username or password");
  }
});

//logout
app.post("/logout", (req, res) => {
  req.session = null; //delete cookies
  res.redirect("/urls");
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
