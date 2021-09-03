const getUserByEmail = function (email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    } else {
      return false
    }
  }
}

comst emailLookup = function (email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return false;
    }
  }
  return true;
}

module.exports = { getUserByEmail }