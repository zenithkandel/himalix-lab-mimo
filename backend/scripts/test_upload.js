const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const secret = process.env.JWT_SECRET || 'himalix_unified_secret_key_2026';
  const token = jwt.sign({ id: 1, email: 'admin@himalix.com', role: 'admin' }, secret, { expiresIn: '1h' });

  console.log('Generated Admin JWT Token:', token);

  // Create a dummy text file to act as our "image" (or a small 1x1 image blob)
  // Our fileFilter checks for extensions /jpeg|jpg|png|gif|webp/
  const dummyContent = 'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'; // 1x1 transparent gif
  const buffer = Buffer.from(dummyContent, 'binary');
  const blob = new Blob([buffer], { type: 'image/gif' });

  const formData = new FormData();
  formData.append('image', blob, 'test_image.gif');

  try {
    console.log('Sending upload request to http://localhost:5000/api/admin/upload...');
    const response = await fetch('http://localhost:5000/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);

    if (response.ok && data.url) {
      console.log('SUCCESS: File uploaded successfully!');
      // Verify that the file exists in the uploads directory
      const filePath = path.join(__dirname, '..', data.url);
      if (fs.existsSync(filePath)) {
        console.log(`SUCCESS: Uploaded file physically exists at ${filePath}`);
        // Clean up the uploaded test file
        fs.unlinkSync(filePath);
        console.log('Cleaned up uploaded test file.');
      } else {
        console.error(`ERROR: Uploaded file NOT found at expected path: ${filePath}`);
      }
    } else {
      console.error('ERROR: Upload request failed.');
    }
  } catch (err) {
    console.error('Request failed with error:', err);
  }
}

testUpload();
