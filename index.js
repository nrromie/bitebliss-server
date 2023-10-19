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
    const usersCollection = client.db('brandshopDB').collection('users')

    //retrieve brands
    app.get('/brands', async (req, res) => {
      try {
        const cursor = await brandsCollection.find().toArray();
        res.send(cursor);
      } catch (error) {
        res.send({ error: 'Internal Server Error' });
      }
    });

    //retrieve brand's products
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

    //Add products
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      try {
        const result = await productsCollection.insertOne(newProduct);
        res.send(result);
      } catch {
        res.send({ error: 'An error occured' })
      }
    });

    //Update products
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

    //Retrieve details of a product
    app.get('/details/:id', async (req, res) => {
      const productId = req.params.id;
      try {
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
          return res.send({ error: 'Product not found' });
        }
        res.json(product);
      } catch (error) {
        res.send({ error: 'Internal Server Error' });
      }
    });

    //Create cart in users Collection
    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const { email } = newUser;
        const existingUser = await usersCollection.findOne({ email: email });
        if (!existingUser) {
          const result = await usersCollection.insertOne(newUser);
          res.send(result);
        }
      } catch {
        res.send({ message: 'Internal Server Error' });
      }
    });

    //Add products to cart array
    app.patch('/users/:email', async (req, res) => {
      try {
        const userEmail = req.params.email;
        const productId = req.body.productId;

        const user = await usersCollection.findOne({ email: userEmail });
        const updatedCart = [...user.cart, productId];

        const result = await usersCollection.updateOne(
          { email: userEmail },
          { $set: { cart: updatedCart } }
        );

        res.send({ message: 'Product added to cart successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    //Retrieve carts data
    app.get('/cart/:email', async (req, res) => {
      try {
        const userEmail = req.params.email;
        const user = await usersCollection.findOne({ email: userEmail });
        if (user) {
          const productIds = user.cart.map(productId => new ObjectId(productId))
          const cartItems = await productsCollection.find({ _id: { $in: productIds } }).toArray();
          res.json(cartItems);
        } else {
          res.send({ message: 'User not found' });
        }
      } catch (error) {
        console.error(error);
        res.send({ message: 'Internal Server Error' });
      }
    });

    //Delete products from cart
    app.delete('/cart/:email/:productId', async (req, res) => {
      try {
        const userEmail = req.params.email;
        const productId = req.params.productId;
        const user = await usersCollection.findOne({ email: userEmail });

        if (user) {
          const updatedCart = user.cart.filter(cartProductId => cartProductId !== productId);
          await usersCollection.updateOne(
            { email: userEmail },
            { $set: { cart: updatedCart } }
          );
          res.send({ message: 'Item removed from cart successfully' });
        } else {
          res.send({ message: 'User not found' });
        }
      } catch (error) {
        res.send({ message: 'Internal Server Error' });
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