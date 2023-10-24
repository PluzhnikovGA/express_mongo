require("dotenv").config();

const { nanoid } = require("nanoid");

const { ObjectId } = require("mongodb");

// const DB = {
//   users: [
//     {
//       _id: nanoid(),
//       username: "admin",
//       password: hash("pwd007"),
//     },
//   ],
//   sessions: {},
//   timers: [],
// };

const findUserByUserName = async (db, username) => await db.collection("users").findOne({ username });

const findUserBySessionId = async (db, sessionId) => {
  const session = await db.collection("sessions").findOne(
    { sessionId },
    // для возврата значения
    {
      projection: { userId: 1 },
    }
  );

  if (!session) {
    return false;
  }

  return await db.collection("users").findOne({ _id: new ObjectId(session.userId) });
};

const createUser = async (db, username, password) => {
  const { insertedId } = await db.collection("users").insertOne({
    username,
    password,
  });

  return insertedId;
};

const createSession = async (db, userId) => {
  const sessionId = nanoid();

  await db.collection("sessions").insertOne({
    userId,
    sessionId,
  });

  return sessionId;
};

const deleteSession = async (db, sessionId) => {
  await db.collection("sessions").deleteOne({ sessionId });
};

const findTimersByUser = async (db, userId) => {
  return await db.collection("timers").find({ userId }).toArray();
};

const createTimer = async (db, userId, description) => {
  const start = Date.now();

  const { insertedId } = await db.collection("timers").insertOne({
    userId: userId,
    start: start,
    description: description,
    isActive: true,
  });

  return insertedId;
};

const stopTimer = async (db, id) => {
  const end = Date.now();

  await db.collection("timers").findOneAndUpdate(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        end,
        isActive: false,
      },
    }
  );
};

module.exports = {
  findUserByUserName,
  findUserBySessionId,
  createUser,
  createSession,
  deleteSession,
  findTimersByUser,
  createTimer,
  stopTimer,
};
