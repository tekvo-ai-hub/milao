import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_URL = 'http://localhost:3001';

// Create a simple test audio file (sine wave)
function createTestAudio() {
  console.log('🎵 Creating test audio file...');
  
  // Create a simple WAV file with a sine wave
  const sampleRate = 16000;
  const duration = 3; // 3 seconds
  const frequency = 440; // A4 note
  const samples = sampleRate * duration;
  
  const audioData = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
  }
  
  // Convert to 16-bit PCM
  const pcmData = new Int16Array(samples);
  for (let i = 0; i < samples; i++) {
    pcmData[i] = Math.round(audioData[i] * 32767);
  }
  
  // Create WAV header
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  
  // Copy PCM data
  const pcmView = new Int16Array(buffer, 44);
  pcmView.set(pcmData);
  
  const testAudioPath = join(__dirname, 'test-audio.wav');
  fs.writeFileSync(testAudioPath, buffer);
  
  console.log('✅ Test audio file created:', testAudioPath);
  return testAudioPath;
}

async function testHealth() {
  try {
    console.log('\n🏥 Testing server health...');
    const response = await axios.get(`${SERVER_URL}/health`);
    console.log('✅ Server is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testAPIs() {
  try {
    console.log('\n🧪 Testing API connections...');
    const response = await axios.get(`${SERVER_URL}/test-apis`);
    console.log('✅ API test results:', JSON.stringify(response.data, null, 2));
    return response.data.results;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return null;
  }
}

async function testTranscription(audioPath) {
  console.log('\n🎤 Testing transcription APIs...');
  
  const apis = ['whisper', 'huggingface', 'coqui'];
  const results = {};
  
  for (const api of apis) {
    try {
      console.log(`\n📡 Testing ${api} transcription...`);
      
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioPath));
      
      const response = await axios.post(`${SERVER_URL}/transcribe/${api}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });
      
      if (response.data.success) {
        console.log(`✅ ${api} transcription successful:`, response.data.text);
        results[api] = { success: true, text: response.data.text };
      } else {
        console.log(`❌ ${api} transcription failed:`, response.data.error);
        results[api] = { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error(`❌ ${api} transcription error:`, error.message);
      results[api] = { success: false, error: error.message };
    }
  }
  
  return results;
}

async function testBatchTranscription(audioPath) {
  try {
    console.log('\n🔄 Testing batch transcription...');
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));
    
    const response = await axios.post(`${SERVER_URL}/transcribe/batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minutes for batch
    });
    
    if (response.data.success) {
      console.log('✅ Batch transcription results:', JSON.stringify(response.data.results, null, 2));
      return response.data.results;
    } else {
      console.error('❌ Batch transcription failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Batch transcription error:', error.message);
    return null;
  }
}

async function testTextAnalysis() {
  try {
    console.log('\n📝 Testing text analysis...');
    
    const testText = "I am very happy with the results of this speech analysis application!";
    
    const response = await axios.post(`${SERVER_URL}/analyze/text`, {
      text: testText
    });
    
    if (response.data.success) {
      console.log('✅ Text analysis successful:', JSON.stringify(response.data.analysis, null, 2));
      return response.data.analysis;
    } else {
      console.error('❌ Text analysis failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Text analysis error:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API tests...\n');
  
  // Test server health
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.error('❌ Server is not healthy. Please start the server first.');
    return;
  }
  
  // Test API connections
  const apiResults = await testAPIs();
  if (!apiResults) {
    console.error('❌ API connection tests failed.');
    return;
  }
  
  // Create test audio
  const audioPath = createTestAudio();
  
  // Test individual transcription APIs
  const transcriptionResults = await testTranscription(audioPath);
  
  // Test batch transcription
  const batchResults = await testBatchTranscription(audioPath);
  
  // Test text analysis
  const analysisResults = await testTextAnalysis();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('Health Check:', isHealthy ? '✅ PASS' : '❌ FAIL');
  console.log('API Connections:', apiResults ? '✅ PASS' : '❌ FAIL');
  console.log('Individual Transcription:', transcriptionResults ? '✅ PASS' : '❌ FAIL');
  console.log('Batch Transcription:', batchResults ? '✅ PASS' : '❌ FAIL');
  console.log('Text Analysis:', analysisResults ? '✅ PASS' : '❌ FAIL');
  
  // Clean up
  try {
    fs.unlinkSync(audioPath);
    console.log('\n🧹 Test audio file cleaned up');
  } catch (error) {
    console.log('\n⚠️ Could not clean up test audio file');
  }
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
} 