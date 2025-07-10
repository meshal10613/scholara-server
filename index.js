require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@meshal10613.mbbtx0s.mongodb.net/?retryWrites=true&w=majority&appName=meshal10613`;

//middleware
app.use(express.json());
app.use(cors());

app.get("/", async(req, res) => {
    res.send("Server is running....");
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const usersCollection = client.db("shcolara").collection("users");
        const scholarshipsCollection = client.db("shcolara").collection("scholarships");

        //usersCollection
        app.get("/users", async(req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        app.get("/users/:email", async(req, res) =>{
            const {email} = req.params;
            const query = {
                email
            };
            const result = await usersCollection.findOne(query);
            res.send(result);
        });

        app.post("/users", async(req, res) => {
            const { email } = req.body;
            //chech user already exist or not
            const existUser = await usersCollection.findOne({ email });
            if(existUser){
                const { lastSignInTime } = req.body;
                const query = { email };
                const updatedDoc = {
                    $set: {
                        lastSignInTime
                    }
                };
                const result = await usersCollection.updateOne(query, updatedDoc);
                return res.status(200).send(result);
            };

            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.status(201).send(result);
        });

        // scholarshipsCollection
        app.get("/scholarships", async(req, res) => {
            const result = await scholarshipsCollection.find().toArray();
            res.send(result);
        });

        app.get("/scholarships/:id", async(req, res) => {
            const {id} = req.params;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await scholarshipsCollection.findOne(query);
            res.send(result);
        });

        app.post("/scholarships", async(req, res) => {
            const serverData = req.body;
            const result = await scholarshipsCollection.insertOne(serverData);
            res.send(result);
        });

        // DELETE a scholarship by ID
        app.delete("/scholarships/:id", async (req, res) => {
            const id = req.params.id;
            try {
                const result = await scholarshipsCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (err) {
                res.status(500).json({ message: "Failed to delete scholarship" });
            }
        });

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});