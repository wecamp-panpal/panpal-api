const axios = require('axios');

// Cấu hình API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Test rate limiting với endpoint health check (không cần auth)
async function testRateLimit() {
  console.log('🚀 Bắt đầu test Rate Limiting...\n');
  
  // Test Short Term Limit (3 requests per second)
  console.log('📊 Test SHORT TERM LIMIT (3 requests/second):');
  console.log('Gửi 5 requests liên tiếp trong 1 giây...\n');
  
  const promises = [];
  for (let i = 1; i <= 5; i++) {
    promises.push(
      axios.get(`${API_BASE_URL}/health`)
        .then(response => {
          console.log(`✅ Request ${i}: ${response.status} - ${response.statusText}`);
          return { success: true, request: i, status: response.status };
        })
        .catch(error => {
          const status = error.response?.status || 'Network Error';
          const message = error.response?.statusText || error.message;
          console.log(`❌ Request ${i}: ${status} - ${message}`);
          return { success: false, request: i, status, message };
        })
    );
  }
  
  const results = await Promise.all(promises);
  
  // Phân tích kết quả
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📈 Kết quả SHORT TERM test:`);
  console.log(`   ✅ Thành công: ${successful}/5 requests`);
  console.log(`   ❌ Bị chặn: ${failed}/5 requests`);
  
  if (failed > 0) {
    console.log(`   🎯 Rate limiting hoạt động! Đã chặn ${failed} requests vượt quá limit`);
  } else {
    console.log(`   ⚠️  Không có requests bị chặn - có thể limit chưa kích hoạt`);
  }
  
  // Đợi reset
  console.log('\n⏳ Đợi 2 giây để reset rate limit...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test Medium Term Limit (20 requests per 10 seconds)
  console.log('\n📊 Test MEDIUM TERM LIMIT (20 requests/10 seconds):');
  console.log('Gửi 25 requests nhanh...\n');
  
  const mediumPromises = [];
  for (let i = 1; i <= 25; i++) {
    mediumPromises.push(
      axios.get(`${API_BASE_URL}/health`)
        .then(response => {
          console.log(`✅ Request ${i}: ${response.status}`);
          return { success: true, request: i };
        })
        .catch(error => {
          const status = error.response?.status || 'Network Error';
          console.log(`❌ Request ${i}: ${status} - Rate Limited`);
          return { success: false, request: i, status };
        })
    );
    
    // Thêm delay nhỏ để tránh overwhelm
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const mediumResults = await Promise.all(mediumPromises);
  
  const mediumSuccessful = mediumResults.filter(r => r.success).length;
  const mediumFailed = mediumResults.filter(r => !r.success).length;
  
  console.log(`\n📈 Kết quả MEDIUM TERM test:`);
  console.log(`   ✅ Thành công: ${mediumSuccessful}/25 requests`);
  console.log(`   ❌ Bị chặn: ${mediumFailed}/25 requests`);
  
  if (mediumFailed > 0) {
    console.log(`   🎯 Rate limiting hoạt động! Đã chặn ${mediumFailed} requests vượt quá limit`);
  }
}

// Test với endpoint khác nhau
async function testDifferentEndpoints() {
  console.log('\n🔄 Test rate limiting trên các endpoints khác nhau:');
  
  const endpoints = [
    '/health',
    '/users',
    '/recipes'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Test endpoint: ${endpoint}`);
    
    for (let i = 1; i <= 4; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        console.log(`   ✅ Request ${i}: ${response.status}`);
      } catch (error) {
        const status = error.response?.status || 'Error';
        const message = error.response?.data?.message || error.message;
        console.log(`   ❌ Request ${i}: ${status} - ${message}`);
      }
      
      // Delay nhỏ giữa các requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

// Chạy test
async function runTests() {
  try {
    // Kiểm tra server có đang chạy không
    console.log('🔍 Kiểm tra server...');
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server đang chạy tại http://localhost:3000\n');
    
    await testRateLimit();
    await testDifferentEndpoints();
    
    console.log('\n🎉 Hoàn thành test rate limiting!');
    console.log('\n📝 Lưu ý:');
    console.log('   - Rate limiting có thể cần thời gian để reset');
    console.log('   - Các giá trị limit có thể được config trong .env');
    console.log('   - Kiểm tra logs server để xem chi tiết');
    
  } catch (error) {
    console.error('❌ Lỗi kết nối server:', error.message);
    console.log('💡 Hãy đảm bảo server đang chạy tại http://localhost:3000');
  }
}

runTests();
