const { findUserBySessionId } = require("./DB/db.js");
const { createHash } = require("crypto");

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = await findUserBySessionId(req.db, req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const hash = async (password) => {
  const hashCodec = createHash("sha256");
  return await hashCodec.update(password).digest("hex");
};

module.exports = { auth, hash };
