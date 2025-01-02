const { query } = require("express");
const prisma = require("../config/prisma");
const cloudinary = require("cloudinary").v2;

//config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      quantity,
      categoryId,
      images,
      product_defect,
    } = req.body;
    const product = await prisma.product.create({
      data: {
        title: title,
        description: description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        categoryId: parseInt(categoryId),
        product_defect: product_defect,
        images: {
          create: images.map((item) => ({
            asset_id: item.asset_id,
            public_id: item.public_id,
            url: item.url,
            secure_url: item.secure_url,
          })),
        },
      },
    });

    res.send(product);
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.list = async (req, res) => {
  try {
    const { count } = req.params;
    const products = await prisma.product.findMany({
      take: parseInt(count),
      orderBy: { created: "desc" },
      include: {
        category: true,
        images: true,
      },
    });

    res.send(products);
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product with related images
    const product = await prisma.product.findFirst({
      where: { id: Number(id) },
      include: { images: true },
    });

    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    // Delete related images from Cloudinary
    const deleteImagePromise = product.images.map(
      (item) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.destroy(item.public_id, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        })
    );

    await Promise.all(deleteImagePromise);

    // Delete related productOnOrder
    await prisma.productOnOrder.deleteMany({
      where: { productId: Number(id) },
    });

    // Delete related productOnCart
    await prisma.productOnCart.deleteMany({
      where: { productId: Number(id) },
    });

    // Finally, delete the product
    await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    res.send("Product Deleted");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        id: Number(id),
      },

      include: {
        category: true,
        images: true,
      },
    });

    res.send(product);
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      quantity,
      categoryId,
      images,
      product_defect,
    } = req.body;
    const { id } = req.params;

    //remove old img
    await prisma.image.deleteMany({
      where: {
        productId: Number(id),
      },
    });

    const product = await prisma.product.update({
      where: {
        id: Number(id),
      },

      data: {
        title: title,
        description: description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        categoryId: parseInt(categoryId),
        product_defect: product_defect,
        images: {
          create: images.map((item) => ({
            asset_id: item.asset_id,
            public_id: item.public_id,
            url: item.url,
            secure_url: item.secure_url,
          })),
        },
      },
    });

    res.send(product);
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.listBy = async (req, res) => {
  try {
    const { sort, order, limit } = req.body;
    console.log(sort, order, limit);
    const products = await prisma.product.findMany({
      take: limit,
      orderBy: { [sort]: order },
      include: {
        category: true,
        images: true,
      },
    });

    res.send(products);
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

exports.searchFillter = async (req, res) => {
  try {
    const { query, category, price } = req.body;

    if (query) {
      console.log("query ->", query);
      await handleQuery(req, res, query);
    }

    if (category) {
      console.log("category ->", category);
      await handleCategory(req, res, category);
    }

    if (price) {
      console.log("price ->", price);
      await handlePrice(req, res, price);
    }
  } catch (err) {
    //show error
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

const handleQuery = async (req, res, query) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: query,
        },
      },

      include: {
        category: true,
        images: true,
      },
    });

    res.send(products);
  } catch (err) {
    //show error

    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

const handlePrice = async (req, res, priceRange) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
      },

      include: {
        category: true,
        images: true,
      },
    });

    res.send(products);
  } catch (err) {
    //show error

    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

const handleCategory = async (req, res, categoryId) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId: {
          in: categoryId.map((id) => Number(id)),
        },
      },

      include: {
        category: true,
        images: true,
      },
    });

    res.send(products);
  } catch (err) {
    //show error

    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

//Product Image

exports.createImages = async (req, res) => {
  try {
    console.log(req.body);
    const result = await cloudinary.uploader.upload(req.body.image, {
      public_id: `${Date.now()}`,
      resource_type: "auto",
      folder: "BaekKrasop_ECommerce",
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    console.log(public_id);

    cloudinary.uploader.destroy(public_id, (result) => {
      res.json({ result });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send.json({ message: "Sever Error" });
  }
};
