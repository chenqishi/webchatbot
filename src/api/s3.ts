declare global {
  interface Window {
    AWS: any
  }
}
const AWS = window.AWS

import { loadConfig, getConfig } from '../config'
// AWS S3 配置（运行时加载）
let s3 
let s3Config 

export type FileType = 'image' | 'audio'

export interface UploadedFile {
  content: string // URL
  file_type: FileType
}

/**
 * 上传文件到 S3
 * @param file 文件对象
 * @param fileType 文件类型
 * @returns 上传后的文件信息
 */
export async function uploadFileToS3(file: File, fileType: FileType): Promise<UploadedFile> {
  try {
    if(!s3){
      await loadConfig()
      s3Config = getConfig().s3
      s3 = new AWS.S3({
        endpoint: s3Config.endpoint,
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
        region: s3Config.region,
        s3ForcePathStyle: s3Config.s3ForcePathStyle,
        signatureVersion: s3Config.signatureVersion
      })
    }
    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || ''
    const fileName = `${timestamp}_${randomStr}.${extension}`

    // const expireSeconds = 3600; 
    // const currentTime = Date.now(); 
    // const expireTimestamp = currentTime + expireSeconds * 1000; 
    // 上传参数
    const uploadParams = {
      Bucket: s3Config.bucketName,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      //Expires: new Date(expireTimestamp),
      ACL: 'public-read'
    }

    const result = await s3.upload(uploadParams).promise()
    
    // 生成预签名URL用于浏览
    const signedUrlParams = {
      Bucket: s3Config.bucketName,
      Key: fileName,
      Expires: 3600*24 // 有效期（秒）
    };
    
    const signedUrl = s3.getSignedUrl('getObject', signedUrlParams);
    console.log('图片浏览URL（24小时内有效）:', signedUrl);
    
   
    return {
      content: signedUrl,
      file_type: fileType
    }
  } catch (error: any) {
    throw new Error(`上传失败: ${error.message}`)
  }
}

/**
 * 获取文件类型
 */
export function getFileType(file: File): FileType {
  if (file.type.startsWith('image/')) {
    return 'image'
  } else if (file.type.startsWith('webm/')) {
    return 'audio'
  }
  throw new Error('不支持的文件类型')
}
