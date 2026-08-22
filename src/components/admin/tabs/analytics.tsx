import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../AdminContext';
import EnterpriseAnalytics from "../../EnterpriseAnalytics";
import { SubscriptionOrder, SubscriptionProduct, ReviewItem, PrivacyPolicyData } from '../../../types';
import { DEFAULT_REVIEWS, DEFAULT_PRIVACY_POLICY } from '../../../lib/reviewsAndPolicyStore';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AdminErrorBoundary } from '../AdminErrorBoundary';

export default function AnalyticsTab() {
  const ctx = useAdminContext();
  const { 
    announcements, orders, registeredUsers, depositRequests, smmServices, smmProviders, smsProviders, customServices, smmOrders, onClose, formatPrice
  } = ctx;

  const [subOrders, setSubOrders] = useState<SubscriptionOrder[]>([]);
  const [subProducts, setSubProducts] = useState<SubscriptionProduct[]>([]);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [policyData, setPolicyData] = useState<PrivacyPolicyData>(DEFAULT_PRIVACY_POLICY);

  useEffect(() => {
    // 1. Subscription Orders
    const unsubSubOrders = onSnapshot(collection(db, "subscription_orders"), (snap) => {
      const ords: SubscriptionOrder[] = [];
      snap.forEach(d => ords.push({ id: d.id, ...d.data() } as SubscriptionOrder));
      setSubOrders(ords);
    }, (err) => console.warn("Sub orders snapshot warning", err));

    // 2. Subscription Products
    const unsubSubProds = onSnapshot(collection(db, "subscription_products"), (snap) => {
      const prods: SubscriptionProduct[] = [];
      snap.forEach(d => prods.push({ id: d.id, ...d.data() } as SubscriptionProduct));
      setSubProducts(prods);
    }, (err) => console.warn("Sub prods snapshot warning", err));

    // 3. Reviews
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snap) => {
      if (!snap.empty) {
        const revs: ReviewItem[] = [];
        snap.forEach(d => revs.push({ id: d.id, ...d.data() } as ReviewItem));
        revs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviewsList(revs);
      }
    }, (err) => console.warn("Reviews snapshot warning", err));

    // 4. Privacy Policy
    getDoc(doc(db, "settings", "privacy_policy")).then((snap) => {
      if (snap.exists()) {
        setPolicyData(snap.data() as PrivacyPolicyData);
      }
    }).catch((err) => console.warn("Privacy policy fetch warning", err));

    return () => {
      unsubSubOrders();
      unsubSubProds();
      unsubReviews();
    };
  }, []);

  return (
    <AdminErrorBoundary tabName="Analytics Management">
      <div className="animate-fade-in">
        <EnterpriseAnalytics 
          orders={orders} 
          users={registeredUsers} 
          smmOrders={smmOrders} 
          depositRequests={depositRequests}
          smmServices={smmServices}
          smmProviders={smmProviders}
          smsProviders={smsProviders}
          customServices={customServices}
          announcements={announcements}
          subscriptionOrders={subOrders}
          subscriptionProducts={subProducts}
          reviews={reviewsList}
          privacyPolicy={policyData}
          onClose={onClose} 
          formatPrice={formatPrice}
        />
      </div>
    </AdminErrorBoundary>
  );
}
