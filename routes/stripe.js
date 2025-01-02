const express = require("express");
const router = express.Router();
//import middleware
const { authCheck } = require("../middlewares/authCheck");

//import controller
const { payment } = require("../controllers/stripe");

router.post("/user/create-payment-intent", authCheck, payment);

module.exports = router;
