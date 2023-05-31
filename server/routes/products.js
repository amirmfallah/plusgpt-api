const express = require("express");
const { getProducts } = require("../../models/Product");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const latest = process.env.PRODUCT_VERSION;
    const products = await getProducts({ version: latest });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
