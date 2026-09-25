// Cloudinary direct unsigned upload helper
// To use Cloudinary:
// 1. Create a free account at https://cloudinary.com
// 2. Go to Settings > Upload > Add upload preset > set Signing Mode to "Unsigned"
// 3. Put your Cloud Name and Upload Preset in .env (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME.trim() && CLOUDINARY_UPLOAD_PRESET.trim()
)

/**
 * Upload a single File object to Cloudinary via unsigned upload preset
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<string>} secure_url of uploaded image
 */
export async function uploadImageToCloudinary(file, onProgress) {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    )
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'campuscart/products')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.secure_url) {
            resolve(data.secure_url)
          } else {
            reject(new Error('Cloudinary response missing secure_url'))
          }
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'))
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText)
          reject(new Error(errData.error?.message || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error during image upload to Cloudinary.'))
    }

    xhr.send(formData)
  })
}

/**
 * Convert a File into a temporary client-side data URL for instant previews
 * @param {File} file
 * @returns {Promise<string>}
 */
export function createLocalPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
