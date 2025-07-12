require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
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
            const {role} = req.query;
            let query = {};
            if(role){
                query = {
                    role
                };
            };
            const result = await usersCollection.find(query).toArray();
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

        // ✅ PATCH: Update user role
        app.patch("/users/:id", async (req, res) => {
            const id = req.params.id;
            const { role } = req.body;

            if (!["user", "moderator", "admin"].includes(role)) {
                return res.status(400).json({ message: "Invalid role." });
            }

            try {
                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { role } }
                );
                res.send(result)
            } catch (err) {
                console.error("Error updating role:", err);
                res.status(500).json({ message: "Server error while updating role" });
            }
        });

        app.delete("/users/:id", async (req, res) => {
            const { id } = req.params;
            try {
                const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
                return res.send(result);
            } catch (error) {
                console.error("Delete error:", error);
                return res.status(500).json({ success: false, message: "Deletion failed.", error });
            }
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

        app.put("/scholarships/:id", async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;

            try {
                const result = await scholarshipsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
                );

                if (result.modifiedCount > 0) {
                    res.send(result)
                } else {
                    res.status(404).json({ message: "Scholarship not found or no changes made" });
                }
            } catch (error) {
                console.error("Update error:", error);
                res.status(500).json({ message: "Server error", error });
            }
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

        //payment
        app.post('/create-payment-intent', async (req, res) => {
            const { amountInCents, id } = req.body;
            const session = await stripe.paymentIntents.create({
                // Provide the exact Price ID (for example, price_1234) of the product you want to sell
                amount: amountInCents, //amount in cents 
                currency: "bdt",
                payment_method_types: ['card'],
                // return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
            });

            res.json({clientSecret: session.client_secret});
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