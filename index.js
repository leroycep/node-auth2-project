const express = require("express");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 40588;
const db = require("./data/db-config.js");
const secrets = require("./secrets.js");
const server = express();

server.use(express.json());

server.post("/api/register", (req, res) => {
  if (
    req.body.username === undefined ||
    req.body.password === undefined ||
    req.body.department === undefined
  ) {
    res.status(400).json({
      message: "username, password, and department must be specified",
    });
    return;
  }
  db("users")
    .insert(req.body, "id")
    .then((ids) =>
      db("users")
        .select()
        .where({ id: ids[0] })
        .first()
        .then((user) => res.status(201).json(user))
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "failed while inserting new user" });
    });
});

server.post("/api/login", (req, res) => {
  if (req.body.username === undefined || req.body.password === undefined) {
    res.status(400).json({
      message: "username and password must be specified",
    });
    return;
  }
  db("users")
    .select()
    .where({ username: req.body.username })
    .first()
    .then((user) =>
      res.status(200).json({
        username: user.username,
        department: user.department,
        token: generateToken(user),
      })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "failed while inserting new user" });
    });
});

server.get("/api/users", checkAuthorization, (req, res) => {
  db("users")
    .select()
    .where({ department: req.token.department })
    .then((users) =>
      res.status(200).json(
        users.map((u) => ({
          id: u.id,
          username: u.username,
          department: u.department,
        }))
      )
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "failed while inserting new user" });
    });
});

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    department: user.department,
  };

  const options = {
    expiresIn: "1d",
  };

  return jwt.sign(payload, secrets.jwtSecret, options);
}

function checkAuthorization(req, res, next) {
  if (req.headers.authorization === undefined) {
    res.status(401).json({ message: "authorization header must be given" });
    return;
  }
  if (!jwt.verify(req.headers.authorization, secrets.jwtSecret)) {
    res.status(401).json({ message: "authorization header is invalid" });
    return;
  }
  req.token = jwt.decode(req.headers.authorization);
  next();
}

server.listen(port, () =>
  console.log(` == server is listening on port ${port} == `)
);
