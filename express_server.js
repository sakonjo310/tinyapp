const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

function generateRandomString() {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/register", (req, res) => {
    res.render("/register");
});

app.post("/register", (req, res) => {
    const userID = generateRandomString();
    users.userID = {
        id: userID,
        email: req.body["email"],
        password: req.body["password"]
    }
    console.log(users);
    res.redirect("/urls");
})

app.post("/login", (req, res) => {
    res.cookie("username", req.body["username"]);
    res.redirect("/urls");
});

app.get("/urls", (req, res) => {
    const templateVars = {
        username: req.cookies["username"],
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
    const templateVars = { username: req.cookies["username"] };
    res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
    const templateVars = {
        username: req.cookies["username"],
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
    res.clearCookie("username");
    res.redirect("/urls");
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

