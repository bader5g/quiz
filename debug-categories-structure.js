// Test category structure for debugging
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testCategories() {
  try {
    console.log('🔍 Testing categories structure...');
    
    const categories = await makeRequest('/api/categories-with-children');
    console.log('📋 Categories structure:');
    console.log(JSON.stringify(categories, null, 2));
    
    // Test the specific case
    const islamicCategory = categories.find(c => c.code === 'islamic');
    console.log('\n🕌 Islamic category details:');
    console.log(JSON.stringify(islamicCategory, null, 2));
    
    if (islamicCategory && islamicCategory.children) {
      console.log(`\n📂 Islamic subcategories count: ${islamicCategory.children.length}`);
      islamicCategory.children.forEach((sub, index) => {
        console.log(`  ${index + 1}. ${sub.name} (ID: ${sub.subcategory_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCategories();
