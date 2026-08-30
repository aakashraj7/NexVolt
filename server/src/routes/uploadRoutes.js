import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure Cloudinary if environment variables are available
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('[Cloudinary] Configured successfully for image uploads.');
} else {
  console.log('[Cloudinary] Keys not provided in server/.env yet. Using base64 preview fallback.');
}

// POST /api/upload - Upload an image (base64 or remote URL) to Cloudinary
router.post('/', async (req, res) => {
  try {
    const { image, folder = 'nexvolt_products' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data or URL is required' });
    }

    if (hasCloudinaryConfig) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      });

      return res.json({
        success: true,
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        format: uploadResponse.format,
        width: uploadResponse.width,
        height: uploadResponse.height
      });
    }

    // Fallback if Cloudinary credentials are not yet entered in .env
    // Returns the image data directly so the merchant can still use it immediately
    return res.json({
      success: true,
      url: image,
      isLocalFallback: true,
      message: 'Cloudinary API credentials pending in server/.env - using image preview directly'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
});

export default router;
