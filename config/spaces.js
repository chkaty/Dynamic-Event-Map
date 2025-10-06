const AWS = require('aws-sdk');
const logger = require('../utils/logger');

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
});

async function uploadFile(fileBuffer, fileName, contentType) {
  const params = {
    Bucket: process.env.SPACES_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ACL: 'public-read',
    ContentType: contentType,
  };

  try {
    const data = await s3.upload(params).promise();
    logger.info(`File uploaded successfully: ${fileName}`);
    return data.Location;
  } catch (error) {
    logger.error('Error uploading file:', error);
    throw error;
  }
}

async function deleteFile(fileName) {
  const params = {
    Bucket: process.env.SPACES_BUCKET,
    Key: fileName,
  };

  try {
    await s3.deleteObject(params).promise();
    logger.info(`File deleted successfully: ${fileName}`);
    return true;
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw error;
  }
}

module.exports = {
  uploadFile,
  deleteFile,
};
