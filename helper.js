//helper functions:
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
    return undefined;
  }
};

//check whether email is in database
const emailLookup = function(email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return false;
    }
  }
  return true;
};

//return the personal database that only contains things associated with this particular 
//user based on the personalID of the user
const urlsForUser = function(personalID, urlDatabase) {
  let updatedUrlDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === personalID) {
      updatedUrlDatabase[url] = { longURL: urlDatabase[url].longURL, userID: personalID };
    }
  }
  return updatedUrlDatabase;
};

//check whether someone is logged in
const userIsLoggedIn = function(cookieID) {
  return cookieID !== undefined;
};

//generate random string for username and shortURL
const generateRandomString = function() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
};

module.exports = { getUserByEmail, emailLookup, urlsForUser, userIsLoggedIn, generateRandomString };