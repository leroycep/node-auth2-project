const express = require("express");

const port = process.env.PORT || 40588;
const db = require("./data/db-config.js");
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

server.listen(port, () =>
  console.log(` == server is listening on port ${port} == `)
);
