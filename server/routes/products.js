const express = require('express');
const { getProducts } = require('../../models/Product');
const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const products = await getProducts({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
})

module.exports = router;