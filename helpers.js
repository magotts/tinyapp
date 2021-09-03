const getUserByEmail = (email, users) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false;
};

const urlsForUser = (userID, urlDatabase) => {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURL;
};

let generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};


module.exports = { getUserByEmail, urlsForUser, generateRandomString };