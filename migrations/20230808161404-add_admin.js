const { createHash } = require("crypto");

module.exports = {
  async up(db) {
    const hashCodec = createHash("sha256");
    const password = await hashCodec.update("pwd007").digest("hex");
    await db.collection("users").insertOne({
      username: "admin",
      password,
    });
  },

  async down(db) {
    const username = "admin";
    await db.collection("users").deleteOne({ username });
  },
};
