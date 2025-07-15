import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Import API services
import { LibreTranslateAPI } from './services/libreTranslate.js';
import { HuggingFaceAPI } from './services/huggingFace.js';
import { CoquiAPI } from './services/coqui.js';
import { WhisperAPI } from './services/whisper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.webm');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize API services
const libreTranslate = new LibreTranslateAPI();
const huggingFace = new HuggingFaceAPI();
const coqui = new CoquiAPI();
const whisper = new WhisperAPI();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    availableApis: [
      'libre-translate',
      'huggingface',
      'coqui',
      'whisper'
    ]
  });
});

// Test all APIs endpoint
app.get('/test-apis', async (req, res) => {
  try {
    const results = {
      libreTranslate: await libreTranslate.testConnection(),
      huggingFace: await huggingFace.testConnection(),
      coqui: await coqui.testConnection(),
      whisper: await whisper.testConnection()
    };
    
    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Speech-to-text endpoints
app.post('/transcribe/libre-translate', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const result = await libreTranslate.transcribe(req.file.path);
    res.json({
      success: true,
      text: result,
      api: 'libre-translate',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      api: 'libre-translate',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/transcribe/huggingface', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const result = await huggingFace.transcribe(req.file.path);
    res.json({
      success: true,
      text: result,
      api: 'huggingface',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      api: 'huggingface',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/transcribe/coqui', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const result = await coqui.transcribe(req.file.path);
    res.json({
      success: true,
      text: result,
      api: 'coqui',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      api: 'coqui',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/transcribe/whisper', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const result = await whisper.transcribe(req.file.path);
    res.json({
      success: true,
      text: result,
      api: 'whisper',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      api: 'whisper',
      timestamp: new Date().toISOString()
    });
  }
});

// Batch transcription with multiple APIs
app.post('/transcribe/batch', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const results = {
      libreTranslate: await libreTranslate.transcribe(req.file.path).catch(e => ({ error: e.message })),
      huggingFace: await huggingFace.transcribe(req.file.path).catch(e => ({ error: e.message })),
      coqui: await coqui.transcribe(req.file.path).catch(e => ({ error: e.message })),
      whisper: await whisper.transcribe(req.file.path).catch(e => ({ error: e.message }))
    };

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Text analysis endpoints
app.post('/analyze/text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const analysis = await huggingFace.analyzeText(text);
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test APIs: http://localhost:${PORT}/test-apis`);
  console.log(`🎤 Available transcription endpoints:`);
  console.log(`   - POST /transcribe/libre-translate`);
  console.log(`   - POST /transcribe/huggingface`);
  console.log(`   - POST /transcribe/coqui`);
  console.log(`   - POST /transcribe/whisper`);
  console.log(`   - POST /transcribe/batch (all APIs)`);
  console.log(`📝 Text analysis: POST /analyze/text`);
}); 