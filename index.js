const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const timerRouter = require("./timers.js");
const { findUserByUserName, createUser, createSession, deleteSession } = require("./DB/db.js");
const { auth, hash } = require("./helpers.js");

const app = express();

const { MongoClient } = require("mongodb");

const clientPromise = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("users");
    next();
  } catch (err) {
    next(err);
  }
});
app.use("/api/timers", timerRouter);

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;

  const encodePassword = await hash(password);

  const user = await findUserByUserName(req.db, username);

  if (!user || user.password !== encodePassword) {
    return res.redirect("/?authError=true");
  }

  const sessionId = await createSession(req.db, user._id);

  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUserName(req.db, username);

  if (user) {
    return res.redirect("/?authError=There is already a user with this nickname");
  } else if (password === "") {
    return res.redirect("/?authError=You must enter password");
  } else {
    const encodePassword = await hash(password);

    const id = await createUser(req.db, username, encodePassword);
    const sessionId = await createSession(req.db, id);

    res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
  }
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  await deleteSession(req.db, req.sessionId);

  res.clearCookie("sessionId").redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
