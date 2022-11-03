const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const e = require("express");
const { generateRandomString, addUser, getUserByEmail, getUserByPass, getUserById } = require("./helper_functions")

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/register", (req, res) => {
    const user = users[req.cookies.user_id];
    const templateVars = { user };
    res.render("register", templateVars);
});

app.post("/register", (req, res) => {
    const email = req.body["email"];
    const password = req.body["password"];

    if (!email || !password) {
        return res.status(400).send("email or password is empty");
    }

    if (getUserByEmail(users, email)) {
        return res.status(400).send("email already used in another account")
    }

    res.cookie("user_id", addUser(users, email, password));
    res.redirect("/urls");
});

app.get("/login", (req, res) => {
    const user = users[req.cookies.user_id];
    const templateVars = { user };
    res.render("login", templateVars);
})

app.post("/login", (req, res) => {
    if (!getUserByEmail(users, req.body["email"])) {
        return res.status(403).send("email not found");
    }

    if (!getUserByPass(users, req.body["password"])) {
        return res.status(403).send("incorrect password");
    }
    res.cookie("user_id", getUserById(users, req.body["email"]));
    res.redirect("/urls");
});

app.get("/urls", (req, res) => {
    const user = users[req.cookies.user_id];
    const templateVars = {
        user: user,
        urls: urlDatabase,
    };
    res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
    const newId = generateRandomString();
    urlDatabase[newId] = req.body["longURL"];
    res.redirect(`/urls/${newId}`);
})

app.get("/urls/new", (req, res) => {
    const user = users[req.cookies.user_id];
    const templateVars = { user };
    res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
    const user = users[req.cookies.user_id];
    const templateVars = {
        user: user,
        id: req.params.id, 
        longURL: urlDatabase[req.params.id] 
    };
    res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
    urlDatabase[req.params.id] = req.body["longURL"]
    res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
    const id = req.params.id;
    const longURL = urlDatabase[id];
    res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
    const id = req.params.id;
    delete urlDatabase[id];
    res.redirect("/urls");
})

app.post("/logout", (req, res) => {
    console.log(users);
    res.clearCookie("user_id");
    res.redirect("login");
})

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});

