import { adminDb } from "./firebaseAdmin";

async function auditDatabase() {
  console.log("=== COMPREHENSIVE USER MANAGEMENT & LEDGER AUDIT ===");

  // 1. Fetch all users
  const usersSnap = await adminDb.collection("users").get();
  console.log(`Total users in system: ${usersSnap.docs.length}`);
  
  const users: any[] = [];
  usersSnap.forEach(d => users.push({ id: d.id, ...d.data() }));

  // 2. Fetch all SMS orders
  const smsOrdersSnap = await adminDb.collection("orders").get();
  console.log(`Total SMS orders in system: ${smsOrdersSnap.docs.length}`);
  const smsOrders: any[] = [];
  smsOrdersSnap.forEach(d => smsOrders.push({ id: d.id, ...d.data() }));

  // 3. Fetch all SMM orders
  const smmOrdersSnap = await adminDb.collection("smm_orders").get();
  console.log(`Total SMM orders in system: ${smmOrdersSnap.docs.length}`);
  const smmOrders: any[] = [];
  smmOrdersSnap.forEach(d => smmOrders.push({ id: d.id, ...d.data() }));

  // 4. Fetch all Subscription orders
  const subOrdersSnap = await adminDb.collection("subscription_orders").get();
  console.log(`Total Subscription orders in system: ${subOrdersSnap.docs.length}`);
  const subOrders: any[] = [];
  subOrdersSnap.forEach(d => subOrders.push({ id: d.id, ...d.data() }));

  // 5. Fetch all Deposits
  const depositsSnap = await adminDb.collection("deposits").get();
  console.log(`Total Deposits in system: ${depositsSnap.docs.length}`);
  const deposits: any[] = [];
  depositsSnap.forEach(d => deposits.push({ id: d.id, ...d.data() }));

  // 6. Fetch all Transactions
  const txsSnap = await adminDb.collection("transactions").get();
  console.log(`Total Ledger Transactions in system: ${txsSnap.docs.length}`);
  const txs: any[] = [];
  txsSnap.forEach(d => txs.push({ id: d.id, ...d.data() }));

  // Print sample structure of an SMS order
  if (smsOrders.length > 0) {
    console.log("\n--- Sample SMS Order Document ---");
    console.log(JSON.stringify(smsOrders[0], null, 2));
  }

  // Print sample structure of an SMM order
  if (smmOrders.length > 0) {
    console.log("\n--- Sample SMM Order Document ---");
    console.log(JSON.stringify(smmOrders[0], null, 2));
  }

  // Print sample structure of a Deposit
  if (deposits.length > 0) {
    console.log("\n--- Sample Deposit Document ---");
    console.log(JSON.stringify(deposits[0], null, 2));
  }

  // Print sample structure of a Transaction
  if (txs.length > 0) {
    console.log("\n--- Sample Transaction Document ---");
    console.log(JSON.stringify(txs[0], null, 2));
  }

  // Audit each user
  console.log("\n=== AUDITING ALL USER ACCOUNTS ===");
  for (const u of users) {
    const userSms = smsOrders.filter(o => o.userId === u.id || (o.username && o.username.toLowerCase() === (u.username || "").toLowerCase()));
    const userSmm = smmOrders.filter(o => o.userId === u.id || (o.username && o.username.toLowerCase() === (u.username || "").toLowerCase()));
    const userSubs = subOrders.filter(o => o.userId === u.id || (o.username && o.username.toLowerCase() === (u.username || "").toLowerCase()));
    const userDeps = deposits.filter(d => d.userId === u.id || (d.username && d.username.toLowerCase() === (u.username || "").toLowerCase()));
    const userTxs = txs.filter(t => t.userId === u.id || (t.username && t.username.toLowerCase() === (u.username || "").toLowerCase()));

    console.log(`\nUser: ${u.username || "UNKNOWN"} (ID: ${u.id}, Email: ${u.email})`);
    console.log(`  Balance: $${u.balance} USD`);
    console.log(`  SMS Orders: ${userSms.length}`);
    console.log(`  SMM Orders: ${userSmm.length}`);
    console.log(`  Subscription Orders: ${userSubs.length}`);
    console.log(`  Deposits: ${userDeps.length} (Approved: ${userDeps.filter(d => d.status === "APPROVED").length})`);
    console.log(`  Ledger Transactions: ${userTxs.length}`);

    // Check for Rs 0 SMS orders
    for (const ord of userSms) {
      console.log(`    SMS Order #${ord.id}: product=${ord.product}, price=${ord.price}, priceUsd=${ord.priceUsd}, charge=${ord.charge}, cost=${ord.cost}, status=${ord.status}`);
    }

    // Check for SMM orders
    for (const ord of userSmm) {
      console.log(`    SMM Order #${ord.id}: serviceId=${ord.serviceId}, charge=${ord.charge}, cost=${ord.cost}, status=${ord.status}`);
    }

    // Check for Transactions
    for (const t of userTxs) {
      console.log(`    Tx #${t.id}: type=${t.type}, amount=${t.amount}, amountUsd=${t.amountUsd}, pkrAmount=${t.pkrAmount}, service=${t.service || t.serviceType}, orderId=${t.orderId}`);
    }
  }

  process.exit(0);
}

auditDatabase().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
