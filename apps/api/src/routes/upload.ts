import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore - storage.config.js doesn't have type declarations
import { getTempUploadPath, ensureDirectoryExists } from '../shared/storage.config';

const router = Router();

// Ensure temp directory exists
const tempDir = getTempUploadPath();
ensureDirectoryExists(tempDir);

// Configure multer for temp uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Temp upload endpoint
router.post('/temp', upload.single('file'), (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Temp directory:', tempDir);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempPath = `@temp/${req.file.filename}`;
    
    console.log('File saved to:', req.file.path);
    console.log('Temp path:', tempPath);
    
    res.json({
      success: true,
      tempPath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      savedPath: req.file.path
    });
  } catch (error) {
    console.error('Temp upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Clean up old temp files (older than 24 hours)
router.post('/cleanup', (_req, res) => {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > oneDay) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    res.json({
      success: true,
      cleanedCount,
      message: `Cleaned up ${cleanedCount} old temp files`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

export default router;
