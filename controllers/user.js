const prisma = require("../config/prisma");

exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        enabled: true,
        address: true,
      },
    });

    res.json(users);
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { id, enabled } = req.body;
    const user = await prisma.user.update({
      where: {
        id: Number(id),
      },

      data: {
        enabled: enabled,
      },
    });

    res.send("Status Changed");
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { id, role } = req.body;
    const user = await prisma.user.update({
      where: {
        id: Number(id),
      },

      data: {
        role: role,
      },
    });

    res.send("Role Changed");
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.userCart = async (req, res) => {
  try {
    const { cart } = req.body;
    console.log(cart);
    console.log(req.user.id);

    const user = await prisma.user.findFirst({
      where: {
        id: Number(req.user.id),
      },
    });

    // quantity check
    for (const item of cart) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.id,
        },

        select: {
          quantity: true,
          title: true,
        },
      });

      // items on cart more than product quantity
      if (!product) {
        return res.status(400).json({
          ok: false,
          message: "สินค้าไม่พบในระบบ",
        });
      }
      if (product.quantity === 0) {
        return res.status(400).json({
          ok: false,
          message: `สินค้า ${product.title || "product"} หมด`,
        });
      }
      if (item.count > product.quantity) {
        return res.status(400).json({
          ok: false,
          message: `${product.title} quantity exceeds stock.(${product.quantity} available)`,
        });
      }
    }

    //delete old cart item
    await prisma.productOnCart.deleteMany({
      where: {
        cart: {
          orderedById: user.id,
        },
      },
    });

    //delete old cart
    await prisma.cart.deleteMany({
      where: {
        orderedById: user.id,
      },
    });

    //เตียมสินค้า
    let products = cart.map((item) => ({
      productId: item.id,
      count: item.count,
      price: item.price,
    }));

    //หาคารารวมสินค้าใน cart
    let cartTotal = products.reduce(
      (sum, item) => sum + item.price * item.count,
      0
    );

    //new cart
    const newCart = await prisma.cart.create({
      data: {
        products: {
          create: products,
        },
        cartTotal: cartTotal,
        orderedById: user.id,
      },
    });

    console.log(newCart);

    res.send("Cart items added");
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.getUserCart = async (req, res) => {
  try {
    //req.user.id
    //find user cart
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: Number(req.user.id),
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      products: cart.products,
      cartTotal: cart.cartTotal,
    });
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.emptyCart = async (req, res) => {
  try {
    //req.user.id
    //find user cart
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: Number(req.user.id),
      },
    });

    //null cart check
    if (!cart) {
      return res.status(400).json({ message: "There's no cart" });
    }

    //delete product on cart
    await prisma.productOnCart.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    //delete cart
    const reusult = await prisma.cart.deleteMany({
      where: {
        orderedById: Number(req.user.id),
      },
    });

    console.log(reusult);

    res
      .status(400)
      .json({ message: "Cart deleted successful", deleteCount: reusult.count });
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.saveAddress = async (req, res) => {
  try {
    //req.user.id
    const { address } = req.body;
    const addressUser = await prisma.user.update({
      where: {
        id: Number(req.user.id),
      },
      data: {
        address: address,
      },
    });

    res.json({ ok: true, message: "Address saved succesful" });
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.saveOrder = async (req, res) => {
  try {
    // console.log(req.body)
    // return

    const { id, amount, status, currency } = req.body.paymentIntent;

    //find user cart
    const userCart = await prisma.cart.findFirst({
      where: {
        orderedById: Number(req.user.id),
      },

      include: {
        products: true,
      },
    });

    //product on cart check
    if (!userCart || userCart.products.length === 0) {
      return res.status(400).json({ ok: false, message: "Cart's Empty" });
    }

    const amountTHB = Number(amount) / 100; // <--- แปลงเงิน stripe ที่รับมา กลับ

    //create a new Order
    const order = await prisma.order.create({
      data: {
        products: {
          create: userCart.products.map((item) => ({
            productId: item.productId,
            count: item.count,
            price: item.price,
          })),
        },

        orderedBy: {
          connect: {
            id: req.user.id,
          },
        },

        cartTotal: userCart.cartTotal,
        stripePaymentId: id,
        amount: amountTHB,
        status: status,
        currentcy: currency,
      },
    });

    //update product quantity
    const bulkchange = userCart.products.map((item) => ({
      where: {
        id: item.productId,
      },

      data: {
        quantity: {
          decrement: item.count,
        },

        sold: {
          increment: item.count,
        },
      },
    }));

    await Promise.all(
      bulkchange.map((bulkchanged) => prisma.product.update(bulkchanged))
    );

    //empty cart
    await prisma.cart.deleteMany({
      where: {
        orderedById: Number(req.user.id),
      },
    });

    res.json({
      ok: true,
      order,
    });
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    //req.user.id
    const orders = await prisma.order.findMany({
      where: {
        orderedById: Number(req.user.id),
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    //order check
    if (orders.length === 0) {
      res.status(500).json({
        ok: false,
        message: "There's on order",
      });
    }

    res.json({
      ok: true,
      orders,
    });
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body; // รับค่า name จาก body
    const { id } = req.user; 

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // อัปเดตข้อมูลชื่อผู้ใช้
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        name: name || user.name, // ใช้ค่าที่ส่งมา หรือค่าชื่อเดิมหากไม่มีการส่งมา
      },
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
