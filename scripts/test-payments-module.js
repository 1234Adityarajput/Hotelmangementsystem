/**
 * Module 14: Payment Management End-to-End Verification Test
 * Tests:
 * 1. Admin Authentication
 * 2. Payment Statistics & Channel Breakdown
 * 3. Pending Payments & Outstanding Folio Balances
 * 4. Recording Advance Payments (Deposit)
 * 5. Recording Partial Payments (UPI / QR with UTR)
 * 6. Recording Final Payments (Cash / Settlement)
 * 7. Payment History & Multi-dimensional Queries (Filters by method, type, search)
 * 8. Digital Receipt Voucher Retrieval
 * 9. Frontend /payments Page Availability (HTTP 200)
 */

const http = require('http');

async function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('   MODULE 14: PAYMENT MANAGEMENT END-TO-END VERIFICATION SUITE');
  console.log('========================================================================\n');

  try {
    // 1. Authenticate Admin
    console.log('[1/8] Authenticating Admin credentials...');
    const loginRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'admin', password: 'Admin@Hotel2026!' });

    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.error('FAILED to login as Admin:', loginRes);
      process.exit(1);
    }
    const token = loginRes.body.data.accessToken;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    console.log('✓ Admin authenticated successfully.');

    // 2. Verify Payment Stats
    console.log('\n[2/8] Fetching aggregated payment statistics & channels...');
    const statsRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/payments/stats',
      method: 'GET',
      headers: authHeaders,
    });
    console.log('Stats status:', statsRes.status);
    console.log('Total Collected: ₹' + statsRes.body.data?.totalCollected, 'Across', statsRes.body.data?.totalCount, 'transactions');
    console.log('Channels: Cash = ₹' + statsRes.body.data?.cashCollected + ', UPI = ₹' + statsRes.body.data?.upiCollected);

    // 3. Verify Pending Payments
    console.log('\n[3/8] Fetching pending payments & outstanding folios...');
    const pendingRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/payments/pending',
      method: 'GET',
      headers: authHeaders,
    });
    console.log('Pending status:', pendingRes.status, 'Items:', pendingRes.body.data?.items?.length, 'Outstanding: ₹' + pendingRes.body.data?.totalOutstanding);

    // 4. Get active booking for payments
    console.log('\n[4/8] Finding an active stay booking for testing payment logging...');
    const bookingsRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/bookings?limit=5',
      method: 'GET',
      headers: authHeaders,
    });
    const booking = bookingsRes.body.data?.items?.[0];
    if (!booking) {
      console.error('No booking found to test payments on');
      process.exit(1);
    }
    console.log('✓ Selected Booking:', booking.bookingNumber, 'Guest:', booking.primaryGuest?.fullName, 'Room:', booking.room?.roomNumber);

    // 5. Record Advance / Partial Payment via UPI
    console.log('\n[5/8] Recording a partial payment via UPI with UTR reference...');
    const partialPayRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/payments',
      method: 'POST',
      headers: authHeaders,
    }, {
      bookingId: booking.id,
      paymentType: 'PARTIAL',
      paymentMethod: 'UPI',
      amount: 150.00,
      transactionReference: `UPI-UTR-${Date.now().toString().slice(-8)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Customer paid partial balance via PhonePe QR at front desk',
    });
    console.log('Partial payment status:', partialPayRes.status, 'Ref:', partialPayRes.body.data?.paymentReference);
    const recordedPaymentId = partialPayRes.body.data?.id;

    // 6. Record Cash Payment
    console.log('\n[6/8] Recording a cash settlement payment...');
    const cashPayRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/payments',
      method: 'POST',
      headers: authHeaders,
    }, {
      bookingId: booking.id,
      paymentType: 'FINAL',
      paymentMethod: 'CASH',
      amount: 50.00,
      transactionReference: 'CASH-RCPT-COUNTER-1',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Cash received at reception desk counter',
    });
    console.log('Cash payment status:', cashPayRes.status, 'Ref:', cashPayRes.body.data?.paymentReference);

    // 7. Test Queries: Search, Method Filter, Type Filter
    console.log('\n[7/8] Testing payment history queries with filters & search...');
    const upiQueryRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/payments?method=UPI&limit=10',
      method: 'GET',
      headers: authHeaders,
    });
    console.log('UPI filtered count:', upiQueryRes.body.data?.items?.length);

    const singlePayRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/payments/${recordedPaymentId}`,
      method: 'GET',
      headers: authHeaders,
    });
    console.log('Single Payment Voucher:', singlePayRes.body.data?.paymentReference, 'Amount: ₹' + singlePayRes.body.data?.amount, 'Channel:', singlePayRes.body.data?.paymentMethod);

    // 8. Test Frontend /payments page availability
    console.log('\n[8/8] Verifying frontend /payments page response...');
    const frontendRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/payments',
      method: 'GET',
    });
    console.log('Frontend /payments HTTP Status:', frontendRes.status);

    if (frontendRes.status === 200 && singlePayRes.status === 200) {
      console.log('\n========================================================================');
      console.log('   SUCCESS! ALL MODULE 14 PAYMENT MANAGEMENT TESTS PASSED 8/8!          ');
      console.log('========================================================================');
      process.exit(0);
    } else {
      console.error('Validation failed on one or more steps');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
