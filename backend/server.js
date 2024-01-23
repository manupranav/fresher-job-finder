const express = require("express");
const dotenv = require("dotenv").config();
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const connectDB = require("./config/db");
const colors = require("colors");
const port = process.env.PORT || 3001;

connectDB();

const app = express();

const corsOptions = {
  origin: "http://localhost:4200", // Update with your Angular app's URL
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/jobs", require("./routes/jobRoutes"));

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`);
});
