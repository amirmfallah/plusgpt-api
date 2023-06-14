const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    metadata: {
      type: Object,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = {
  getProductById: async (id) => {
    try {
      return await Product.findById(id).exec();
    } catch (error) {
      console.error(error);
      return { prompt: "Error getting product" };
    }
  },
  getProducts: async (filter) => {
    try {
      return await Product.find(filter).sort({ price: "asc" }).exec();
    } catch (error) {
      console.error(error);
      return { prompt: "Error getting products" };
    }
  },
  saveProduct: async (plan) => {
    try {
      return await Product.create(plan);
    } catch (error) {
      console.error(error);
      return { prompt: "Error saving products" };
    }
  },
  delete: async (filter) => {
    try {
      return await Product.deleteMany(filter);
    } catch (error) {
      console.error(error);
      return { prompt: "Error deleting products" };
    }
  },
};
