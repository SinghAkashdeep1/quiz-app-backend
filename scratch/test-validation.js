const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testValidation() {
  try {
    // 1. Test MCQ with 2 options (should pass if I filter them, but wait, I didn't filter them in the controller, I just allowed them to exist in the array)
    console.log('Testing MCQ with 2 options...');
    const res1 = await axios.post(`${API_URL}/questions`, {
      categoryId: '65f0a1b2c3d4e5f6a7b8c9d0', // Fake ID
      type: 'mcq',
      text: 'Test Question',
      options: ['Option 1', 'Option 2', '', ''],
      correctAnswerIndex: 0,
      difficulty: 'easy'
    });
    console.log('MCQ 2 options: Success');
  } catch (err) {
    console.log('MCQ 2 options: Failed', err.response?.data);
  }

  try {
    // 2. Test Image Question without image (should fail)
    console.log('Testing Image Question without image...');
    const res2 = await axios.post(`${API_URL}/questions`, {
      categoryId: '65f0a1b2c3d4e5f6a7b8c9d0',
      type: 'image',
      text: 'Test Question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswerIndex: 0,
      imageUrl: ''
    });
    console.log('Image Question no image: Success (Unexpected)');
  } catch (err) {
    console.log('Image Question no image: Failed (Expected)', err.response?.data);
  }
}

testValidation();
