import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '@librechat/data-schemas';

let s3: S3Client | null = null;

/**
 * Supported cloud storage providers
 */
type CloudProvider = 'aws' | 'tencent' | 'aliyun' | 'minio' | 'custom';

/**
 * Detects the cloud provider based on the endpoint URL
 */
const detectCloudProvider = (endpoint?: string): CloudProvider => {
  if (!endpoint) {
    return 'aws';
  }

  const lowerEndpoint = endpoint.toLowerCase();
  if (lowerEndpoint.includes('myqcloud.com')) {
    return 'tencent';
  }
  if (lowerEndpoint.includes('aliyuncs.com')) {
    return 'aliyun';
  }
  if (lowerEndpoint.includes('minio')) {
    return 'minio';
  }
  return 'custom';
};

/**
 * Gets provider-specific configuration
 */
const getProviderConfig = (provider: CloudProvider) => {
  switch (provider) {
    case 'tencent':
      return {
        forcePathStyle: false, // 腾讯云 COS 支持虚拟托管风格
        useAccelerateEndpoint: false,
      };
    case 'aliyun':
      return {
        forcePathStyle: false, // 阿里云 OSS 支持虚拟托管风格
        useAccelerateEndpoint: false,
      };
    case 'minio':
      return {
        forcePathStyle: true, // MinIO 需要路径风格
        useAccelerateEndpoint: false,
      };
    case 'aws':
      return {
        forcePathStyle: false,
        useAccelerateEndpoint: false,
      };
    default:
      return {
        forcePathStyle: true, // 自定义端点默认使用路径风格
        useAccelerateEndpoint: false,
      };
  }
};

/**
 * Initializes and returns an instance of the AWS S3 client.
 *
 * Supports AWS S3 and S3-compatible services:
 * - AWS S3 (default)
 * - Tencent Cloud COS (腾讯云对象存储)
 * - Aliyun OSS (阿里云对象存储)
 * - MinIO
 * - Custom S3-compatible services
 *
 * Environment variables:
 * - AWS_REGION: Required. Region code (e.g., 'us-east-1', 'ap-guangzhou', 'oss-cn-hangzhou')
 * - AWS_ENDPOINT_URL: Optional. Custom endpoint URL
 *   - Tencent: https://cos.<region>.myqcloud.com
 *   - Aliyun: https://oss-<region>.aliyuncs.com
 * - AWS_ACCESS_KEY_ID: Access key (Tencent SecretId / Aliyun AccessKeyId)
 * - AWS_SECRET_ACCESS_KEY: Secret key (Tencent SecretKey / Aliyun AccessKeySecret)
 * - CLOUD_PROVIDER: Optional. Override auto-detection ('aws'|'tencent'|'aliyun'|'minio'|'custom')
 *
 * @returns An instance of S3Client if the region is provided; otherwise, null.
 */
export const initializeS3 = (): S3Client | null => {
  if (s3) {
    return s3;
  }

  const region = process.env.AWS_REGION;
  if (!region) {
    logger.error('[initializeS3] AWS_REGION is not set. Cannot initialize S3.');
    return null;
  }

  const endpoint = process.env.AWS_ENDPOINT_URL;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  // Detect or use specified cloud provider
  const provider =
    (process.env.CLOUD_PROVIDER as CloudProvider) || detectCloudProvider(endpoint);
  const providerConfig = getProviderConfig(provider);

  logger.info(`[initializeS3] Detected cloud provider: ${provider}`);

  const config = {
    region,
    ...(endpoint ? { endpoint } : {}),
    ...providerConfig,
  };

  if (accessKeyId && secretAccessKey) {
    s3 = new S3Client({
      ...config,
      credentials: { accessKeyId, secretAccessKey },
    });
    logger.info(`[initializeS3] S3 initialized with provided credentials for ${provider}.`);
  } else {
    // When using IRSA, credentials are automatically provided via the IAM Role attached to the ServiceAccount.
    s3 = new S3Client(config);
    logger.info(`[initializeS3] S3 initialized using default credentials (IRSA) for ${provider}.`);
  }

  return s3;
};
