const prisma = require("../config/prisma");
const stripe = require("stripe")(
  "sk_test_51Qai1eCuJCM6VSEhLwEQLTnJw0phnqRLGKmS843y4BqzT2CjD7UuZhjZTMtABWt63J14wTOCMP9Au7zKeYevqaRG00YXccKaGh"
);

exports.payment = async (req, res) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: req.user.id,
      },
    });

    const amountTHB = cart.cartTotal * 100 // <--- x 100 เพราะเป็นสกุลเงินของ stripe เป็นสตางค์  เดี๋ยวต้องไป หาร 100 กลับก่อนลง db

    //เอาข้อมูลเข้า stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountTHB,
      currency: "thb",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};
