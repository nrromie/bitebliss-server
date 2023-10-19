const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.plm4jqn.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const productsCollection = client.db('brandshopDB').collection('products')
    const brandsCollection = client.db('brandshopDB').collection('brands')


    app.get('/brands', async (req, res) => {
      try {
        const cursor = await brandsCollection.find().toArray();
        res.send(cursor);
      } catch (error) {
        res.send({ error: 'Internal Server Error' });
      }
    });



    app.get('/products/:name', async (req, res) => {
      const brand = req.params.name;
      try {
        const cursor = productsCollection.find({ brandName: brand });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send({ error: 'Internal Server Error' });
      }
    });

    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      try {
        const result = await productsCollection.insertOne(newProduct);
        res.send(result);
      } catch {
        res.send({ error: 'An error occured' })
      }
    });
    
    app.patch('/update/:id', async (req, res) => {
      const productId = req.params.id;
      const updatedProductData = req.body;
      try {
        await productsCollection.updateOne({ _id: new ObjectId(productId) }, { $set: updatedProductData });
        res.json({ message: 'Product updated successfully' });
      } catch (error) {
        console.error(error);
        res.send({ error: 'Internal Server Error' });
      }
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`Server is on port: ${port}`)
})