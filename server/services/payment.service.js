const axios = require('axios');

const config = {
  apiKey: process.env.NEXT_PAY_API,
  baseURL: 'https://nextpay.org/nx/gateway'
};

module.exports = {
  getToken: async (subId, amount) => {
    try {
      const res = await axios.post(`${config.baseURL}/token`, {
        api_key: config.apiKey,
        order_id: subId,
        amount: amount,
        callback_uri: 'http://api.plusgpt.ir/api/payment/callback',
        currency: 'IRT',
        payer_name: 'پلاس GPT',
        payer_desc: 'دسترسی chatGPT از داخل ایران'
      });
      if (res.data?.code == -1) {
        return {
          uri: `${config.baseURL}/payment/${res.data?.trans_id}`,
          trans_id: res.data?.trans_id
        };
      }
      throw new Error(
        `getToken: Nextpay returned error code of ${res.data?.code} : ${JSON.stringify(res.data)}`
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  verifyTransaction: async (transId, amount) => {
    try {
      const res = await axios.post(`${config.baseURL}/verify`, {
        api_key: config.apiKey,
        trans_id: transId,
        amount: amount,
        currency: 'IRT'
      });

      // TODO: this return object is supposed to be invoice field in subscription doc
      if (res.data?.code == 0) {
        return res.data;
      }

      const error = new Error(
        `verify: Nextpay returned error code of ${res.data?.code} : ${JSON.stringify(res.data)}`
      );
      error.data = res.data;
      throw error;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
};
