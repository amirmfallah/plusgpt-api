const mongoose = require("mongoose");

// add invoice details
const subSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    invoice: {
      type: Object,
      required: false,
    },
    current_period_start: {
      type: Date,
      required: false,
    },
    current_period_end: {
      type: Date,
      required: false,
    },
    current_usage: {
      type: Number,
      required: false,
      default: 0,
    },
    current_token_usage: {
      type: Number,
      required: false,
      default: 0,
    },
    active: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true }
);

const Subscription =
  mongoose.models.Subscription || mongoose.model("Subscription", subSchema);

module.exports = {
  saveSubscription: async (user, product, invoice) => {
    try {
      return await Subscription.create({
        user,
        product,
        invoice,
        active: false,
      });
    } catch (error) {
      console.error(error);
      return { prompt: "Error saving Subscription" };
    }
  },
  getSubscription: async (filter) => {
    try {
      return await Subscription.findOne(filter).populate("product").exec();
    } catch (error) {
      console.error(error);
      return { prompt: "Error getting Subscriptions" };
    }
  },
  getSubscriptions: async (filter) => {
    try {
      return await Subscription.find(filter).populate("product").exec();
    } catch (error) {
      console.error(error);
      return { prompt: "Error getting Subscription" };
    }
  },
  updateSubscription: async (filter, obj) => {
    try {
      return await Subscription.findOneAndUpdate(filter, obj);
    } catch (error) {
      console.error(error);
      return { prompt: "Error updating Subscription" };
    }
  },
  updateSubscriptionById: async (id, obj) => {
    try {
      return await Subscription.findByIdAndUpdate(id, obj)
        .populate("user")
        .exec();
    } catch (error) {
      console.error(error);
      return { prompt: "Error updating Subscription" };
    }
  },
};
