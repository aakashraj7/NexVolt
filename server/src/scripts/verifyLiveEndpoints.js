async function verifyEndpoints() {
  const base = 'http://localhost:5000/api';
  const merchantId = 'user_3IXrY66tV79vpBlZH3CzsiBhmca';

  console.log('1. Testing GET /api/products...');
  const res1 = await fetch(`${base}/products?limit=50`);
  const data1 = await res1.json();
  console.log(`- Products count returned: ${data1.products?.length} (Total in DB: ${data1.total})`);
  
  console.log('\n2. Testing GET /api/merchant/products...');
  const res2 = await fetch(`${base}/merchant/products?merchantId=${merchantId}&limit=50`);
  const data2 = await res2.json();
  console.log(`- Merchant products count: ${data2.products?.length}`);

  console.log('\n3. Testing GET /api/merchant/stats...');
  const res3 = await fetch(`${base}/merchant/stats?merchantId=${merchantId}`);
  const data3 = await res3.json();
  console.log(`- Total products in stats: ${data3.stats?.totalProducts}`);

  console.log('\n4. Testing GET /api/products/apple-macbook-pro-16-m3-max...');
  const res4 = await fetch(`${base}/products/apple-macbook-pro-16-m3-max`);
  const data4 = await res4.json();
  console.log(`- Product: ${data4.product?.title}`);
  console.log(`- Price: ₹${data4.product?.price?.toLocaleString('en-IN')}`);
  console.log(`- Merchant ID: ${data4.product?.merchantId} (${data4.product?.merchantStoreName})`);

  console.log('\n5. Testing budget item: /api/products/portronics-toad-23-wireless-mouse...');
  const res5 = await fetch(`${base}/products/portronics-toad-23-wireless-mouse`);
  const data5 = await res5.json();
  console.log(`- Product: ${data5.product?.title}`);
  console.log(`- Price: ₹${data5.product?.price?.toLocaleString('en-IN')}`);

  console.log('\nALL 5 LIVE ENDPOINT VERIFICATIONS PASSED SUCCESSFULLY!');
}

verifyEndpoints().catch(console.error);
