import { db } from "./firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { sendNotification } from "./notifications";

export interface AffiliateTierInfo {
  tierName: "Bronze Starter" | "Silver Partner" | "Gold Ambassador" | "Diamond Elite";
  tierLevel: 1 | 2 | 3 | 4;
  ratePercent: number;
  minReferrals: number;
  maxReferrals: number;
  nextTierName?: string;
  referralsNeededForNextTier: number;
  colorClass: string;
  badgeBg: string;
  borderClass: string;
}

/**
 * Calculates current affiliate VIP tier and effective commission rate
 */
export function getAffiliateTier(
  referralCount: number = 0,
  baseRate: number = 5,
  customOverrideRate?: number
): AffiliateTierInfo {
  if (typeof customOverrideRate === "number" && customOverrideRate > 0) {
    return {
      tierName: "Diamond Elite",
      tierLevel: 4,
      ratePercent: customOverrideRate,
      minReferrals: 0,
      maxReferrals: Infinity,
      referralsNeededForNextTier: 0,
      colorClass: "text-amber-500",
      badgeBg: "bg-amber-500/10 text-amber-600",
      borderClass: "border-amber-500/30"
    };
  }

  const base = Math.max(1, baseRate || 5);

  if (referralCount >= 50) {
    return {
      tierName: "Diamond Elite",
      tierLevel: 4,
      ratePercent: Number((base + 7.5).toFixed(1)), // e.g. 12.5%
      minReferrals: 50,
      maxReferrals: Infinity,
      referralsNeededForNextTier: 0,
      colorClass: "text-purple-600",
      badgeBg: "bg-purple-50 text-purple-700",
      borderClass: "border-purple-200"
    };
  }

  if (referralCount >= 20) {
    return {
      tierName: "Gold Ambassador",
      tierLevel: 3,
      ratePercent: Number((base + 5.0).toFixed(1)), // e.g. 10%
      minReferrals: 20,
      maxReferrals: 49,
      nextTierName: "Diamond Elite (12.5%)",
      referralsNeededForNextTier: 50 - referralCount,
      colorClass: "text-amber-600",
      badgeBg: "bg-amber-50 text-amber-700",
      borderClass: "border-amber-200"
    };
  }

  if (referralCount >= 5) {
    return {
      tierName: "Silver Partner",
      tierLevel: 2,
      ratePercent: Number((base + 2.5).toFixed(1)), // e.g. 7.5%
      minReferrals: 5,
      maxReferrals: 19,
      nextTierName: "Gold Ambassador (10%)",
      referralsNeededForNextTier: 20 - referralCount,
      colorClass: "text-sky-600",
      badgeBg: "bg-sky-50 text-sky-700",
      borderClass: "border-sky-200"
    };
  }

  return {
    tierName: "Bronze Starter",
    tierLevel: 1,
    ratePercent: base, // e.g. 5%
    minReferrals: 0,
    maxReferrals: 4,
    nextTierName: "Silver Partner (7.5%)",
    referralsNeededForNextTier: 5 - referralCount,
    colorClass: "text-emerald-600",
    badgeBg: "bg-emerald-50 text-emerald-700",
    borderClass: "border-emerald-200"
  };
}

/**
 * Calculates simulated monthly & annual passive income projections
 */
export function calculateAffiliateProjection(
  refereeCount: number,
  avgDepositPkr: number,
  ratePercent: number,
  usdRate: number = 278
) {
  const totalVolumePkr = refereeCount * avgDepositPkr;
  const totalVolumeUsd = totalVolumePkr / usdRate;

  const monthlyEarningsPkr = totalVolumePkr * (ratePercent / 100);
  const monthlyEarningsUsd = totalVolumeUsd * (ratePercent / 100);

  const yearlyEarningsPkr = monthlyEarningsPkr * 12;
  const yearlyEarningsUsd = monthlyEarningsUsd * 12;

  return {
    monthlyEarningsPkr,
    monthlyEarningsUsd,
    yearlyEarningsPkr,
    yearlyEarningsUsd,
    totalVolumePkr,
    totalVolumeUsd
  };
}

/**
 * Automatically calculates and credits real-time commission to the referrer
 */
export async function processReferralCommission(
  depositUserId: string,
  depositAmountPkr: number,
  usdTopup: number,
  depositMethod: string,
  depositUsername?: string
) {
  try {
    const userRef = doc(db, "users", depositUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.warn(`[Referral System] User ${depositUserId} snap does not exist.`);
      return;
    }

    const userData = userSnap.data();
    const referredByCode = userData.referredBy;
    if (!referredByCode || typeof referredByCode !== "string" || !referredByCode.trim()) {
      return; // No referrer for this user
    }

    const cleanRef = referredByCode.trim();

    // Find referrer by referralCode, username, usernameLower, or id
    let referrerDoc: any = null;
    let referrerData: any = null;

    // 1. Check referralCode exact match
    const q1 = query(collection(db, "users"), where("referralCode", "==", cleanRef));
    const s1 = await getDocs(q1);
    if (!s1.empty) {
      referrerDoc = s1.docs[0];
      referrerData = referrerDoc.data();
    } else {
      // 2. Check username match
      const q2 = query(collection(db, "users"), where("username", "==", cleanRef));
      const s2 = await getDocs(q2);
      if (!s2.empty) {
        referrerDoc = s2.docs[0];
        referrerData = referrerDoc.data();
      } else {
        // 3. Check usernameLower match
        const q3 = query(collection(db, "users"), where("usernameLower", "==", cleanRef.toLowerCase()));
        const s3 = await getDocs(q3);
        if (!s3.empty) {
          referrerDoc = s3.docs[0];
          referrerData = referrerDoc.data();
        } else {
          // 4. Check direct document ID
          try {
            const refByIdSnap = await getDoc(doc(db, "users", cleanRef));
            if (refByIdSnap.exists()) {
              referrerDoc = refByIdSnap;
              referrerData = refByIdSnap.data();
            }
          } catch (e) {
            // Ignore id check failure
          }
        }
      }
    }

    if (!referrerDoc || !referrerData) {
      console.log(`[Referral System] Referrer '${cleanRef}' not found in database.`);
      return;
    }

    // Prevent self-referral
    if (referrerDoc.id === depositUserId) {
      console.warn(`[Referral System] Self-referral detected for user ${depositUserId}. Commission skipped.`);
      return;
    }

    // Get global referral base commission rate setting (default 5%)
    let baseCommissionRate = 5;
    try {
      const configSnap = await getDoc(doc(db, "settings", "zerox_config"));
      if (configSnap.exists() && typeof configSnap.data().referralCommissionRate === "number") {
        baseCommissionRate = configSnap.data().referralCommissionRate;
      }
    } catch (e) {
      console.error("Error reading referral commission rate config:", e);
    }

    const currentRefCount = typeof referrerData.referralCount === "number" ? referrerData.referralCount : 0;
    const tierInfo = getAffiliateTier(currentRefCount, baseCommissionRate, referrerData.customCommissionRate);
    const finalCommissionRate = tierInfo.ratePercent;

    if (finalCommissionRate <= 0) return;

    const commissionUsd = Number((usdTopup * (finalCommissionRate / 100)).toFixed(2));
    const commissionPkr = Number((depositAmountPkr * (finalCommissionRate / 100)).toFixed(2));

    if (commissionUsd <= 0) return;

    // Update Referrer Balance and Extended Affiliate Stats
    const oldBal = typeof referrerData.balance === "number" ? referrerData.balance : 0;
    const newBal = Number((oldBal + commissionUsd).toFixed(2));
    const oldEarnings = typeof referrerData.referralEarnings === "number" ? referrerData.referralEarnings : 0;
    const newEarnings = Number((oldEarnings + commissionUsd).toFixed(2));
    const oldVolUsd = typeof referrerData.referralVolumeUsd === "number" ? referrerData.referralVolumeUsd : 0;
    const newVolUsd = Number((oldVolUsd + usdTopup).toFixed(2));

    await updateDoc(doc(db, "users", referrerDoc.id), {
      balance: newBal,
      referralEarnings: newEarnings,
      referralVolumeUsd: newVolUsd,
      lastCommissionAt: new Date().toISOString(),
      affiliateTier: tierInfo.tierName
    });

    // Log Referral Commission Record
    await addDoc(collection(db, "referral_commissions"), {
      referrerId: referrerDoc.id,
      referrerUsername: referrerData.username,
      refereeId: depositUserId,
      refereeUsername: userData.username || depositUsername || "User",
      depositAmountPkr: depositAmountPkr,
      depositAmountUsd: usdTopup,
      commissionRatePercent: finalCommissionRate,
      tierName: tierInfo.tierName,
      commissionEarnedUsd: commissionUsd,
      commissionEarnedPkr: commissionPkr,
      depositMethod: depositMethod,
      createdAt: new Date().toISOString()
    });

    // Send Realtime In-App Notification to Referrer
    sendNotification(
      referrerDoc.id,
      referrerData.email || "",
      referrerData.username || "Affiliate",
      `🎉 ${tierInfo.tierName} Affiliate Commission!`,
      `You earned ${commissionUsd} units (₨ ${commissionPkr.toLocaleString()}) commission (${finalCommissionRate}% rate) from @${userData.username || depositUsername || "Friend"}'s ${depositMethod} deposit!`
    );

    // Trigger Referral Success Email Alert
    fetch("/api/email/referral-success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toEmail: referrerData.email,
        username: referrerData.username,
        friendName: userData.username || depositUsername || "Friend",
        rewardAmount: `₨ ${commissionPkr.toLocaleString()} (${commissionUsd} units)`,
        tierName: tierInfo.tierName,
        ratePercent: finalCommissionRate
      })
    }).catch(err => console.error("Referral commission email failed", err));

    console.log(`[Referral System] Awarded ${commissionUsd} units (${finalCommissionRate}%) commission [${tierInfo.tierName}] to referrer @${referrerData.username} from @${userData.username}'s deposit.`);
  } catch (error) {
    console.error("Failed to process referral commission:", error);
  }
}
