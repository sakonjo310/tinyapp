function generateRandomString() {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

function addUser(usersDatabase, email, password) {
    const userID = generateRandomString();
    usersDatabase[userID] = {
        id: userID,
        email,
        password
    }
    return userID;
}

function getUserByEmail(users, email) {
    for (let user in users) {
        if (users[user]["email"] === email) {
            return true;
        }
    }
    return false;
};

function getUserByPass(users, password) {
    for (let user in users) {
        if (users[user]["password"] === password) {
            return true;
        }
    }
    return false;
};

function getUserById(users, email) {
    for (let user in users) {
        if (users[user]["email"] === email) {
            return users[user]["id"];
        }
    }
    return false;
};

function urlsForUser(database, id) {
    let customObj = {};
    let ids = Object.keys(database)
    for (let item of ids) {
        if (database[item]["userID"] === id) {
            customObj[item] = database[item];
        }
    }
    return customObj;
}


module.exports = {
    generateRandomString,
    addUser,
    getUserByEmail,
    getUserByPass,
    getUserById,
    urlsForUser
}