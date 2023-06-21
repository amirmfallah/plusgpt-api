const AWS = require("aws-sdk");
const URL_EXPIRATION_SECONDS = 3000;

const config = {
  endpoint: process.env.LIARA_ENDPOINT,
  accessKeyId: process.env.LIARA_ACCESS_KEY,
  secretAccessKey: process.env.LIARA_SECRET_KEY,
  region: "default",
};
const s3Client = new AWS.S3(config);

module.exports = {
  getUploadURL: async (contentType, key, userId) => {
    // Get signed URL from S3
    const s3Params = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: key,
      Fields: {
        key: key, // totally random
      },
      Expires: URL_EXPIRATION_SECONDS,
      ContentType: contentType,
      Conditions: [
        ["content-length-range", 0, 1 * 1024 * 1024],
        ["eq", "$Content-Type", contentType],
        ["eq", "$x-amz-meta-userid", userId],
      ],
    };

    const res = await s3Client.createPresignedPost(s3Params);
    console.log({ ...res, Key: key });

    return { ...res, key: key };
    //   if (err) {
    //     console.error("Presigning post data encountered an error", err);
    //     throw err;
    //   }
    //   console.log(data);
    //   return data;
    // });
  },
  keyExists: async (key) => {
    const s3Params = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Prefix: key,
    };

    const objects = await s3Client.listObjectsV2(s3Params).promise();
    return objects;
  },
  getObject: async (key) => {
    const params = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: key,
    };

    const object = await s3Client.getObject(params).promise();
    return object;
  },
};
