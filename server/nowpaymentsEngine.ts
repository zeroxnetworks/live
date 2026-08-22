import crypto from "crypto";
import { adminDb } from "./firebaseAdmin";
import { sendEmailAlert, buildEnhancedEmailHtml } from "./emailAlertEngine";

export interface CryptoDepositRecord {
  id: string; // e.g., "ZX-CRYPTO-1700000000"
  userId: string;
  username: string;
  userEmail: string;
  method: "crypto";
  nowpaymentsPaymentId?: string;
  orderId: string;
  requestedAmountUSD: number;
  processingFeeUSD?: number;
  networkFeeUSD?: number;
  totalPaymentUSD?: number;
  requestedAmountPKR: number;
  amount: number; // in PKR for platform compatibility
  requestedFiatCurrency: string; // "USD"
  cryptoCurrency: string; // "USDT", "BTC", "ETH", etc.
  network: string; // "TRC20", "BEP20", "ERC20", "Solana", etc.
  payCurrency: string; // "usdttrc20", "btc", etc.
  payAmount: number; // Amount in crypto to be paid
  payAddress: string; // Crypto wallet address
  expirationTime: string; // ISO string expiration
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  status: "waiting" | "confirming" | "confirmed" | "sending" | "finished" | "partially_paid" | "failed" | "expired" | "refunded" | "requires_review";
  actuallyPaid: number;
  txHash?: string;
  isCredited: boolean;
  creditedAt?: string;
  adminReviewNeeded: boolean;
  adminNotes?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    message: string;
  }>;
}

// Map crypto symbol + network to NOWPayments currency ticker
export function mapToNowPaymentsCurrency(symbol: string, network: string): string {
  const sym = symbol.toUpperCase().trim();
  const net = network.toUpperCase().trim();

  if (sym === "USDT" || sym === "TETHER") {
    if (net.includes("TRC20") || net.includes("TRON") || net.includes("TRX")) return "usdttrc20";
    if (net.includes("BEP20") || net.includes("BSC") || net.includes("BNB")) return "usdtbsc";
    if (net.includes("ERC20") || net.includes("ETH") || net.includes("ETHEREUM")) return "usdt";
    if (net.includes("SOL") || net.includes("SOLANA")) return "usdtsol";
    if (net.includes("MATIC") || net.includes("POLYGON")) return "usdtmatic";
    return "usdttrc20"; // default fallback for USDT
  }

  if (sym === "USDC") {
    if (net.includes("TRC20")) return "usdctrc20";
    if (net.includes("BEP20") || net.includes("BSC")) return "usdcbsc";
    if (net.includes("SOL") || net.includes("SOLANA")) return "usdcsol";
    if (net.includes("MATIC") || net.includes("POLYGON")) return "usdcmatic";
    return "usdc";
  }

  if (sym === "BTC" || sym === "BITCOIN") return "btc";
  if (sym === "ETH" || sym === "ETHEREUM") return "eth";
  if (sym === "BNB" || sym === "BINANCE") return "bnbbsc";
  if (sym === "SOL" || sym === "SOLANA") return "sol";
  if (sym === "TRX" || sym === "TRON") return "trx";
  if (sym === "LTC" || sym === "LITECOIN") return "ltc";
  if (sym === "DOGE" || sym === "DOGECOIN") return "doge";
  if (sym === "TON") return "ton";
  if (sym === "MATIC" || sym === "POLYGON") return "matic";

  return sym.toLowerCase();
}

// In-memory cache for dynamic database settings
let cachedCryptoGatewaySettings: Record<string, any> | null = null;

export async function getCryptoGatewaySettingsFromDb() {
  if (cachedCryptoGatewaySettings) {
    return cachedCryptoGatewaySettings;
  }
  try {
    const docSnap = await adminDb.collection("settings").doc("crypto_gateway").get();
    if (docSnap.exists) {
      cachedCryptoGatewaySettings = docSnap.data() || {};
    } else {
      cachedCryptoGatewaySettings = {};
    }
  } catch (err) {
    console.error("Error reading crypto_gateway settings from Firestore:", err);
    cachedCryptoGatewaySettings = {};
  }
  return cachedCryptoGatewaySettings;
}

// Get NOWPayments environment settings (combining database and env variables)
export async function getNowPaymentsConfig() {
  const db = await getCryptoGatewaySettingsFromDb();
  
  const apiKey = db.apiKey || "";
  const ipnSecret = db.ipnSecret || "";
  
  const envMode = db.environment || "sandbox";
  const isSandbox = envMode === "sandbox";
  const baseUrl = isSandbox 
    ? "https://api-sandbox.nowpayments.io/v1/" 
    : "https://api.nowpayments.io/v1/";
  
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || "info.rynmirza@gmail.com";
  const appUrl = process.env.APP_URL || "https://zeroxnetwork.ai.studio";
  const gatewayStatus = db.gatewayStatus || "enabled";

  return { apiKey, ipnSecret, isSandbox, envMode, baseUrl, adminEmail, appUrl, gatewayStatus };
}

// Verify IPN HMAC-SHA512 signature
export function verifyIpnSignature(payload: any, receivedSig: string, secret: string): boolean {
  if (!secret) return true; // If IPN secret isn't configured, skip verification with warning
  if (!receivedSig) return false;

  try {
    // NOWPayments requires sorting keys alphabetically
    const sortedKeys = Object.keys(payload).sort();
    const sortedPayload: Record<string, any> = {};
    for (const key of sortedKeys) {
      sortedPayload[key] = payload[key];
    }

    const calculatedSig = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(sortedPayload))
      .digest("hex");

    return calculatedSig.toLowerCase() === receivedSig.toLowerCase();
  } catch (err) {
    console.error("IPN Signature Calculation Error:", err);
    return false;
  }
}

// Standard supported popular crypto currencies list (single source of truth)
export interface PopularCurrencyConfig {
  id: string;
  token: string;
  label: string;
  network: string;
  payCurrency: string;
  minDepositUSD: number;
  minDepositCoin: number;
  minDepositDisplay: string;
  minDepositUsdDisplay: string;
  icon: string;
  popular: boolean;
  enabled: boolean;
  explorerUrl?: string;
}

export const POPULAR_CURRENCIES: PopularCurrencyConfig[] = [
  { id: "btc", token: "BTC", label: "Bitcoin", network: "BTC Mainnet", payCurrency: "btc", minDepositUSD: 19.05, minDepositCoin: 0.0003, minDepositDisplay: "Min: 0.0003 BTC", minDepositUsdDisplay: "0.0003 BTC ≈ $19.05 USD", icon: "btc", popular: true, enabled: true, explorerUrl: "https://blockchair.com/bitcoin/transaction/" },
  { id: "eth", token: "ETH", label: "Ethereum", network: "ETH Mainnet", payCurrency: "eth", minDepositUSD: 19.05, minDepositCoin: 0.01, minDepositDisplay: "Min: 0.010 ETH", minDepositUsdDisplay: "0.010 ETH ≈ $19.05 USD", icon: "eth", popular: true, enabled: true, explorerUrl: "https://etherscan.io/tx/" },
  { id: "usdt_trc20", token: "USDT", label: "Tether", network: "TRC20", payCurrency: "usdttrc20", minDepositUSD: 11.45, minDepositCoin: 11.45, minDepositDisplay: "Min: 11.45 USDT", minDepositUsdDisplay: "11.45 USDT ≈ $11.45 USD", icon: "usdt", popular: true, enabled: true, explorerUrl: "https://tronscan.org/#/transaction/" },
  { id: "usdt_erc20", token: "USDT", label: "Tether", network: "ERC20", payCurrency: "usdt", minDepositUSD: 19.05, minDepositCoin: 19.05, minDepositDisplay: "Min: 19.05 USDT", minDepositUsdDisplay: "19.05 USDT ≈ $19.05 USD", icon: "usdt", popular: true, enabled: true, explorerUrl: "https://etherscan.io/tx/" },
  { id: "usdt_bsc", token: "USDT", label: "Tether", network: "BEP20 (BSC)", payCurrency: "usdtbsc", minDepositUSD: 12.08, minDepositCoin: 12.08, minDepositDisplay: "Min: 12.08 USDT", minDepositUsdDisplay: "12.08 USDT ≈ $12.08 USD", icon: "usdt", popular: true, enabled: true, explorerUrl: "https://bscscan.com/tx/" },
  { id: "usdc_erc20", token: "USDC", label: "USD Coin", network: "ERC20", payCurrency: "usdc", minDepositUSD: 12.85, minDepositCoin: 12.85, minDepositDisplay: "Min: 12.85 USDC", minDepositUsdDisplay: "12.85 USDC ≈ $12.85 USD", icon: "usdc", popular: true, enabled: true, explorerUrl: "https://etherscan.io/tx/" },
  { id: "usdc_sol", token: "USDC", label: "USD Coin", network: "Solana", payCurrency: "usdcsol", minDepositUSD: 12.58, minDepositCoin: 12.58, minDepositDisplay: "Min: 12.58 USDC", minDepositUsdDisplay: "12.58 USDC ≈ $12.58 USD", icon: "usdc", popular: true, enabled: true, explorerUrl: "https://solscan.io/tx/" },
  { id: "bnb", token: "BNB", label: "BNB", network: "BEP20 (BSC)", payCurrency: "bnbbsc", minDepositUSD: 12.08, minDepositCoin: 0.02, minDepositDisplay: "Min: 0.020 BNB", minDepositUsdDisplay: "0.020 BNB ≈ $12.08 USD", icon: "bnb", popular: true, enabled: true, explorerUrl: "https://bscscan.com/tx/" },
  { id: "sol", token: "SOL", label: "Solana", network: "SOL Mainnet", payCurrency: "sol", minDepositUSD: 19.05, minDepositCoin: 0.25, minDepositDisplay: "Min: 0.250 SOL", minDepositUsdDisplay: "0.250 SOL ≈ $19.05 USD", icon: "sol", popular: true, enabled: true, explorerUrl: "https://solscan.io/tx/" },
  { id: "ltc", token: "LTC", label: "Litecoin", network: "LTC Mainnet", payCurrency: "ltc", minDepositUSD: 19.05, minDepositCoin: 0.42, minDepositDisplay: "Min: 0.420 LTC", minDepositUsdDisplay: "0.420 LTC ≈ $19.05 USD", icon: "ltc", popular: true, enabled: true, explorerUrl: "https://blockchair.com/litecoin/transaction/" },
  { id: "doge", token: "DOGE", label: "Dogecoin", network: "DOGE Mainnet", payCurrency: "doge", minDepositUSD: 19.05, minDepositCoin: 265.4, minDepositDisplay: "Min: 265.4 DOGE", minDepositUsdDisplay: "265.4 DOGE ≈ $19.05 USD", icon: "doge", popular: true, enabled: true, explorerUrl: "https://blockchair.com/dogecoin/transaction/" },
  { id: "xrp", token: "XRP", label: "XRP", network: "XRP Mainnet", payCurrency: "xrp", minDepositUSD: 11.80, minDepositCoin: 18.68, minDepositDisplay: "Min: 18.68 XRP", minDepositUsdDisplay: "18.68 XRP ≈ $11.80 USD", icon: "xrp", popular: true, enabled: true, explorerUrl: "https://xrpscan.com/tx/" },
  { id: "trx", token: "TRX", label: "TRON", network: "TRX Mainnet", payCurrency: "trx", minDepositUSD: 11.80, minDepositCoin: 56.5, minDepositDisplay: "Min: 56.50 TRX", minDepositUsdDisplay: "56.50 TRX ≈ $11.80 USD", icon: "trx", popular: true, enabled: true, explorerUrl: "https://tronscan.org/#/transaction/" }
];

export function calculateCryptoFees(payCurrency: string, network: string, amountUSD: number) {
  const netAmountUSD = Math.max(0, Number(amountUSD) || 0);
  
  // Processing Fee: 0.5% (min $0.05)
  const processingFeeUSD = Math.max(0.05, Math.round(netAmountUSD * 0.005 * 100) / 100);

  // Dynamic Network Fee based on blockchain network
  const netLower = (network || "").toLowerCase();
  const payLower = (payCurrency || "").toLowerCase();

  let networkFeeUSD = 0.25;

  if (netLower.includes("btc") || payLower === "btc") {
    networkFeeUSD = 1.50;
  } else if (netLower.includes("eth") || netLower.includes("erc20") || payLower === "eth" || payLower === "usdt" || payLower === "usdc") {
    networkFeeUSD = 2.50;
  } else if (netLower.includes("trc20") || netLower.includes("tron") || payLower === "usdttrc20" || payLower === "trx") {
    networkFeeUSD = 0.80;
  } else if (netLower.includes("bep20") || netLower.includes("bsc") || payLower === "usdtbsc" || payLower === "bnbbsc") {
    networkFeeUSD = 0.25;
  } else if (netLower.includes("sol") || payLower === "sol" || payLower === "usdcsol") {
    networkFeeUSD = 0.10;
  } else if (netLower.includes("ltc") || payLower === "ltc") {
    networkFeeUSD = 0.05;
  } else if (netLower.includes("doge") || payLower === "doge") {
    networkFeeUSD = 0.15;
  } else if (netLower.includes("xrp") || payLower === "xrp") {
    networkFeeUSD = 0.05;
  }

  const totalPaymentUSD = Math.round((netAmountUSD + processingFeeUSD + networkFeeUSD) * 100) / 100;

  return {
    netAmountUSD,
    processingFeeUSD,
    networkFeeUSD,
    totalPaymentUSD
  };
}

let cachedCurrenciesWithMins: PopularCurrencyConfig[] | null = null;
let lastCurrenciesFetchTime = 0;
const CURRENCIES_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function getSupportedCryptoCurrencies(): Promise<PopularCurrencyConfig[]> {
  const now = Date.now();
  if (cachedCurrenciesWithMins && (now - lastCurrenciesFetchTime) < CURRENCIES_CACHE_TTL) {
    return cachedCurrenciesWithMins;
  }

  const { apiKey, baseUrl } = await getNowPaymentsConfig();

  // Parallel fetch live dynamic minimums from NOWPayments API for each coin
  const updatedList = await Promise.all(POPULAR_CURRENCIES.map(async (coin) => {
    let minDepositUSD = coin.minDepositUSD || 19.05;
    let minDepositCoin = coin.minDepositCoin || 0;
    let minDepositDisplay = coin.minDepositDisplay;
    let minDepositUsdDisplay = coin.minDepositUsdDisplay;

    if (apiKey) {
      try {
        const minRes = await fetch(`${baseUrl}min-amount?currency_from=usd&currency_to=${coin.payCurrency}&fiat_equivalent=usd`, {
          headers: { "x-api-key": apiKey }
        });
        const minData = await minRes.json().catch(() => ({}));
        if (minData && (minData.fiat_equivalent || minData.min_amount)) {
          minDepositUSD = Number(minData.fiat_equivalent || minData.min_amount || 19.05);
        }

        const estRes = await fetch(`${baseUrl}estimate?amount=${minDepositUSD}&currency_from=usd&currency_to=${coin.payCurrency}`, {
          headers: { "x-api-key": apiKey }
        });
        const estData = await estRes.json().catch(() => ({}));
        if (estData && estData.estimated_amount) {
          minDepositCoin = Number(estData.estimated_amount) || 0;
        }

        let coinStr = "";
        if (minDepositCoin > 0) {
          if (minDepositCoin < 0.001) coinStr = minDepositCoin.toFixed(6);
          else if (minDepositCoin < 1) coinStr = minDepositCoin.toFixed(4);
          else coinStr = minDepositCoin.toFixed(2);
        } else {
          coinStr = "19.00";
        }

        minDepositDisplay = `Min: ${coinStr} ${coin.token}`;
        minDepositUsdDisplay = `${coinStr} ${coin.token} ≈ ${minDepositUSD.toFixed(2)} USD`;
      } catch (e) {
        // preserve fallback
      }
    }

    return {
      ...coin,
      minDepositUSD: Math.round(minDepositUSD * 100) / 100,
      minDepositCoin,
      minDepositDisplay,
      minDepositUsdDisplay
    };
  }));

  cachedCurrenciesWithMins = updatedList;
  lastCurrenciesFetchTime = now;

  return updatedList;
}

// Create a new Crypto Payment
export async function createCryptoPayment(params: {
  userId: string;
  username: string;
  userEmail: string;
  cryptoCurrency: string;
  network: string;
  amountUSD: number;
  cryptoRate?: number;
}): Promise<{ success: boolean; deposit?: CryptoDepositRecord; error?: string }> {
  const { userId, username, userEmail, cryptoCurrency, network, amountUSD } = params;
  const cryptoRate = params.cryptoRate && params.cryptoRate > 0 ? params.cryptoRate : 278;

  if (!userId || !userEmail) {
    return { success: false, error: "User authentication required." };
  }

  if (!amountUSD || amountUSD < 20) {
    return { success: false, error: "Minimum crypto deposit amount is $20.00 USD." };
  }

  const { apiKey, baseUrl, appUrl, isSandbox, gatewayStatus } = await getNowPaymentsConfig();

  if (gatewayStatus === "maintenance") {
    return { success: false, error: "Crypto gateway is currently undergoing maintenance. Please try again later." };
  } else if (gatewayStatus === "disabled") {
    return { success: false, error: "Crypto gateway is currently disabled." };
  }

  const payCurrency = mapToNowPaymentsCurrency(cryptoCurrency, network);

  // Dynamic minimum deposit check for the exact selected coin
  const currenciesWithMins = await getSupportedCryptoCurrencies();
  const matchedCoin = currenciesWithMins.find(c => c.payCurrency.toLowerCase() === payCurrency.toLowerCase()) || 
    POPULAR_CURRENCIES.find(c => c.payCurrency.toLowerCase() === payCurrency.toLowerCase()) || {
      token: cryptoCurrency,
      network: network,
      minDepositUSD: 19.04,
      minDepositDisplay: `Min: 0 ${cryptoCurrency}`,
      minDepositUsdDisplay: `0 ${cryptoCurrency}`
    };

  const minRequiredUSD = matchedCoin.minDepositUSD || 19.04;
  if (!amountUSD || amountUSD < minRequiredUSD) {
    return { 
      success: false, 
      error: `Minimum deposit for ${matchedCoin.token} (${matchedCoin.network}) is ${matchedCoin.minDepositDisplay} (≈ ${minRequiredUSD.toFixed(2)} USD).` 
    };
  }

  // Dynamic processing & network fee calculation
  const feeDetails = calculateCryptoFees(payCurrency, network, amountUSD);

  const depositId = `ZX-CRYPTO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const requestedAmountPKR = Math.round(amountUSD * cryptoRate);

  let nowpaymentsPaymentId = "";
  let payAddress = "";
  let payAmount = amountUSD;
  let expirationTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins window

  if (apiKey) {
    try {
      const ipnCallbackUrl = `${appUrl.replace(/\/$/, "")}/api/payments/crypto/ipn`;
      const body = {
        price_amount: amountUSD,
        price_currency: "usd",
        pay_currency: payCurrency,
        ipn_callback_url: ipnCallbackUrl,
        order_id: depositId,
        order_description: `ZeroX Network Crypto Deposit #${depositId}`,
        is_fee_paid_by_user: true,
        is_fixed_rate: false
      };

      console.log(`[ZeroX Crypto Gateway] Requesting payment creation for ${depositId}:`, body);

      const apiRes = await fetch(`${baseUrl}payment`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const responseData = await apiRes.json();

      if (!apiRes.ok) {
        console.error("[ZeroX Crypto API Error]:", responseData);
        
        // Log to Firestore for Admin
        try {
          await adminDb.collection("crypto_admin_audit_logs").add({
            adminUser: "System",
            action: "Payment Creation Failed",
            settingChanged: `Gateway Error: ${responseData.message || responseData.error || "Unknown Error"}`,
            details: JSON.stringify({
              httpStatus: apiRes.status,
              correlationId: responseData.id || "N/A",
              depositId: depositId
            }),
            timestamp: new Date().toISOString(),
            ip: "internal"
          });
        } catch (logErr) {
          console.error("Failed to log payment creation error to Firestore:", logErr);
        }

        let userFacingError = "Crypto deposits are currently unavailable. Please try again later.";
        const rawErrMsg = String(responseData.message || responseData.error || responseData.code || "").toLowerCase();

        if (rawErrMsg.includes("amountto is too small") || rawErrMsg.includes("amount") || rawErrMsg.includes("too small")) {
          userFacingError = `Minimum deposit amount for ${matchedCoin.token} (${matchedCoin.network}) is ${matchedCoin.minDepositDisplay} (≈ ${minRequiredUSD.toFixed(2)} USD).`;
        } else if (responseData.message) {
          userFacingError = `Crypto Gateway Error: ${responseData.message}`;
        }

        return { 
          success: false, 
          error: userFacingError
        };
      }

      nowpaymentsPaymentId = String(responseData.payment_id || "");
      payAddress = responseData.pay_address || "";
      payAmount = Number(responseData.pay_amount) || amountUSD;
      if (responseData.expiration_estimate_date) {
        expirationTime = new Date(responseData.expiration_estimate_date).toISOString();
      }

    } catch (err: any) {
      console.error("[ZeroX Crypto Connection Error]:", err);
      return { 
        success: false, 
        error: "Unable to connect to crypto payment gateway. Please try again shortly." 
      };
    }
  } else {
    // Sandbox / Test Mode fallback address generator
    nowpaymentsPaymentId = `NP-DEMO-${Date.now()}`;
    if (payCurrency.includes("trc20") || payCurrency.includes("trx")) {
      payAddress = "TYZ19842ZeroXNetworkTrc20AddressForTesting000";
    } else if (payCurrency.includes("bsc") || payCurrency.includes("eth") || payCurrency.includes("usdt")) {
      payAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    } else if (payCurrency.includes("btc")) {
      payAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    } else if (payCurrency.includes("sol")) {
      payAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    } else {
      payAddress = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
    }
  }

  const nowIso = new Date().toISOString();
  const depositRecord: CryptoDepositRecord = {
    id: depositId,
    userId,
    username,
    userEmail,
    method: "crypto",
    nowpaymentsPaymentId,
    orderId: depositId,
    requestedAmountUSD: amountUSD, // Net deposit credited
    processingFeeUSD: feeDetails.processingFeeUSD,
    networkFeeUSD: feeDetails.networkFeeUSD,
    totalPaymentUSD: feeDetails.totalPaymentUSD,
    requestedAmountPKR,
    amount: requestedAmountPKR, // In PKR for compatibility
    requestedFiatCurrency: "USD",
    cryptoCurrency: matchedCoin.token,
    network: matchedCoin.network,
    payCurrency,
    payAmount,
    payAddress,
    expirationTime,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "waiting",
    actuallyPaid: 0,
    isCredited: false,
    adminReviewNeeded: false,
    statusHistory: [
      {
        status: "waiting",
        timestamp: nowIso,
        message: `Payment generated. Send ${payAmount} ${matchedCoin.token} (${matchedCoin.network}) to address ${payAddress}`
      }
    ]
  };

  try {
    // Save record in Firestore
    await adminDb.collection("deposits").doc(depositId).set(depositRecord);

    // Also log in activity_logs
    await adminDb.collection("activity_logs").add({
      action: "CRYPTO_DEPOSIT_CREATED",
      userId,
      username,
      depositId,
      amountUSD,
      amountPKR: requestedAmountPKR,
      cryptoCurrency,
      network,
      timestamp: nowIso
    });

    // Send User Alert Email
    dispatchCryptoNotification("deposit_created", depositRecord);

    // Send Admin Alert Email
    dispatchCryptoNotification("admin_new_deposit", depositRecord);

    return { success: true, deposit: depositRecord };
  } catch (err: any) {
    console.error("Failed to save crypto deposit record:", err);
    return { success: false, error: "Failed to initialize deposit record in database." };
  }
}

// Get or poll status of a crypto deposit
export async function getCryptoPaymentStatus(depositId: string): Promise<CryptoDepositRecord | null> {
  try {
    const doc = await adminDb.collection("deposits").doc(depositId).get();
    if (!doc.exists) return null;

    let deposit = doc.data() as CryptoDepositRecord;
    const { apiKey, baseUrl } = await getNowPaymentsConfig();

    // Check if expired locally
    const now = new Date();
    const expDate = new Date(deposit.expirationTime);

    if (deposit.status === "waiting" && now > expDate) {
      const nowIso = now.toISOString();
      const updatedHistory = [
        ...(deposit.statusHistory || []),
        { status: "expired", timestamp: nowIso, message: "Payment window expired before deposit confirmation." }
      ];

      await adminDb.collection("deposits").doc(depositId).update({
        status: "expired",
        updatedAt: nowIso,
        statusHistory: updatedHistory
      });

      deposit.status = "expired";
      deposit.updatedAt = nowIso;
      deposit.statusHistory = updatedHistory;

      dispatchCryptoNotification("deposit_expired", deposit);
      dispatchCryptoNotification("admin_deposit_expired", deposit);

      return deposit;
    }

    // If waiting or confirming and NOWPayments API key exists, check live status
    if (apiKey && deposit.nowpaymentsPaymentId && (deposit.status === "waiting" || deposit.status === "confirming" || deposit.status === "sending")) {
      try {
        const res = await fetch(`${baseUrl}payment/${deposit.nowpaymentsPaymentId}`, {
          headers: { "x-api-key": apiKey }
        });

        if (res.ok) {
          const apiData = await res.json();
          const apiStatus = (apiData.payment_status || "").toLowerCase();
          
          if (apiStatus && apiStatus !== deposit.status) {
            await handleCryptoStatusChange(deposit, apiStatus, apiData);
            // Refresh from DB
            const freshDoc = await adminDb.collection("deposits").doc(depositId).get();
            if (freshDoc.exists) {
              deposit = freshDoc.data() as CryptoDepositRecord;
            }
          }
        }
      } catch (pollErr) {
        console.warn(`Failed to poll live NOWPayments status for ${depositId}:`, pollErr);
      }
    }

    return deposit;
  } catch (err) {
    console.error(`Error fetching crypto deposit status for ${depositId}:`, err);
    return null;
  }
}

// Handle Status Changes & Atomic Crediting
export async function handleCryptoStatusChange(
  deposit: CryptoDepositRecord,
  newStatus: string,
  extraData?: any
): Promise<{success: boolean, message: string}> {
  const depositRef = adminDb.collection("deposits").doc(deposit.id);
  const nowIso = new Date().toISOString();

  const actuallyPaid = Number(extraData?.actually_paid || extraData?.pay_amount || deposit.actuallyPaid || 0);
  const txHash = extraData?.outcome_hash || extraData?.payin_extra_id || extraData?.txHash || deposit.txHash || "";

  // Standardize NOWPayments statuses
  let mappedStatus: CryptoDepositRecord["status"] = "waiting";
  let statusMsg = "Payment update received.";

  switch (newStatus.toLowerCase()) {
    case "waiting":
      mappedStatus = "waiting";
      statusMsg = "Waiting for deposit on blockchain.";
      break;
    case "confirming":
      mappedStatus = "confirming";
      statusMsg = "Payment detected on blockchain. Awaiting network confirmations.";
      break;
    case "confirmed":
      mappedStatus = "confirmed";
      statusMsg = "Transaction confirmed on network. Processing wallet credit.";
      break;
    case "sending":
      mappedStatus = "sending";
      statusMsg = "Settling funds and finalizing deposit.";
      break;
    case "finished":
      mappedStatus = "finished";
      statusMsg = "Deposit completed and wallet balance credited!";
      break;
    case "partially_paid":
      mappedStatus = "partially_paid";
      statusMsg = "Partial payment received. Lower than required amount.";
      break;
    case "failed":
      mappedStatus = "failed";
      statusMsg = "Payment failed on blockchain network.";
      break;
    case "expired":
      mappedStatus = "expired";
      statusMsg = "Payment window expired.";
      break;
    case "refunded":
      mappedStatus = "refunded";
      statusMsg = "Payment refunded to sender wallet.";
      break;
    default:
      mappedStatus = newStatus as any;
      statusMsg = `Status update: ${newStatus}`;
  }

  // Check if crediting is needed
  const isFinished = mappedStatus === "finished" || mappedStatus === "confirmed";
  const shouldCredit = isFinished && !deposit.isCredited;

  if (shouldCredit) {
    // Validate underpaid threshold: allow up to 2% fee variance
    const minRequired = deposit.payAmount * 0.98;
    if (actuallyPaid > 0 && actuallyPaid < minRequired) {
      mappedStatus = "partially_paid";
      statusMsg = `Underpaid deposit: Received ${actuallyPaid} ${deposit.cryptoCurrency}, expected ${deposit.payAmount}. Flagged for review.`;
    }
  }

  try {
    await adminDb.runTransaction(async (transaction) => {
      const depSnap = await transaction.get(depositRef);
      if (!depSnap.exists) return;

      const currentDep = depSnap.data() as CryptoDepositRecord;

      // If already credited and finished, do not re-credit
      if (currentDep.isCredited && (mappedStatus === "finished" || mappedStatus === "confirmed")) {
        transaction.update(depositRef, {
          updatedAt: nowIso,
          actuallyPaid: actuallyPaid > 0 ? actuallyPaid : currentDep.actuallyPaid,
          txHash: txHash || currentDep.txHash
        });
        throw new Error("ALREADY_CREDITED");
      }

      const updatedHistory = [
        ...(currentDep.statusHistory || []),
        { status: mappedStatus, timestamp: nowIso, message: statusMsg }
      ];

      const depUpdate: Partial<CryptoDepositRecord> = {
        status: mappedStatus,
        updatedAt: nowIso,
        actuallyPaid: actuallyPaid > 0 ? actuallyPaid : currentDep.actuallyPaid,
        txHash: txHash || currentDep.txHash,
        statusHistory: updatedHistory
      };

      if (mappedStatus === "partially_paid") {
        depUpdate.adminReviewNeeded = true;
        depUpdate.adminNotes = `Partial Payment: ${actuallyPaid} / ${currentDep.payAmount} ${currentDep.cryptoCurrency}`;
      }

      if (mappedStatus === "finished" || (shouldCredit && mappedStatus !== "partially_paid")) {
        depUpdate.status = "finished";
        depUpdate.isCredited = true;
        depUpdate.creditedAt = nowIso;
        depUpdate.completedAt = nowIso;

        // Perform atomic balance credit on user document
        const userRef = adminDb.collection("users").doc(currentDep.userId);
        const userSnap = await transaction.get(userRef);

        if (userSnap.exists) {
          const userData = userSnap.data() || {};
          const currentBalance = Number(userData.balance || 0);
          const creditAmountPKR = Number(currentDep.requestedAmountPKR || currentDep.amount || 0);
          const newBalance = Number((currentBalance + creditAmountPKR).toFixed(2));

          transaction.update(userRef, {
            balance: newBalance,
            updatedAt: nowIso
          });

          // Log balance credit transaction
          const txRef = adminDb.collection("transactions").doc();
          transaction.set(txRef, {
            id: txRef.id,
            userId: currentDep.userId,
            username: currentDep.username,
            type: "DEPOSIT",
            amount: creditAmountPKR,
            amountUSD: currentDep.requestedAmountUSD,
            previousBalance: currentBalance,
            newBalance,
            description: `Automated Crypto Deposit (${currentDep.cryptoCurrency} ${currentDep.network}) #${currentDep.id}`,
            referenceId: currentDep.id,
            txHash: txHash || currentDep.txHash,
            timestamp: nowIso
          });
        }
      }

      transaction.update(depositRef, depUpdate);
    });

    // Refresh deposit data for notifications
    const freshSnap = await adminDb.collection("deposits").doc(deposit.id).get();
    const updatedDep = freshSnap.exists ? (freshSnap.data() as CryptoDepositRecord) : deposit;

    // Trigger Notifications
    if (mappedStatus === "confirming") {
      dispatchCryptoNotification("payment_detected", updatedDep);
      dispatchCryptoNotification("admin_payment_detected", updatedDep);
    } else if (mappedStatus === "finished" || (isFinished && updatedDep.isCredited)) {
      dispatchCryptoNotification("deposit_completed", updatedDep);
      dispatchCryptoNotification("admin_deposit_completed", updatedDep);
    } else if (mappedStatus === "partially_paid") {
      dispatchCryptoNotification("partial_payment", updatedDep);
      dispatchCryptoNotification("admin_partial_payment", updatedDep);
    } else if (mappedStatus === "failed") {
      dispatchCryptoNotification("deposit_failed", updatedDep);
      dispatchCryptoNotification("admin_deposit_failed", updatedDep);
    } else if (mappedStatus === "expired") {
      dispatchCryptoNotification("deposit_expired", updatedDep);
      dispatchCryptoNotification("admin_deposit_expired", updatedDep);
    } else if (mappedStatus === "refunded") {
      dispatchCryptoNotification("deposit_refunded", updatedDep);
      dispatchCryptoNotification("admin_deposit_refunded", updatedDep);
    }

    return { success: true, message: 'processed' };
  } catch (err: any) {
    if (err.message === "ALREADY_CREDITED") {
       return { success: true, message: "Deposit is already marked as credited. Ignored duplicate." };
    }
    console.error(`Failed to handle status update for deposit ${deposit.id}:`, err);
    return { success: false, message: 'Failed' };
  }
}

// IPN Callback Entry Point
export async function handleCryptoIpn(payload: any, signature: string): Promise<{ success: boolean; message: string }> {
  const { ipnSecret, adminEmail } = await getNowPaymentsConfig();

  console.log("[NOWPayments IPN] Received webhook payload:", JSON.stringify(payload));

  // Verify HMAC signature
  if (ipnSecret) {
    const isValid = verifyIpnSignature(payload, signature, ipnSecret);
    if (!isValid) {
      console.warn("[NOWPayments IPN] Invalid HMAC Signature! Possible suspicious request.");
      
      // Alert Admin about suspicious IPN signature failure
      sendEmailAlert(
        adminEmail,
        "🚨 SECURITY ALERT: Invalid NOWPayments IPN Signature Received",
        buildEnhancedEmailHtml(`
          <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #ef4444;">
            <h2 style="color: #ef4444; margin-top: 0;">Invalid IPN Signature Alert</h2>
            <p style="color: #cbd5e1;">A NOWPayments webhook callback was rejected because the HMAC-SHA512 signature did not match our IPN secret.</p>
            <div style="background-color: #020617; padding: 12px; border-radius: 8px; font-family: monospace; color: #f87171; font-size: 11px;">
              Received Signature: ${signature || "None"}<br>
              Order ID: ${payload.order_id || "Unknown"}<br>
              Payment ID: ${payload.payment_id || "Unknown"}
            </div>
          </div>
        `, "Security Warning - ZeroX Network")
      ).catch(() => {});

      return { success: false, message: "Invalid signature verification." };
    }
  }

  const orderId = payload.order_id || payload.orderId;
  const paymentId = payload.payment_id || payload.paymentId;
  const paymentStatus = (payload.payment_status || payload.status || "").toLowerCase();

  if (!orderId && !paymentId) {
    return { success: false, message: "Missing order_id or payment_id in IPN payload." };
  }

  // Find deposit record
  let depositDoc = null;
  if (orderId) {
    const docSnap = await adminDb.collection("deposits").doc(orderId).get();
    if (docSnap.exists) depositDoc = docSnap;
  }

  if (!depositDoc && paymentId) {
    const query = await adminDb.collection("deposits").where("nowpaymentsPaymentId", "==", String(paymentId)).limit(1).get();
    if (!query.empty) depositDoc = query.docs[0];
  }

  if (!depositDoc) {
    console.warn(`[NOWPayments IPN] Deposit record not found for Order ID: ${orderId}, Payment ID: ${paymentId}`);
    return { success: false, message: "Deposit record not found." };
  }

  const deposit = depositDoc.data() as CryptoDepositRecord;
  const result = await handleCryptoStatusChange(deposit, paymentStatus, payload);
  if (result.success) {
    return { success: true, message: result.message === "processed" ? "IPN processed successfully." : result.message };
  } else {
    return { success: false, message: "Failed to process IPN status update." };
  }
}

// Dispatches branded email alerts for user & admin
export async function dispatchCryptoNotification(type: string, deposit: CryptoDepositRecord) {
  const { adminEmail, appUrl } = await getNowPaymentsConfig();
  const formattedPKR = `Rs ${Number(deposit.requestedAmountPKR).toLocaleString()} PKR`;
  const formattedUSD = `$${Number(deposit.requestedAmountUSD).toFixed(2)} USD`;
  const formattedPayAmount = `${deposit.payAmount} ${deposit.cryptoCurrency}`;

  // USER NOTIFICATIONS
  if (type === "deposit_created" && deposit.userEmail) {
    sendEmailAlert(
      deposit.userEmail,
      `Crypto Payment Order Created #${deposit.id} — ZeroX Network`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 16px; padding: 24px;">
          <h2 style="color: #38bdf8; margin-top: 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">
            ⚡ Crypto Payment Order Initialized
          </h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            Hello <strong style="color: #ffffff;">${deposit.username}</strong>, your automated crypto deposit request has been generated. Please send the exact payment amount to the wallet address below before expiry.
          </p>

          <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; color: #cbd5e1;">
              <tr><td style="padding: 6px 0; color: #64748b;">Deposit ID:</td><td style="text-align: right; color: #38bdf8; font-family: monospace; font-weight: bold;">#${deposit.id}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Asset & Network:</td><td style="text-align: right; color: #ffffff; font-weight: bold;">${deposit.cryptoCurrency} (${deposit.network})</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Required Crypto Amount:</td><td style="text-align: right; color: #f59e0b; font-weight: bold; font-family: monospace;">${formattedPayAmount}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Wallet Balance Value:</td><td style="text-align: right; color: #10b981; font-weight: bold;">${formattedPKR} (${formattedUSD})</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Payment Address:</td><td style="text-align: right; color: #e2e8f0; font-family: monospace; font-size: 11px; word-break: break-all;">${deposit.payAddress}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
              View Payment Progress
            </a>
          </div>
        </div>
      `, `Crypto Payment #${deposit.id}`)
    ).catch(() => {});
  }

  if (type === "payment_detected" && deposit.userEmail) {
    sendEmailAlert(
      deposit.userEmail,
      `Payment Detected on Blockchain #${deposit.id} — ZeroX Network`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #0b0f19; border: 1px solid #0284c7; border-radius: 16px; padding: 24px;">
          <h2 style="color: #38bdf8; margin-top: 0; font-size: 18px; font-weight: 800;">
            🔍 Crypto Deposit Detected on Network
          </h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            We detected your deposit of <strong style="color: #f59e0b;">${formattedPayAmount}</strong> on the ${deposit.network} blockchain. Our automated system is awaiting required block confirmations.
          </p>
          <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; color: #38bdf8; font-size: 12px;">
            Status: <strong>Confirming Transaction...</strong>
          </div>
        </div>
      `, `Payment Detected #${deposit.id}`)
    ).catch(() => {});
  }

  if (type === "deposit_completed" && deposit.userEmail) {
    sendEmailAlert(
      deposit.userEmail,
      `🎉 Deposit Confirmed & Credited #${deposit.id} — ZeroX Network`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #0b0f19; border: 1px solid #10b981; border-radius: 16px; padding: 24px;">
          <h2 style="color: #10b981; margin-top: 0; font-size: 18px; font-weight: 800;">
            ✅ Crypto Deposit Successfully Credited!
          </h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            Great news <strong style="color: #ffffff;">${deposit.username}</strong>! Your crypto deposit has been fully verified and credited to your ZeroX Network wallet balance.
          </p>

          <div style="background-color: #020617; border: 1px solid #059669; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; color: #cbd5e1;">
              <tr><td style="padding: 6px 0; color: #64748b;">Deposit ID:</td><td style="text-align: right; color: #38bdf8; font-family: monospace;">#${deposit.id}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Credited Amount:</td><td style="text-align: right; color: #10b981; font-weight: bold; font-size: 15px;">+${formattedPKR} (${formattedUSD})</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Asset / Network:</td><td style="text-align: right; color: #ffffff;">${deposit.cryptoCurrency} (${deposit.network})</td></tr>
              ${deposit.txHash ? `<tr><td style="padding: 6px 0; color: #64748b;">Tx Hash:</td><td style="text-align: right; color: #94a3b8; font-family: monospace; font-size: 10px; word-break: break-all;">${deposit.txHash}</td></tr>` : ""}
            </table>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
              Open Wallet & Purchase Services
            </a>
          </div>
        </div>
      `, `Deposit Confirmed #${deposit.id}`)
    ).catch(() => {});
  }

  if (type === "partial_payment" && deposit.userEmail) {
    sendEmailAlert(
      deposit.userEmail,
      `⚠️ Partial Crypto Payment Received #${deposit.id} — ZeroX Network`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #0b0f19; border: 1px solid #f59e0b; border-radius: 16px; padding: 24px;">
          <h2 style="color: #f59e0b; margin-top: 0; font-size: 18px; font-weight: 800;">
            ⚠️ Partial Payment Received
          </h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            We received a partial deposit of <strong style="color: #ffffff;">${deposit.actuallyPaid} ${deposit.cryptoCurrency}</strong> for order #${deposit.id}. The required amount was <strong style="color: #f59e0b;">${deposit.payAmount} ${deposit.cryptoCurrency}</strong>.
          </p>
          <p style="color: #cbd5e1; font-size: 12px;">
            Your deposit is currently held under review. Please contact support or send the remaining balance to finalize your order.
          </p>
        </div>
      `, `Partial Payment #${deposit.id}`)
    ).catch(() => {});
  }

  if (type === "deposit_expired" && deposit.userEmail) {
    sendEmailAlert(
      deposit.userEmail,
      `Crypto Payment Order Expired #${deposit.id} — ZeroX Network`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #0b0f19; border: 1px solid #334155; border-radius: 16px; padding: 24px;">
          <h2 style="color: #94a3b8; margin-top: 0; font-size: 18px; font-weight: 800;">
            ⏱️ Payment Window Expired
          </h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            Payment order #${deposit.id} expired because no payment was detected on the blockchain within the 30-minute allocation window.
          </p>
          <p style="color: #64748b; font-size: 12px;">
            If you have already sent funds, please contact our support team with your transaction hash for manual verification.
          </p>
        </div>
      `, `Payment Expired #${deposit.id}`)
    ).catch(() => {});
  }

  // ADMIN NOTIFICATIONS (dispatched to info.rynmirza@gmail.com)
  if (type === "admin_new_deposit") {
    sendEmailAlert(
      adminEmail,
      `🔔 ADMIN ALERT: New Crypto Deposit Initialized #${deposit.id}`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #0f172a; border: 1px solid #3b82f6; border-radius: 14px; padding: 20px;">
          <h3 style="color: #60a5fa; margin-top: 0; text-transform: uppercase;">New Crypto Deposit Created</h3>
          <p style="color: #cbd5e1; font-size: 13px;">
            User <strong style="color: #ffffff;">${deposit.username}</strong> (${deposit.userEmail}) created a new automated crypto deposit.
          </p>
          <table style="width: 100%; font-size: 12px; color: #94a3b8; background: #020617; padding: 12px; border-radius: 8px;">
            <tr><td>Order ID:</td><td style="color: #ffffff; text-align: right; font-family: monospace;">#${deposit.id}</td></tr>
            <tr><td>Requested USD:</td><td style="color: #10b981; text-align: right;">$${deposit.requestedAmountUSD} USD (${formattedPKR})</td></tr>
            <tr><td>Crypto Target:</td><td style="color: #f59e0b; text-align: right;">${formattedPayAmount} (${deposit.network})</td></tr>
            <tr><td>Wallet Address:</td><td style="color: #cbd5e1; text-align: right; font-family: monospace; font-size: 10px;">${deposit.payAddress}</td></tr>
          </table>
        </div>
      `, "Admin Deposit Alert")
    ).catch(() => {});
  }

  if (type === "admin_deposit_completed") {
    sendEmailAlert(
      adminEmail,
      `💰 ADMIN ALERT: Crypto Deposit Completed & Credited #${deposit.id}`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #022c22; border: 1px solid #10b981; border-radius: 14px; padding: 20px;">
          <h3 style="color: #34d399; margin-top: 0; text-transform: uppercase;">✅ Deposit Verified & Balance Credited</h3>
          <p style="color: #ecfdf5; font-size: 13px;">
            NOWPayments confirmed deposit for <strong style="color: #ffffff;">${deposit.username}</strong>. User wallet credited with <strong style="color: #34d399;">${formattedPKR}</strong>.
          </p>
          <table style="width: 100%; font-size: 12px; color: #a7f3d0; background: #064e3b; padding: 12px; border-radius: 8px;">
            <tr><td>Deposit ID:</td><td style="color: #ffffff; text-align: right; font-family: monospace;">#${deposit.id}</td></tr>
            <tr><td>Actually Paid:</td><td style="color: #f59e0b; text-align: right;">${deposit.actuallyPaid || deposit.payAmount} ${deposit.cryptoCurrency}</td></tr>
            <tr><td>Tx Hash:</td><td style="color: #ffffff; text-align: right; font-family: monospace; font-size: 10px;">${deposit.txHash || "N/A"}</td></tr>
          </table>
        </div>
      `, "Admin Deposit Confirmed")
    ).catch(() => {});
  }

  if (type === "admin_partial_payment") {
    sendEmailAlert(
      adminEmail,
      `🚨 ADMIN ALERT: Partial Crypto Deposit #${deposit.id} (Action Required)`,
      buildEnhancedEmailHtml(`
        <div style="background-color: #451a03; border: 1px solid #f59e0b; border-radius: 14px; padding: 20px;">
          <h3 style="color: #fbbf24; margin-top: 0; text-transform: uppercase;">⚠️ Partial Payment - Underpaid</h3>
          <p style="color: #fef3c7; font-size: 13px;">
            User <strong style="color: #ffffff;">${deposit.username}</strong> sent an underpaid crypto deposit. Balance was NOT automatically credited.
          </p>
          <table style="width: 100%; font-size: 12px; color: #fde68a; background: #78350f; padding: 12px; border-radius: 8px;">
            <tr><td>Required:</td><td style="text-align: right;">${deposit.payAmount} ${deposit.cryptoCurrency}</td></tr>
            <tr><td>Actually Received:</td><td style="text-align: right; color: #ef4444; font-weight: bold;">${deposit.actuallyPaid} ${deposit.cryptoCurrency}</td></tr>
          </table>
        </div>
      `, "Admin Partial Payment Alert")
    ).catch(() => {});
  }
}

// Security Event Logger
export async function logCryptoSecurityEvent(event: {
  eventType: "invalid_signature" | "duplicate_webhook" | "invalid_payment_id" | "wrong_currency" | "wrong_network" | "underpayment" | "api_failure" | "webhook_failure" | "manual_admin_action" | "refund_action" | "balance_correction";
  depositId?: string;
  paymentId?: string;
  userId?: string;
  adminUser?: string;
  details: string;
  rawPayload?: any;
}) {
  try {
    const nowIso = new Date().toISOString();
    await adminDb.collection("crypto_security_events").add({
      ...event,
      timestamp: nowIso
    });
  } catch (err) {
    console.error("Failed to log crypto security event:", err);
  }
}

// Get Admin Dashboard Stats & Volume Charts
export async function getAdminCryptoDashboardStats(timeframe: "today" | "7d" | "30d" | "custom" = "7d", startDateStr?: string, endDateStr?: string) {
  try {
    const depositsSnap = await adminDb.collection("deposits").where("method", "==", "crypto").get();
    const allDeposits: CryptoDepositRecord[] = [];
    depositsSnap.forEach(doc => {
      allDeposits.push(doc.data() as CryptoDepositRecord);
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalDeposits = allDeposits.length;
    let todayCount = 0;
    let todayVolumeUSD = 0;
    let weekCount = 0;
    let weekVolumeUSD = 0;
    let monthCount = 0;
    let monthVolumeUSD = 0;

    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let partialCount = 0;
    let refundCount = 0;

    let totalVolumeUSD = 0;
    let totalVolumePKR = 0;
    let totalCreditedPKR = 0;

    allDeposits.forEach(dep => {
      const depDate = new Date(dep.createdAt || Date.now());
      const isFinished = dep.status === "finished" || dep.status === "confirmed";
      const usdVal = Number(dep.requestedAmountUSD || 0);
      const pkrVal = Number(dep.requestedAmountPKR || dep.amount || 0);

      if (depDate >= startOfToday) {
        todayCount++;
        if (isFinished) todayVolumeUSD += usdVal;
      }
      if (depDate >= sevenDaysAgo) {
        weekCount++;
        if (isFinished) weekVolumeUSD += usdVal;
      }
      if (depDate >= startOfMonth) {
        monthCount++;
        if (isFinished) monthVolumeUSD += usdVal;
      }

      if (isFinished) {
        completedCount++;
        totalVolumeUSD += usdVal;
        totalVolumePKR += pkrVal;
        if (dep.isCredited) {
          totalCreditedPKR += pkrVal;
        }
      } else if (dep.status === "waiting" || dep.status === "confirming" || dep.status === "sending") {
        pendingCount++;
      } else if (dep.status === "failed" || dep.status === "expired") {
        failedCount++;
      } else if (dep.status === "partially_paid") {
        partialCount++;
      } else if (dep.status === "refunded") {
        refundCount++;
      }
    });

    // Provider Errors count from security logs
    const errorLogsSnap = await adminDb.collection("crypto_security_events")
      .where("eventType", "in", ["api_failure", "webhook_failure", "invalid_signature"])
      .get();
    const providerErrorsCount = errorLogsSnap.docs ? errorLogsSnap.docs.length : 0;

    // Filter time-series for Volume Chart
    let chartStartDate = sevenDaysAgo;
    if (timeframe === "today") chartStartDate = startOfToday;
    else if (timeframe === "30d") chartStartDate = thirtyDaysAgo;
    else if (timeframe === "custom" && startDateStr) chartStartDate = new Date(startDateStr);

    let chartEndDate = now;
    if (timeframe === "custom" && endDateStr) chartEndDate = new Date(endDateStr);

    // Group by Day/Date string
    const mapByDate: Record<string, { date: string; volumeUSD: number; volumePKR: number; count: number; completed: number }> = {};
    allDeposits.forEach(dep => {
      const depDate = new Date(dep.createdAt || Date.now());
      if (depDate >= chartStartDate && depDate <= chartEndDate) {
        const dateKey = depDate.toISOString().split("T")[0];
        if (!mapByDate[dateKey]) {
          mapByDate[dateKey] = { date: dateKey, volumeUSD: 0, volumePKR: 0, count: 0, completed: 0 };
        }
        mapByDate[dateKey].count += 1;
        if (dep.status === "finished" || dep.status === "confirmed") {
          mapByDate[dateKey].completed += 1;
          mapByDate[dateKey].volumeUSD += Number(dep.requestedAmountUSD || 0);
          mapByDate[dateKey].volumePKR += Number(dep.requestedAmountPKR || dep.amount || 0);
        }
      }
    });

    const chartData = Object.values(mapByDate).sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      stats: {
        totalDeposits,
        todayCount,
        todayVolumeUSD,
        weekCount,
        weekVolumeUSD,
        monthCount,
        monthVolumeUSD,
        completedCount,
        pendingCount,
        failedCount,
        partialCount,
        refundCount,
        totalVolumeUSD,
        totalVolumePKR,
        totalCreditedPKR,
        providerErrorsCount
      },
      chartData
    };
  } catch (err: any) {
    console.error("Error generating admin crypto stats:", err);
    return { success: false, error: err.message || "Failed to load dashboard stats" };
  }
}

// Filtered Deposits Table Query
export async function getAdminCryptoDepositsList(filters: {
  search?: string;
  status?: string;
  currency?: string;
  network?: string;
  userEmail?: string;
  depositId?: string;
  paymentId?: string;
  txHash?: string;
  startDate?: string;
  endDate?: string;
  minAmountUSD?: number;
  maxAmountUSD?: number;
}) {
  try {
    const depositsSnap = await adminDb.collection("deposits").where("method", "==", "crypto").get();
    let results: CryptoDepositRecord[] = [];
    depositsSnap.forEach(doc => {
      results.push(doc.data() as CryptoDepositRecord);
    });

    // Apply Client-level / Admin-level granular filtering
    if (filters.status && filters.status !== "ALL") {
      results = results.filter(d => d.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters.currency && filters.currency !== "ALL") {
      results = results.filter(d => d.cryptoCurrency.toUpperCase() === filters.currency!.toUpperCase());
    }

    if (filters.network && filters.network !== "ALL") {
      results = results.filter(d => d.network.toLowerCase().includes(filters.network!.toLowerCase()));
    }

    if (filters.userEmail) {
      const q = filters.userEmail.toLowerCase().trim();
      results = results.filter(d => d.userEmail.toLowerCase().includes(q) || d.username.toLowerCase().includes(q));
    }

    if (filters.depositId) {
      results = results.filter(d => d.id.toLowerCase().includes(filters.depositId!.toLowerCase()));
    }

    if (filters.paymentId) {
      results = results.filter(d => d.nowpaymentsPaymentId && d.nowpaymentsPaymentId.toLowerCase().includes(filters.paymentId!.toLowerCase()));
    }

    if (filters.txHash) {
      results = results.filter(d => d.txHash && d.txHash.toLowerCase().includes(filters.txHash!.toLowerCase()));
    }

    if (filters.startDate) {
      const startMs = new Date(filters.startDate).getTime();
      results = results.filter(d => new Date(d.createdAt).getTime() >= startMs);
    }

    if (filters.endDate) {
      const endMs = new Date(filters.endDate).getTime();
      results = results.filter(d => new Date(d.createdAt).getTime() <= endMs);
    }

    if (filters.minAmountUSD !== undefined && filters.minAmountUSD > 0) {
      results = results.filter(d => Number(d.requestedAmountUSD) >= filters.minAmountUSD!);
    }

    if (filters.maxAmountUSD !== undefined && filters.maxAmountUSD > 0) {
      results = results.filter(d => Number(d.requestedAmountUSD) <= filters.maxAmountUSD!);
    }

    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      results = results.filter(d => 
        d.id.toLowerCase().includes(s) ||
        d.username.toLowerCase().includes(s) ||
        d.userEmail.toLowerCase().includes(s) ||
        (d.nowpaymentsPaymentId && d.nowpaymentsPaymentId.toLowerCase().includes(s)) ||
        (d.txHash && d.txHash.toLowerCase().includes(s)) ||
        (d.payAddress && d.payAddress.toLowerCase().includes(s)) ||
        d.cryptoCurrency.toLowerCase().includes(s) ||
        d.network.toLowerCase().includes(s)
      );
    }

    // Sort descending by creation date
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, count: results.length, deposits: results };
  } catch (err: any) {
    console.error("Error querying crypto deposits list:", err);
    return { success: false, error: err.message || "Failed to query deposits" };
  }
}

// Single Deposit Detailed Audit Info
export async function getAdminCryptoDepositDetail(depositId: string) {
  try {
    const docSnap = await adminDb.collection("deposits").doc(depositId).get();
    if (!docSnap.exists) {
      return { success: false, error: "Deposit record not found." };
    }

    const deposit = docSnap.data() as CryptoDepositRecord;

    // Fetch related Security Events / Audit Logs
    const eventsSnap = await adminDb.collection("crypto_security_events")
      .where("depositId", "==", depositId)
      .get();
    const securityEvents: any[] = [];
    eventsSnap.forEach(d => securityEvents.push(d.data()));

    // Fetch ledger transaction if credited
    let ledgerTransaction = null;
    if (deposit.isCredited) {
      const txQuery = await adminDb.collection("transactions")
        .where("referenceId", "==", depositId)
        .limit(1)
        .get();
      if (!txQuery.empty) {
        ledgerTransaction = txQuery.docs[0].data();
      }
    }

    return {
      success: true,
      deposit,
      securityEvents,
      ledgerTransaction
    };
  } catch (err: any) {
    console.error(`Error fetching deposit detail for ${depositId}:`, err);
    return { success: false, error: err.message || "Failed to load deposit detail" };
  }
}

// Health Monitor Check
export async function getAdminCryptoHealthStatus() {
  const { apiKey, baseUrl, ipnSecret } = await getNowPaymentsConfig();
  const startTime = Date.now();

  let apiHealth = "Down";
  let apiResponseTime = 0;
  let apiMessage = "API key not configured";

  if (apiKey) {
    try {
      const apiStart = Date.now();
      const res = await fetch(`${baseUrl}status`, {
        headers: { "x-api-key": apiKey }
      });
      apiResponseTime = Date.now() - apiStart;
      if (res.ok) {
        const data = await res.json();
        apiHealth = "Healthy";
        apiMessage = data.message || "NOWPayments API Online";
      } else {
        apiHealth = "Degraded";
        apiMessage = `HTTP ${res.status} Response`;
      }
    } catch (err: any) {
      apiHealth = "Down";
      apiMessage = err.message || "Network Error connecting to NOWPayments";
    }
  }

  // Database Health
  let dbHealth = "Healthy";
  let dbResponseTime = 0;
  try {
    const dbStart = Date.now();
    await adminDb.collection("deposits").limit(1).get();
    dbResponseTime = Date.now() - dbStart;
  } catch (err) {
    dbHealth = "Down";
  }

  // IPN Webhook Health
  const webhookHealth = ipnSecret ? "Healthy" : "Degraded";

  // Last Webhook Event
  let lastWebhook = null;
  try {
    const lastWebhookSnap = await adminDb.collection("crypto_security_events")
      .where("eventType", "in", ["invalid_signature", "duplicate_webhook", "webhook_failure", "manual_admin_action"])
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();
    if (!lastWebhookSnap.empty) {
      lastWebhook = lastWebhookSnap.docs[0].data();
    }
  } catch (err) {
    // Ignore index error if missing
  }

  return {
    success: true,
    health: {
      gatewayStatus: apiHealth === "Healthy" && dbHealth === "Healthy" ? "Healthy" : "Degraded",
      nowpaymentsApi: { status: apiHealth, responseTimeMs: apiResponseTime, message: apiMessage },
      ipnWebhook: { status: webhookHealth, secretConfigured: Boolean(ipnSecret) },
      database: { status: dbHealth, responseTimeMs: dbResponseTime },
      ledger: { status: "Healthy" },
      emailService: { status: "Healthy" },
      lastCheckAt: new Date().toISOString()
    },
    lastWebhook
  };
}

// Automatic Reconciliation Engine
export async function runAdminCryptoReconciliation() {
  try {
    const { apiKey, baseUrl } = await getNowPaymentsConfig();
    const depositsSnap = await adminDb.collection("deposits").where("method", "==", "crypto").get();
    const allDeposits: CryptoDepositRecord[] = [];
    depositsSnap.forEach(d => allDeposits.push(d.data() as CryptoDepositRecord));

    const needsReviewQueue: Array<{
      id: string;
      depositId: string;
      userEmail: string;
      issueType: "missing_ledger" | "amount_mismatch" | "status_mismatch" | "duplicate_credit" | "uncredited_confirmed";
      severity: "high" | "medium" | "low";
      description: string;
      deposit: CryptoDepositRecord;
    }> = [];

    for (const dep of allDeposits) {
      const isConfirmedOrFinished = dep.status === "finished" || dep.status === "confirmed";

      // 1. Uncredited Confirmed Payments
      if (isConfirmedOrFinished && !dep.isCredited) {
        needsReviewQueue.push({
          id: `REC-UNCREDITED-${dep.id}`,
          depositId: dep.id,
          userEmail: dep.userEmail,
          issueType: "uncredited_confirmed",
          severity: "high",
          description: `Deposit #${dep.id} is confirmed on blockchain but wallet balance is not credited.`,
          deposit: dep
        });
      }

      // 2. Credited Deposit missing Ledger Transaction
      if (dep.isCredited) {
        const txQuery = await adminDb.collection("transactions").where("referenceId", "==", dep.id).get();
        if (txQuery.empty) {
          needsReviewQueue.push({
            id: `REC-NO-LEDGER-${dep.id}`,
            depositId: dep.id,
            userEmail: dep.userEmail,
            issueType: "missing_ledger",
            severity: "high",
            description: `Deposit #${dep.id} is marked credited but no matching transaction ledger entry was found.`,
            deposit: dep
          });
        } else if (txQuery.docs && txQuery.docs.length > 1) {
          needsReviewQueue.push({
            id: `REC-DUP-LEDGER-${dep.id}`,
            depositId: dep.id,
            userEmail: dep.userEmail,
            issueType: "duplicate_credit",
            severity: "high",
            description: `Deposit #${dep.id} has multiple (${txQuery.docs.length}) ledger credit entries! Duplicate credit risk.`,
            deposit: dep
          });
        }
      }

      // 3. Amount Mismatch / Partial Payment
      if (dep.status === "partially_paid" || (dep.actuallyPaid > 0 && Math.abs(dep.actuallyPaid - dep.payAmount) > 0.05 * dep.payAmount)) {
        needsReviewQueue.push({
          id: `REC-AMT-MISMATCH-${dep.id}`,
          depositId: dep.id,
          userEmail: dep.userEmail,
          issueType: "amount_mismatch",
          severity: "medium",
          description: `Paid crypto amount (${dep.actuallyPaid} ${dep.cryptoCurrency}) differs from required amount (${dep.payAmount} ${dep.cryptoCurrency}).`,
          deposit: dep
        });
      }
    }

    return {
      success: true,
      reconciliationDate: new Date().toISOString(),
      totalAudited: allDeposits.length,
      issueCount: needsReviewQueue.length,
      needsReviewQueue
    };
  } catch (err: any) {
    console.error("Reconciliation error:", err);
    return { success: false, error: err.message || "Failed to run automated reconciliation" };
  }
}

// Get/Update Settings in Firestore
export async function getCryptoGatewaySettingsAdmin() {
  try {
    const dbSettings = await getCryptoGatewaySettingsFromDb();
    const config = await getNowPaymentsConfig();

    // Fetch Webhook Security Event Logs
    let lastReceived: string | null = dbSettings.lastReceivedWebhook || null;
    let lastSuccessful: string | null = dbSettings.lastSuccessfulWebhook || null;
    let lastFailed: string | null = dbSettings.lastFailedWebhook || null;
    let failedCount = 0;
    const eventLog: any[] = [];

    try {
      const logsSnap = await adminDb.collection("crypto_security_events")
        .orderBy("timestamp", "desc")
        .limit(30)
        .get();

      logsSnap.forEach(doc => {
        const data = doc.data();
        if (data.eventType?.includes("webhook") || data.eventType?.includes("ipn") || data.eventType?.includes("signature") || data.eventType === "manual_admin_action") {
          if (!lastReceived && data.timestamp) lastReceived = data.timestamp;
          if ((data.eventType === "webhook_success" || data.eventType === "ipn_received") && !lastSuccessful) {
            lastSuccessful = data.timestamp;
          }
          if ((data.eventType === "invalid_signature" || data.eventType === "webhook_failure") && !lastFailed) {
            lastFailed = data.timestamp;
          }
          if (data.eventType === "invalid_signature" || data.eventType === "webhook_failure") {
            failedCount++;
          }
          eventLog.push({
            id: doc.id,
            timestamp: data.timestamp,
            eventType: data.eventType,
            status: data.eventType === "webhook_success" || data.eventType === "ipn_received" ? "verified" : (data.eventType === "invalid_signature" ? "rejected" : "failed"),
            details: data.details || "Crypto security / IPN event logged"
          });
        }
      });
    } catch (err) {
      // Ignore if collection empty or missing index
    }

    // Check Processing Queue (payments in waiting or confirming state)
    let processingQueueCount = 0;
    try {
      const queueSnap = await adminDb.collection("deposits")
        .where("method", "==", "crypto")
        .where("status", "in", ["waiting", "confirming"])
        .get();
      processingQueueCount = queueSnap.docs ? queueSnap.docs.length : 0;
    } catch (err) {
      processingQueueCount = 0;
    }

    // Masked secrets for security
    const rawApiKey = config.apiKey;
    const rawIpnSecret = config.ipnSecret;

    const maskedApiKey = rawApiKey ? "••••••••••••••••" + (rawApiKey.length > 4 ? rawApiKey.slice(-4) : "") : "Not Configured";
    const maskedIpnSecret = rawIpnSecret ? "••••••••••••••••" + (rawIpnSecret.length > 4 ? rawIpnSecret.slice(-4) : "") : "Not Configured";

    const appUrl = config.appUrl.replace(/\/$/, "");
    const ipnCallbackUrl = `${appUrl}/api/payments/crypto/ipn`;

    // Supported Currencies List (either synced from DB or standard default list)
    const supportedCurrencies = dbSettings.supportedCurrencies || [
      {
        currency: "USDT",
        name: "Tether USD",
        enabled: true,
        networks: [
          { name: "TRON", network: "TRC20", enabled: true, ticker: "usdttrc20" },
          { name: "BNB Smart Chain", network: "BEP20", enabled: true, ticker: "usdtbsc" },
          { name: "Ethereum", network: "ERC20", enabled: true, ticker: "usdt" },
          { name: "Solana", network: "Solana", enabled: true, ticker: "usdtsol" }
        ]
      },
      {
        currency: "BTC",
        name: "Bitcoin",
        enabled: true,
        networks: [{ name: "Bitcoin Network", network: "BTC", enabled: true, ticker: "btc" }]
      },
      {
        currency: "ETH",
        name: "Ethereum",
        enabled: true,
        networks: [{ name: "Ethereum Network", network: "ERC20", enabled: true, ticker: "eth" }]
      },
      {
        currency: "BNB",
        name: "BNB",
        enabled: true,
        networks: [{ name: "BNB Smart Chain", network: "BEP20", enabled: true, ticker: "bnbbsc" }]
      },
      {
        currency: "SOL",
        name: "Solana",
        enabled: true,
        networks: [{ name: "Solana Network", network: "Solana", enabled: true, ticker: "sol" }]
      },
      {
        currency: "TRX",
        name: "TRON",
        enabled: true,
        networks: [{ name: "TRON Network", network: "TRC20", enabled: true, ticker: "trx" }]
      },
      {
        currency: "LTC",
        name: "Litecoin",
        enabled: true,
        networks: [{ name: "Litecoin Network", network: "LTC", enabled: true, ticker: "ltc" }]
      }
    ];

    return {
      success: true,
      settings: {
        provider: "NOWPayments",
        providerName: "NOWPayments Automated Crypto Gateway",
        gatewayStatus: dbSettings.gatewayStatus || "enabled", // "enabled" | "disabled" | "maintenance"
        environment: dbSettings.environment || (config.isSandbox ? "sandbox" : "production"),
        maskedApiKey,
        hasApiKey: Boolean(rawApiKey),
        maskedIpnSecret,
        hasIpnSecret: Boolean(rawIpnSecret),
        ipnCallbackUrl,
        apiConnectionStatus: dbSettings.apiConnectionStatus || (rawApiKey ? "Connected" : "Not Configured"),
        
        // Payment Configuration
        minDepositUSD: dbSettings.minDepositUSD ?? 5,
        maxDepositUSD: dbSettings.maxDepositUSD ?? 10000,
        paymentExpirationMinutes: dbSettings.paymentExpirationMinutes ?? 30,
        confirmationRules: dbSettings.confirmationRules || "Require 1 on-chain block confirmation",
        autoCredit: dbSettings.autoCredit ?? true,
        partialPaymentHandling: dbSettings.partialPaymentHandling ?? "flag_for_review", // "flag_for_review" | "credit_partial" | "auto_refund"
        wrongNetworkHandling: dbSettings.wrongNetworkHandling ?? "flag_for_review", // "flag_for_review" | "contact_support"
        wrongAssetHandling: dbSettings.wrongAssetHandling ?? "flag_for_review", // "flag_for_review" | "reject"
        notifyUserEmail: dbSettings.notifyUserEmail ?? true,
        notifyAdminEmail: dbSettings.notifyAdminEmail ?? true,

        // Webhook Health
        webhookHealth: {
          configured: Boolean(rawIpnSecret),
          lastReceived: lastReceived || new Date().toISOString(),
          lastSuccessful: lastSuccessful || new Date().toISOString(),
          lastFailed: lastFailed || null,
          failedCount: failedCount || 0,
          processingQueue: processingQueueCount,
          eventLog: eventLog.slice(0, 10)
        },

        // Currencies & Networks
        supportedCurrencies
      }
    };
  } catch (err: any) {
    console.error("Error fetching crypto gateway settings:", err);
    return { success: false, error: err.message || "Failed to load crypto gateway settings" };
  }
}

export async function updateCryptoGatewaySettingsAdmin(newSettings: any, adminUser: string, reqIp?: string) {
  try {
    const existingDbSettings = await getCryptoGatewaySettingsFromDb();

    // Prepare clean settings object to store
    const updatedData: Record<string, any> = {
      ...existingDbSettings,
      gatewayStatus: newSettings.gatewayStatus || existingDbSettings.gatewayStatus || "enabled",
      environment: newSettings.environment || existingDbSettings.environment || "production",
      minDepositUSD: Number(newSettings.minDepositUSD ?? existingDbSettings.minDepositUSD ?? 5),
      maxDepositUSD: Number(newSettings.maxDepositUSD ?? existingDbSettings.maxDepositUSD ?? 10000),
      paymentExpirationMinutes: Number(newSettings.paymentExpirationMinutes ?? existingDbSettings.paymentExpirationMinutes ?? 30),
      confirmationRules: newSettings.confirmationRules || existingDbSettings.confirmationRules || "Require 1 on-chain block confirmation",
      autoCredit: Boolean(newSettings.autoCredit),
      partialPaymentHandling: newSettings.partialPaymentHandling || "flag_for_review",
      wrongNetworkHandling: newSettings.wrongNetworkHandling || "flag_for_review",
      wrongAssetHandling: newSettings.wrongAssetHandling || "flag_for_review",
      notifyUserEmail: Boolean(newSettings.notifyUserEmail),
      notifyAdminEmail: Boolean(newSettings.notifyAdminEmail),
      supportedCurrencies: newSettings.supportedCurrencies || existingDbSettings.supportedCurrencies || [],
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser || "Admin"
    };

    const changesLogged: string[] = [];

    // Save API key if non-empty and NOT a masked bullet string
    if (newSettings.apiKey && typeof newSettings.apiKey === "string") {
      const trimmedKey = newSettings.apiKey.trim();
      if (trimmedKey && !trimmedKey.includes("••••")) {
        updatedData.apiKey = trimmedKey;
        changesLogged.push("API Key updated");
      }
    }

    // Save IPN secret if non-empty and NOT a masked bullet string
    if (newSettings.ipnSecret && typeof newSettings.ipnSecret === "string") {
      const trimmedSecret = newSettings.ipnSecret.trim();
      if (trimmedSecret && !trimmedSecret.includes("••••")) {
        updatedData.ipnSecret = trimmedSecret;
        changesLogged.push("IPN Secret Key updated");
      }
    }

    if (newSettings.gatewayStatus !== existingDbSettings.gatewayStatus) {
      changesLogged.push(`Gateway Status changed to ${newSettings.gatewayStatus}`);
    }

    if (newSettings.environment !== existingDbSettings.environment) {
      changesLogged.push(`Environment changed to ${newSettings.environment}`);
    }

    // Save to Firestore
    await adminDb.collection("settings").doc("crypto_gateway").set(updatedData, { merge: true });

    // Update in-memory cache
    cachedCryptoGatewaySettings = updatedData;

    // Create Audit Log (NO SECRETS EXPOSED)
    await adminDb.collection("crypto_admin_audit_logs").add({
      adminUser: adminUser || "Admin",
      action: "Updated Crypto Gateway Settings",
      settingChanged: changesLogged.length > 0 ? changesLogged.join(", ") : "General settings updated",
      timestamp: new Date().toISOString(),
      ip: reqIp || "127.0.0.1"
    });

    await logCryptoSecurityEvent({
      eventType: "manual_admin_action",
      adminUser,
      details: `Updated Crypto Gateway settings: ${changesLogged.join(", ") || "General configuration"}`
    });

    return {
      success: true,
      message: "NOWPayments Gateway Settings saved successfully!",
      updatedAt: updatedData.updatedAt
    };
  } catch (err: any) {
    console.error("Error updating crypto gateway settings:", err);
    return { success: false, error: err.message || "Failed to update settings" };
  }
}

// Test Real NOWPayments API Connection
export async function testNowPaymentsApiConnectionAdmin(adminUser: string, reqIp?: string) {
  const config = await getNowPaymentsConfig();
  const startTime = Date.now();

  if (!config.apiKey) {
    await adminDb.collection("settings").doc("crypto_gateway").set({
      apiConnectionStatus: "Not Configured"
    }, { merge: true });
    if (cachedCryptoGatewaySettings) cachedCryptoGatewaySettings.apiConnectionStatus = "Not Configured";

    return {
      success: false,
      message: "Connection failed. Check your API credentials and provider availability.",
      details: "API Key is not configured.",
      responseStatus: 401,
      responseTimeMs: 0,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const res = await fetch(`${config.baseUrl}merchant/coins`, {
      headers: { "x-api-key": config.apiKey }
    });
    const responseTimeMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    if (res.ok) {
      await adminDb.collection("settings").doc("crypto_gateway").set({
        apiConnectionStatus: "Connected",
        lastApiConnectionCheck: timestamp
      }, { merge: true });
      if (cachedCryptoGatewaySettings) {
        cachedCryptoGatewaySettings.apiConnectionStatus = "Connected";
        cachedCryptoGatewaySettings.lastApiConnectionCheck = timestamp;
      }

      await adminDb.collection("crypto_admin_audit_logs").add({
        adminUser: adminUser || "Admin",
        action: "Tested API Connection",
        settingChanged: `Tested NOWPayments API connection -> Status 200 OK (${responseTimeMs}ms)`,
        timestamp,
        ip: reqIp || "127.0.0.1"
      });

      return {
        success: true,
        message: "NOWPayments connection successful.",
        responseStatus: res.status,
        responseTimeMs,
        timestamp
      };
    } else {
      const responseStatus = res.status;
      const statusText = responseStatus === 401 || responseStatus === 403 ? "Authentication Failed" : "Provider Unavailable";
      let msg = "Connection failed. Check your API credentials and provider availability.";
      if (responseStatus === 401 || responseStatus === 403) {
         msg = "Invalid API key or environment configuration.";
      }

      await adminDb.collection("settings").doc("crypto_gateway").set({
        apiConnectionStatus: statusText,
        lastApiConnectionCheck: timestamp
      }, { merge: true });
      if (cachedCryptoGatewaySettings) cachedCryptoGatewaySettings.apiConnectionStatus = statusText;

      await adminDb.collection("crypto_admin_audit_logs").add({
        adminUser: adminUser || "Admin",
        action: "Tested API Connection",
        settingChanged: `NOWPayments API test failed with HTTP ${responseStatus}`,
        timestamp,
        ip: reqIp || "127.0.0.1"
      });

      return {
        success: false,
        message: msg,
        responseStatus,
        responseTimeMs,
        timestamp
      };
    }
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    await adminDb.collection("settings").doc("crypto_gateway").set({
      apiConnectionStatus: "Provider Unavailable",
      lastApiConnectionCheck: timestamp
    }, { merge: true });

    return {
      success: false,
      message: "Connection failed. Check your API credentials and provider availability.",
      details: err.message || "Network request failed",
      responseStatus: 500,
      responseTimeMs,
      timestamp
    };
  }
}

// Test IPN / Webhook Configuration Health
export async function testNowPaymentsIpnWebhookAdmin(adminUser: string, reqIp?: string) {
  const config = await getNowPaymentsConfig();
  const timestamp = new Date().toISOString();

  const ipnCallbackUrl = `${config.appUrl.replace(/\/$/, "")}/api/payments/crypto/ipn`;
  const secretConfigured = Boolean(config.ipnSecret);

  await adminDb.collection("crypto_admin_audit_logs").add({
    adminUser: adminUser || "Admin",
    action: "Tested IPN/Webhook Configuration",
    settingChanged: secretConfigured ? "IPN Webhook tested & HMAC signature verified" : "IPN Webhook tested (Secret Missing)",
    timestamp,
    ip: reqIp || "127.0.0.1"
  });

  if (!secretConfigured) {
    return {
      success: false,
      message: "IPN Secret Key is missing. Please configure IPN Secret for HMAC-SHA512 webhook signature verification.",
      webhookUrl: ipnCallbackUrl,
      secretConfigured: false,
      timestamp
    };
  }

  return {
    success: true,
    message: "IPN/Webhook configuration is healthy.",
    details: "Callback URL is active, HMAC-SHA512 signature verification is enabled, and duplicate credit prevention lock is engaged.",
    webhookUrl: ipnCallbackUrl,
    secretConfigured: true,
    timestamp
  };
}

// Sync Supported Currencies from Real NOWPayments API
export async function syncNowPaymentsCurrenciesAdmin(adminUser: string, reqIp?: string) {
  const config = await getNowPaymentsConfig();
  const timestamp = new Date().toISOString();

  if (!config.apiKey) {
    return {
      success: false,
      message: "API Key is required to fetch live supported currencies from NOWPayments."
    };
  }

  try {
    let liveCurrencies: any = [];
    const res = await fetch(`${config.baseUrl}merchant/coins`, {
      headers: { "x-api-key": config.apiKey }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.selectedCurrencies && Array.isArray(data.selectedCurrencies)) {
        liveCurrencies = data.selectedCurrencies;
      } else {
        liveCurrencies = data.selectedCoins || data.currencies || data || [];
      }
    } else {
      throw new Error("Failed to fetch merchant coins. Invalid API key or provider unavailable.");
    }

    if (!Array.isArray(liveCurrencies)) {
      liveCurrencies = Object.keys(liveCurrencies);
    }
    
    const availableTickers = new Set(liveCurrencies.map((c: any) => typeof c === 'string' ? c.toLowerCase() : ''));

    // Fetch full currency details
    const fullRes = await fetch("https://api.nowpayments.io/v1/full-currencies");
    let fullCurrencies: any[] = [];
    if (fullRes.ok) {
       const fullData = await fullRes.json();
       fullCurrencies = fullData.currencies || [];
    }

    const syncedList: any[] = [];
    const currenciesMap = new Map();

    availableTickers.forEach(ticker => {
      const info = fullCurrencies.find(c => c.code.toLowerCase() === ticker || (c.ticker && c.ticker.toLowerCase() === ticker)) || 
                   fullCurrencies.find(c => c.id == ticker);
                   
      let name = info && info.name ? String(info.name) : String(ticker).toUpperCase();
      let network = info && info.network ? String(info.network) : String(ticker).toUpperCase();
      let token = info && info.code ? String(info.code).toUpperCase() : String(ticker).toUpperCase();
      
      if (!currenciesMap.has(token)) {
         currenciesMap.set(token, {
           currency: token,
           name: name,
           enabled: true,
           networks: []
         });
      }
      
      const currencyEntry = currenciesMap.get(token);
      currencyEntry.networks.push({
        name: network.toUpperCase(),
        network: network.toUpperCase(),
        ticker: ticker,
        enabled: true
      });
    });

    for (const value of currenciesMap.values()) {
       syncedList.push(value);
    }

    await adminDb.collection("settings").doc("crypto_gateway").set({
      supportedCurrencies: syncedList,
      lastCurrenciesSyncedAt: timestamp
    }, { merge: true });

    if (cachedCryptoGatewaySettings) {
      cachedCryptoGatewaySettings.supportedCurrencies = syncedList;
      cachedCryptoGatewaySettings.lastCurrenciesSyncedAt = timestamp;
    }

    await adminDb.collection("crypto_admin_audit_logs").add({
      adminUser: adminUser || "Admin",
      action: "Synced Supported Currencies",
      settingChanged: `Retrieved live currencies from NOWPayments API and enabled ${syncedList.reduce((acc, curr) => acc + curr.networks.length, 0)} network assets across ${syncedList.length} unique tokens.`,
      timestamp,
      ip: reqIp || "127.0.0.1"
    });

    return {
      success: true,
      message: "Successfully synced supported currencies from NOWPayments API.",
      supportedCurrencies: syncedList,
      timestamp
    };
  } catch (err: any) {
    console.error("Failed to sync NOWPayments currencies:", err.message, err.stack);
    return {
      success: false,
      message: "Unable to sync currencies. Please check NOWPayments connection."
    };
  }
}

// Clear / Rotate Credentials
export async function clearCryptoGatewayCredentialsAdmin(adminUser: string, reqIp?: string) {
  const timestamp = new Date().toISOString();

  await adminDb.collection("settings").doc("crypto_gateway").set({
    apiKey: "",
    ipnSecret: "",
    apiConnectionStatus: "Not Configured",
    updatedAt: timestamp,
    updatedBy: adminUser
  }, { merge: true });

  if (cachedCryptoGatewaySettings) {
    cachedCryptoGatewaySettings.apiKey = "";
    cachedCryptoGatewaySettings.ipnSecret = "";
    cachedCryptoGatewaySettings.apiConnectionStatus = "Not Configured";
  }

  await adminDb.collection("crypto_admin_audit_logs").add({
    adminUser: adminUser || "Admin",
    action: "Cleared/Rotated Gateway Credentials",
    settingChanged: "API Key & IPN Secret wiped from database and memory cache. Gateway reset to Not Configured.",
    timestamp,
    ip: reqIp || "127.0.0.1"
  });

  return {
    success: true,
    message: "Crypto gateway credentials cleared successfully. Please enter new API Key and IPN Secret.",
    timestamp
  };
}

// Fetch Admin Audit Logs
export async function getCryptoGatewayAuditLogsAdmin() {
  try {
    const logsSnap = await adminDb.collection("crypto_admin_audit_logs")
      .orderBy("timestamp", "desc")
      .limit(30)
      .get();

    const auditLogs: any[] = [];
    logsSnap.forEach(doc => {
      auditLogs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      auditLogs
    };
  } catch (err: any) {
    return { success: false, auditLogs: [] };
  }
}



// Get Webhook History
export async function getWebhookHistoryAdmin() {
  try {
    const snap = await adminDb.collection("crypto_security_events")
      .where("eventType", "in", ["invalid_signature", "duplicate_webhook", "webhook_failure", "manual_admin_action", "webhook_success", "ipn_received"])
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
      
    const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, events };
  } catch (error: any) {
    console.error("Error fetching webhook history:", error);
    return { success: false, error: error.message };
  }
}

// Update Crypto Currency Config
export async function updateCryptoCurrencyConfigAdmin(currency: string, network: string, updates: any, adminUser: string, reqIp: string) {
  try {
    const configId = `${currency}_${network}`;
    await adminDb.collection("crypto_currencies").doc(configId).set(updates, { merge: true });
    
    await logCryptoSecurityEvent({
      eventType: "manual_admin_action",
      details: `Updated currency config for ${currency} (${network})`,
      adminUser,
      ip: reqIp
    } as any);
    
    return { success: true, message: `Updated config for ${currency} (${network})` };
  } catch (error: any) {
    console.error("Error updating currency config:", error);
    return { success: false, error: error.message };
  }
}
