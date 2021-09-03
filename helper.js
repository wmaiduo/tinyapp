const getUserByEmail = function (email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
    return undefined;
  }
}

const emailLookup = function (email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return false;
    }
  }
  return true;
}

module.exports = { getUserByEmail, emailLookup }