const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const twilio = require("twilio");
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
require('./connection')
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server, {
  cors: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', "DELETE"]
})


const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const imageRoutes = require('./routes/imageRoutes');

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/images', imageRoutes);


app.post('/create-payment', async(req, res)=> {
  const {amount} = req.body;
  console.log(amount);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      payment_method_types: ['card']
    });
    res.status(200).json(paymentIntent)
  } catch (e) {
    console.log(e.message);
    res.status(400).json(e.message);
   }
})

app.post("/api/send-bid-message", async (req, res) => {
  const { name, phoneNumber, email, bid } = req.body;

  // Configure the Twilio client
  const client = twilio("Twilio Account SID", "Twilio Auth Token");

  // Configure the message
  const messageBody = `New Bid:\nName: ${name}\nPhone Number: ${phoneNumber}\nEmail: ${email}\nBid (₹): ${bid}`;

  try {
    // Find all admin users
    const admins = await User.find({ isAdmin: true });

    // Send the message to each admin user
    const promises = admins.map((admin) => {
      return client.messages.create({
        body: messageBody,
        from: "+13203346165",
        to: `+91${admin.phoneNumber}`,
      });
    });

    // Wait for all messages to be sent
    await Promise.all(promises);

    console.log("Messages sent to admins");
    res.status(200).json({ message: "Message sent successfully to admins" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Error sending message to admins" });
  }
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Server running at port', process.env.PORT || 8080);
});

app.set('socketio', io);
