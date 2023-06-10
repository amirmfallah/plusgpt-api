const AWS = require("aws-sdk");
const URL_EXPIRATION_SECONDS = 300;

const config = {
  endpoint: process.env.LIARA_ENDPOINT,
  accessKeyId: process.env.LIARA_ACCESS_KEY,
  secretAccessKey: process.env.LIARA_SECRET_KEY,
  region: "default",
};
const s3Client = new AWS.S3(config);

module.exports = {
  getUploadURL: async (contentType, key) => {
    // Get signed URL from S3
    const s3Params = {
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: key,
      Expires: URL_EXPIRATION_SECONDS,
      ContentType: contentType,
    };
    const uploadURL = await s3Client.getSignedUrlPromise("putObject", s3Params);
    return {
      uploadURL: uploadURL,
      key,
    };
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
