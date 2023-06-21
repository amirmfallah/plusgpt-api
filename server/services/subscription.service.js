const { getSubscription, updateSubscription } = require("../../models");
const { getProductById } = require("../../models/Product");
const {
  saveSubscription,
  updateSubscriptionById,
  getSubscriptions,
} = require("../../models/Subscription");
const { getToken } = require("./payment.service");

module.exports = {
  buySubscription: async (user, planId) => {
    const plan = await getProductById(planId);
    if (plan.price == 0) {
      const activationCount = (
        await getSubscriptions({ user, product: planId })
      ).length;
      if (activationCount >= plan.metadata?.activation_allowed) {
        throw new Error(`Plan activation limit reached`);
      }
      const sub = await saveSubscription(user, planId, { free: true });
      await updateSubscriptionById(sub._id, {
        active: true,
      });
      return {
        uri: "/",
      };
    }

    const sub = await saveSubscription(user, planId, null);
    const payment = await getToken(sub._id.toString(), plan.price);

    await updateSubscriptionById(sub._id.toString(), {
      invoice: {
        trans_id: payment.trans_id,
      },
    });

    return payment;
  },
  hasActiveSubscription: async (user) => {
    const sub = await getSubscription({
      user: user,
      active: true,
    });

    if (!sub) {
      throw new Error("no_subscription");
    }

    if (
      sub.product.amount - sub.current_usage <= 0 ||
      sub.product.amountToken - sub.current_token_usage <= 0
    ) {
      await updateSubscription({ user, active: true }, { active: false });
      return false;
    }
    return true;
  },
  getActiveSubscription: async (user) => {
    const sub = await getSubscription({
      user: user,
      active: true,
    });
    return sub;
  },
  incUsage: async (user, tokenUsed) => {
    await updateSubscription(
      { user, active: true },
      {
        $inc: { current_usage: 1, current_token_usage: tokenUsed },
      }
    );
  },
};
