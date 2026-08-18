const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
console.log("Connecting...");
mongoose.connect(process.env.MONGO_URI, {
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 5000
}).then(() => {
  console.log("Connected");
  process.exit(0);
}).catch(e => {
  console.error("Caught error:", e);
  process.exit(1);
});
