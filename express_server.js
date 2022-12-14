/// SETUP
const cookieSession = require('cookie-session');
const express = require("express");
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const app = express();
const PORT = 8080;
const { generateRandomString, addUser, getUserByEmail, getUserByPass, getUserById, urlsForUser, addURL } = require("./helper_functions")

/// MIDDLEWARE
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["Thisisverysecure"],
}));
app.use(methodOverride('_method'));

/// DATABASE
const urlDatabase = {};
const users = {};

/// *****ROUTES*****

/// HOME
app.get("/", (req, res) => {
    const user = users[req.session.user_id];

    if (user) {
        return res.redirect("/urls");
    }
    
    return res.redirect("/login");
});

/// REGISTER
app.get("/register", (req, res) => {
    const user = users[req.session.user_id];
    const templateVars = { user };

    if (user) {
        return res.redirect("/urls");
    }

    return res.render("register", templateVars);
});

app.post("/register", (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        let templateVars = { message: "email or password is empty" };
        return res.status(400).render("urls_error", templateVars);
    }

    if (getUserByEmail(users, email)) {
        let templateVars = { message: "email already used in another account" };
        return res.status(400).render("urls_error", templateVars);
    }

    const userID = addUser(users, email, password);
    req.session.user_id = userID;
    return res.redirect("/urls");
});

/// LOGIN
app.get("/login", (req, res) => {
    const user = users[req.session.user_id];
    const templateVars = { user };

    if (user) {
        return res.redirect("/urls");
    }

    return res.render("login", templateVars);
})

app.post("/login", (req, res) => {
    const email = req.body["email"];
    const password = req.body["password"];

    if (!getUserByEmail(users, email)) {
        let templateVars = { message: "email not found" };
        return res.status(403).render("urls_error", templateVars);
    }

    if (!getUserByPass(users, password)) {
        let templateVars = { message: "incorrect password" };
        return res.status(403).render("urls_error", templateVars);
    }

    req.session.user_id = getUserById(users, req.body["email"]);
    return res.redirect("/urls");
});

/// URLS
app.get("/urls", (req, res) => {
    const user = users[req.session.user_id];
    const templateVars = {
        user: user,
        urls: urlsForUser(urlDatabase, req.session.user_id),
        message: "Please log in first."
    };

    if(!user) {
        return res.status(400).render("urls_error", templateVars);
    }

    return res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
    if(!req.session.user_id) {
        let templateVars = { message: "Please log in first." };
        return res.status(400).render("urls_error", templateVars);
    }

    const newId = addURL(req.body.longURL, req.session.user_id, urlDatabase);
    return res.redirect(`/urls/${newId}`);
});

/// URLS/NEW
app.get("/urls/new", (req, res) => {
    const user = users[req.session.user_id];
    const templateVars = { user };

    if(!user) {
        return res.redirect("/login");
    }

    return res.render("urls_new", templateVars);
});

/// URLS/:ID
app.get("/urls/:id", (req, res) => {
    const user = users[req.session.user_id];
    let templateVars = {
        user: user,
        id: req.params.id, 
        longURL: urlDatabase[req.params.id]["longURL"],
        urls: urlDatabase
    }

    if(!user) {
        let templateVars = { message: "Please log in first." }
        return res.status(400).render("urls_error", templateVars);
    }

    if(urlDatabase[templateVars.id]["userID"] !== req.session.user_id) {
        let templateVars = { message: "This URL does not belong to you." }
        return res.status(401).render("urls_error", templateVars);
    }

    return res.render("urls_show", templateVars);
});

app.put("/urls/:id", (req, res) => {
    if (!urlDatabase[req.params.id]) {
        let templateVars = { message: "This URL does not exist" };
        return res.status(404).render("urls_error", templateVars);
    }

    if(!req.session.user_id) {
        let templateVars = { message: "Please login first" };
        return res.status(400).status(400).render("urls_error", templateVars);
    }

    if(urlDatabase[req.params.id]["userID"] !== req.session.user_id) {
        let templateVars = { message: "This URL does not belong to you" };
        return res.status(401).status(400).render("urls_error", templateVars);
    }

    urlDatabase[req.params.id]["longURL"] = req.body["longURL"];
    const id = req.params.id;
    const longURL = req.body.longURL;
    urlDatabase[id].longURL = longURL;
    urlDatabase[id].visitCount = 0;
    urlDatabase[id].visitHistory = [];
    urlDatabase[id].uniqueVisitCount = 0;
    urlDatabase[id].visitorIDList = [];

    return res.redirect("/urls");
});

/// U/:ID
app.get("/u/:id", (req, res) => {
    const id = req.params.id;
    const longURL = urlDatabase[id]["longURL"];
    const dateVisited = new Date();

    if(!urlDatabase[id]) {
        let templateVars = {
            message: "This short URL does not exist."
        }
        return res.status(404).render("urls_error", templateVars);
    }
    if (!req.session.user_id) {
        req.session.user_id = generateRandomString();
        urlDatabase[id].visitHistory.push([dateVisited, req.session.user_id]);
        urlDatabase[id].visitCount++;
        urlDatabase[id].visitorIDList.push(req.session.user_id);
        urlDatabase[id].uniqueVisitCount++;
    } else {
        const visitorId = urlDatabase[id].visitorIDList;
        urlDatabase[id].visitHistory.push([dateVisited,req.session.user_id]);
        urlDatabase[id].visitCount++;
        if (!visitorId.includes(req.session.user_id)) {
          visitorId.push(req.session.user_id);
          urlDatabase[id].uniqueVisitCount++;
        }
      }

    return res.redirect(longURL);
});

/// URLS/:ID/DELETE
app.delete("/urls/:id", (req, res) => {
    const id = req.params.id;

    if (!urlDatabase[id]) {
        let templateVars = { message: "This URL does not exist" };
        return res.status(404).render("urls_error", templateVars);
    }

    if(!req.session.user_id) {
        let templateVars = { message: "Please login first" };
        return res.status(400).render("urls_error", templateVars);
    }

    if(urlDatabase[req.params.id]["userID"] !== req.session.user_id) {
        let templateVars = { message: "This URL does not belong to you" };
        return res.status(401).render("urls_error", templateVars);
    }

    delete urlDatabase[id];
    return res.redirect("/urls");
});

/// LOGOUT
app.post("/logout", (req, res) => {
    req.session = null;
    return res.redirect("login");
});

/// SERVER
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});

