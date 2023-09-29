require("dotenv").config();
// const jwt = require('jsonwebtoken');
const express = require("express");
const cors = require("cors");
var morgan = require("morgan");

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const fileUpload = require("./src/fileupload");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// =============================================================================
// JWT Verify
// =============================================================================

// JWT Verify token Access

// let verifyJwt = (req, res, next) => {

//     let authorization = req.headers.authorization
//     if (!authorization) {
//       return res.status(401).send({ error: true, message: " Unauthorize Access " })
//     };
//     // bearer token access
//     let token = authorization.split(' ')[1];

//     jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
//       if (err) {

//         return res.status(401).send({ error: true, message: " Unauthorize Access " })
//       }
//       req.decoded = decoded;
//       next()
//     });

//   }

// ================================================================================================
// Mongo Db Operation
// ================================================================================================

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.mkl3pgj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // ============================================================

    const userCollection = client.db("ClientProjects").collection("user");
    const orderCollection = client.db("ClientProjects").collection("order");
    const BankCollection = client.db("ClientProjects").collection("Bank");

    // =============================================
    //       website email user Details
    // =============================================

    // upload to s3
    app.post("/upload", (req, res) => {
      fileUpload(req)
        .then((data) => {
          res.json({ url: data.Location }).end();
        })
        .catch((error) => {
          console.log(error);
          res.status(400).json({
            message: "An error occurred.",
            error,
          });
        });
    });
    //
    // post bank
    app.post("/BankData", async (req, res) => {
      let Bank = req.body;
      let result = await BankCollection.insertOne(Bank);
      res.send(result);
    });

    //get bank info
    app.get("/bank", async (req, res) => {
      let result = await BankCollection.find().toArray();
      res.send(result);
    });

    // all user get

    app.get("/users", async (req, res) => {
      let result = await userCollection.find().toArray();
      res.send(result);
    });

    //     // user data add mongo db
    app.post("/users", async (req, res) => {
      let user = req.body;

      let query = { email: user.email };
      let existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "Already existing user" });
      }

      let result = await userCollection.insertOne(user);
      res.send(result);
    });

    //     // // check user role show Dashboard _________________________________________

    app.get("/userRoleCheck/:email", async (req, res) => {
      let email = req.params.email;
      let query = { email: email };
      let result = await userCollection.findOne(query);
      res.send(result);
    });

    app.delete("/usersDelete/:id", async (req, res) => {
      let deleteId = req.params.id;
      let query = { _id: new ObjectId(deleteId) };
      let result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //    // // check user role show Dashboard _________________________________________

    app.post("/orderData", async (req, res) => {
      let order = req.body;
      let result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.get("/allOrderData", async (req, res) => {
      let result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.delete("/OrderDelete/:id", async (req, res) => {
      let orderID = req.params.id;
      let query = { _id: new ObjectId(orderID) };
      let result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // // ------------------------------------------------------

    app.put("/profileUpdate/:id", async (req, res) => {
      let id = req.params.id;
      let upData = req.body;

      console.log(id, upData);

      let filter = { _id: new ObjectId(id) };
      let option = { upsert: true };
      let updateProfile = {
        $set: {
          name: upData.nameValue,
          title: upData.titleValue,
          bio: upData.bioValue,
        },
      };
      let result = await userCollection.updateOne(
        filter,
        updateProfile,
        option
      );
      // console.log(result)
      res.send(result);
    });

    // ============================================================

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// test server
app.get("/", (req, res) => {
  res.send("Client Codding Project Is runninggggggggggggggg");
});
// port Connect
app.listen(port, () => {
  console.log(`Client project server is running ${port}`);
});
