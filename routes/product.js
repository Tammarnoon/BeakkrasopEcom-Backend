const express = require("express");
const router = express.Router();
const {
  create,
  list,
  remove,
  listBy,
  searchFillter,
  update,
  read,
  createImages,
  removeImage,
} = require("../controllers/product");
const { authCheck, adminCheck } = require("../middlewares/authCheck");

router.post("/product", create);
router.get("/products/:count", list);
router.get("/product/:id", read);
router.put("/product/:id", update);
router.delete("/product/:id", remove);
router.post("/productby/", listBy);
router.post("/search/fillters", searchFillter);
router.post("/images", authCheck, adminCheck, createImages);
router.post("/removeimages", authCheck, adminCheck, removeImage);

module.exports = router;
