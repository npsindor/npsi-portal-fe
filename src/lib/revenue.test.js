import assert from 'node:assert/strict';
import { test } from 'node:test';
import { awaitingCount, registrationFeesReceived, revenueOf } from './revenue.js';

// The test server's payments on 2026-11-22: ₹32,350 SUCCESS + ₹500 refund in process; a full refund and the
// pending / submitted ones don't count.
test('total revenue counts settled payments (SUCCESS and VERIFIED), less refunds actually sent', () => {
  const rows = [
    { paymentStatus: 'SUCCESS', amount: 32000 },
    { paymentStatus: 'SUCCESS', amount: '350.00' },
    { paymentStatus: 'VERIFIED', amount: 100 },
    { paymentStatus: 'REFUND_PROCESSING', amount: 500 },
    { paymentStatus: 'REFUNDED', amount: 500, refundAmount: 500 },
    { paymentStatus: 'REFUNDED', amount: 500, refundAmount: 200 },
    { paymentStatus: 'PENDING', amount: 1500 },
    { paymentStatus: 'SUBMITTED', amount: 600 },
    { paymentStatus: 'REJECTED', amount: 500 },
  ];
  assert.equal(revenueOf(rows), 32000 + 350 + 100 + 500 + 300);
  assert.equal(awaitingCount(rows), 2);
  assert.equal(revenueOf([]), 0);
  assert.equal(revenueOf([{ paymentStatus: 'verified', amount: '₹1,000' }]), 1000);
});

test('registration fees received: only family and student fees, by the same rule', () => {
  const rows = [
    { type: 'Family Registration', paymentStatus: 'VERIFIED', amount: 500 },
    { type: 'Student Registration', paymentStatus: 'VERIFIED', amount: 100 },
    { type: 'Family Registration', paymentStatus: 'SUBMITTED', amount: 500 },
    { type: 'Event Registration', paymentStatus: 'SUCCESS', amount: 250 },
  ];
  assert.equal(registrationFeesReceived(rows), 600);
  assert.equal(revenueOf(rows), 850);
});
