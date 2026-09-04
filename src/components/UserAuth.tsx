import React, { useState, useEffect, useRef } from "react";
import { User, Lock, LogIn, UserPlus, Mail, Shield, UserCheck, LogOut, Check, Settings, ShieldCheck, Wallet, Copy, AlertTriangle, Key, Eye, EyeOff, Phone, X, CheckCircle2, Loader2 } from "lucide-react";
import { UserAccount } from "../types";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { evaluatePasswordStrength } from "../lib/passwordUtils";
import { ZeroxAuthGuide, AuthFlowStep } from "./ZeroxAuthGuide";
import { ZXLogo } from "./ZXLogo";

interface UserAuthProps {
  cryptoRate?: number;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onClose?: () => void;
  initialIsSignUp?: boolean;
  initialReferralCode?: string;
}

export default function UserAuth({
  currentUser,
  onLogin,
  onLogout,
  onClose,
  initialIsSignUp,
  initialReferralCode,
}: UserAuthProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(() => {
    if (initialIsSignUp !== undefined) return initialIsSignUp;
    try {
      if (typeof window !== "undefined") {
        const search = new URLSearchParams(window.location.search);
        return search.get("register") === "true" || search.get("signup") === "true" || !!search.get("ref");
      }
    } catch {}
    return false;
  });

  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState<string>(() => {
    if (initialReferralCode) return initialReferralCode;
    try {
      if (typeof window !== "undefined") {
        const search = new URLSearchParams(window.location.search);
        const urlRef = search.get("ref") || search.get("referral") || search.get("refCode");
        if (urlRef) return urlRef.trim();
        const storedRef = localStorage.getItem("zerox_ref_code") || sessionStorage.getItem("zerox_ref_code");
        if (storedRef) return storedRef.trim();
      }
    } catch {}
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [resetOtpMode, setResetOtpMode] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Email OTP Verification state
  const [registrationOtpStep, setRegistrationOtpStep] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState("");
  const [resendCooldownTimer, setResendCooldownTimer] = useState<number>(0);

  const [authNotice, setAuthNotice] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  // Real-time Zerox Guide Step & Live Field Validation states
  const [guideStep, setGuideStep] = useState<AuthFlowStep>("MODE_SELECT");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMsg, setUsernameMsg] = useState<string>("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [emailMsg, setEmailMsg] = useState<string>("");

  const usernameCheckTimerRef = useRef<any>(null);
  const emailCheckTimerRef = useRef<any>(null);

  // Debounced real-time username availability check
  useEffect(() => {
    if (!isSignUp || !username.trim()) {
      setUsernameStatus("idle");
      setUsernameMsg("");
      return;
    }

    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus("invalid");
      setUsernameMsg("Minimum 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(clean)) {
      setUsernameStatus("invalid");
      setUsernameMsg("Use letters, numbers, _, -");
      return;
    }

    setUsernameStatus("checking");
    if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);

    usernameCheckTimerRef.current = setTimeout(async () => {
      try {
        // Redundant client-side firestore query
        const usersRef = collection(db, "users");
        const [snap1, snap2] = await Promise.all([
          getDocs(query(usersRef, where("username", "==", username.trim()))).catch(() => null),
          getDocs(query(usersRef, where("usernameLower", "==", clean))).catch(() => null)
        ]);

        if ((snap1 && !snap1.empty) || (snap2 && !snap2.empty)) {
          setUsernameStatus("taken");
          setUsernameMsg("Username already exists");
          return;
        }

        const res = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: clean })
        });
        const data = await res.json();
        if (data.usernameAvailable) {
          setUsernameStatus("available");
          setUsernameMsg("Username available");
        } else {
          setUsernameStatus("taken");
          setUsernameMsg(data.usernameMessage || "Username already taken");
        }
      } catch (err) {
        setUsernameStatus("idle");
      }
    }, 350);

    return () => {
      if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
    };
  }, [username, isSignUp]);

  // Debounced real-time email availability check
  useEffect(() => {
    if (!isSignUp || !email.trim()) {
      setEmailStatus("idle");
      setEmailMsg("");
      return;
    }

    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setEmailStatus("invalid");
      setEmailMsg("Enter a valid email");
      return;
    }

    setEmailStatus("checking");
    if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);

    emailCheckTimerRef.current = setTimeout(async () => {
      try {
        // Redundant client-side firestore check
        const usersRef = collection(db, "users");
        const emailSnap = await getDocs(query(usersRef, where("email", "==", clean))).catch(() => null);
        if (emailSnap && !emailSnap.empty) {
          setEmailStatus("taken");
          setEmailMsg("Email already registered");
          return;
        }

        const res = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: clean })
        });
        const data = await res.json();
        if (data.emailAvailable) {
          setEmailStatus("available");
          setEmailMsg("Email available");
        } else {
          setEmailStatus("taken");
          setEmailMsg(data.emailMessage || "Email already registered");
        }
      } catch (err) {
        setEmailStatus("idle");
      }
    }, 350);

    return () => {
      if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
    };
  }, [email, isSignUp]);

  // Real-time password evaluation
  const passwordEvaluation = isSignUp && password ? evaluatePasswordStrength(password) : null;

  React.useEffect(() => {
    if (initialIsSignUp !== undefined) {
      setIsSignUp(initialIsSignUp);
    }
  }, [initialIsSignUp]);

  React.useEffect(() => {
    if (initialReferralCode) {
      setReferralCodeInput(initialReferralCode);
    }
  }, [initialReferralCode]);

  React.useEffect(() => {
    let interval: any;
    if (resendCooldownTimer > 0) {
      interval = setInterval(() => {
        setResendCooldownTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldownTimer]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref") || params.get("referral");
    if (refParam) {
      localStorage.setItem("zerox_referred_by", refParam.trim());
      setReferralCodeInput(refParam.trim());
    } else {
      const savedRef = localStorage.getItem("zerox_referred_by");
      if (savedRef) {
        setReferralCodeInput(savedRef);
      }
    }
  }, []);

  const showFeedback = (type: "error" | "success", msg: string) => {
    setAuthNotice({ type, msg });
    if (type === "error") {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
  };

  const fetchUserDocument = async (uid: string) => {
    try {
      let userDoc = await getDoc(doc(db, "users", uid));
      let data = userDoc.exists() ? userDoc.data() : null;

      // Auto-healing fallback: If user document does not exist at users/{uid}, search by email or create standard doc
      if (!data) {
        const currentUserEmail = auth.currentUser?.email?.toLowerCase();
        if (currentUserEmail) {
          try {
            const q = query(collection(db, "users"), where("email", "==", currentUserEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
              data = snap.docs[0].data();
              // Merge into users/{uid} so future lookups find it instantly
              await setDoc(doc(db, "users", uid), data, { merge: true });
            }
          } catch (e) {
            console.warn("Email lookup fallback error:", e);
          }
        }

        // If still no document, generate default active account document
        if (!data) {
          const defaultUsername = auth.currentUser?.displayName?.replace(/\s+/g, '') || auth.currentUser?.email?.split("@")[0] || "User";
          data = {
            fullName: auth.currentUser?.displayName || defaultUsername,
            whatsappNumber: "",
            email: auth.currentUser?.email || "",
            username: defaultUsername,
            usernameLower: defaultUsername.toLowerCase(),
            balance: 0,
            status: "Active",
            isVerified: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", uid), data);
        }
      }

      const isImmuneAdmin = data.email?.toLowerCase() === "zeroxnetworks@gmail.com" || data.email?.toLowerCase() === "pandapals.manager@gmail.com" || data.email?.toLowerCase() === "info.rayanmirza@gmail.com";

      if (!isImmuneAdmin && data.status === "Blocked") {
        try { await signOut(auth); } catch(e) {}
        localStorage.removeItem("zerox_local_user_id");
        localStorage.removeItem("zerox_user_account");
        toast.error("Your account has been blocked. Please contact support.");
        return false;
      }
      if (!isImmuneAdmin && data.status === "Suspended") {
        try { await signOut(auth); } catch(e) {}
        localStorage.removeItem("zerox_local_user_id");
        localStorage.removeItem("zerox_user_account");
        toast.error("Your account has been suspended.");
        return false;
      }

      localStorage.setItem("zerox_local_user_id", uid);
      
      // Trigger Login Email Alert
      fetch("/api/email/login-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: data.email,
          username: data.username,
          device: navigator.userAgent.split(')')[0].split('(')[1] || "Web Browser",
          ip: "Current Session",
          time: new Date().toLocaleString()
        })
      }).catch(err => console.error("Login alert failed", err));

      onLogin({
        id: uid,
        username: data.username,
        email: data.email,
        balance: data.balance,
        createdAt: data.createdAt,
        fullName: data.fullName,
        whatsappNumber: data.whatsappNumber,
        status: data.status || "Active"
      });
      return true;
    } catch (err) {
      console.error("Error fetching user", err);
      return false;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);

    if (!fullName.trim()) return showFeedback("error", "Full Name is required.");
    if (!whatsappNumber.trim()) return showFeedback("error", "WhatsApp number is required.");
    if (!username.trim()) return showFeedback("error", "Username is required.");
    if (usernameStatus === "taken") {
      return showFeedback("error", usernameMsg || "Username already exists. Please choose another username.");
    }
    if (!email.trim()) return showFeedback("error", "Email Address is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return showFeedback("error", "Please enter a valid email address.");
    if (emailStatus === "taken") {
      return showFeedback("error", emailMsg || "Email already registered. Please log in or use another email.");
    }
    if (!password) return showFeedback("error", "Password is required.");
    const passEval = evaluatePasswordStrength(password);
    if (!passEval.isValid) {
      return showFeedback("error", passEval.feedback);
    }
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const cleanUsername = username.trim();
      const cleanEmail = email.toLowerCase().trim();
      const cleanWhatsapp = whatsappNumber.trim();
      
      // 1. Check for duplicate username in Firestore (case-insensitive)
      try {
        const [snap1, snap2] = await Promise.all([
          getDocs(query(usersRef, where("username", "==", cleanUsername))).catch(() => null),
          getDocs(query(usersRef, where("usernameLower", "==", cleanUsername.toLowerCase()))).catch(() => null)
        ]);

        if ((snap1 && !snap1.empty) || (snap2 && !snap2.empty)) {
          setUsernameStatus("taken");
          setUsernameMsg("This username is already taken. Please choose another username.");
          showFeedback("error", "Username already exists.");
          setLoading(false);
          return;
        }
      } catch (qErr) {
        console.warn("Username query note:", qErr);
      }

      // 2. Check for duplicate email in Firestore
      try {
        const emailQ = query(usersRef, where("email", "==", cleanEmail));
        const emailSnapshot = await getDocs(emailQ);
        if (!emailSnapshot.empty) {
          setEmailStatus("taken");
          setEmailMsg("This email is already registered. Please log in.");
          showFeedback("error", "Email already exists.");
          setLoading(false);
          return;
        }
      } catch (eErr) {
        console.warn("Email query note:", eErr);
      }

      // 3. Send Registration OTP via Email Security Engine (from zeroxnetworks@gmail.com)
      const res = await fetch("/api/auth/send-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: cleanUsername,
          email: cleanEmail,
          whatsappNumber: cleanWhatsapp,
          password
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.message || "Failed to dispatch email verification code.";
        if (errMsg.toLowerCase().includes("username")) {
          setUsernameStatus("taken");
          setUsernameMsg(errMsg);
        }
        if (errMsg.toLowerCase().includes("email")) {
          setEmailStatus("taken");
          setEmailMsg(errMsg);
        }
        throw new Error(errMsg);
      }

      setRegistrationOtpStep(true);
      setResendCooldownTimer(data.cooldownSeconds || 60);
      showFeedback("success", `A 6-digit verification code was sent from zeroxnetworks@gmail.com to ${cleanEmail}!`);
    } catch (err: any) {
      console.error("Register Error:", err);
      showFeedback("error", err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);

    if (!regOtpCode || regOtpCode.trim().length !== 6) {
      return showFeedback("error", "Please enter the 6-digit verification code sent to your email.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          whatsappNumber: whatsappNumber.trim(),
          otp: regOtpCode.trim(),
          fullName: fullName.trim(),
          username: username.trim(),
          password,
          referralCode: referralCodeInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email verification code.");
      }

      const userData = data.user;
      localStorage.setItem("zerox_local_user_id", userData.id);
      
      onLogin({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        balance: userData.balance || 0,
        loyaltyPoints: userData.loyaltyPoints || 0,
        createdAt: userData.createdAt,
        fullName: userData.fullName,
        whatsappNumber: userData.whatsappNumber,
        status: userData.status || "Active"
      });

      showFeedback("success", "Account verified and activated! Welcome to ZeroX Network.");
      setRegistrationOtpStep(false);
      setRegOtpCode("");
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Verify Registration OTP Error:", err);
      showFeedback("error", err.message || "Failed to verify email code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    if (resendCooldownTimer > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.toLowerCase().trim(),
          whatsappNumber: whatsappNumber.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to resend code.");
      }

      setResendCooldownTimer(data.cooldownSeconds || 60);
      showFeedback("success", "A new 6-digit verification code has been dispatched to your email!");
    } catch (err: any) {
      showFeedback("error", err.message || "Unable to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);
    const loginInput = username.trim();
    if (!loginInput) return showFeedback("error", "Email or Username is required.");
    if (!password) return showFeedback("error", "Password is required.");
    
    setLoading(true);
    try {
      // 1. Authenticate via secure backend login API (PBKDF2 salted hash verification with seamless legacy migration)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginInput, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback("error", data.message || "Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      const userAccount = data.user;
      localStorage.setItem("zerox_local_user_id", userAccount.id);
      localStorage.setItem("zerox_user_account", JSON.stringify(userAccount));

      // 2. Also attempt Firebase Auth client sign-in in background if applicable (silent catch)
      if (userAccount.email) {
        signInWithEmailAndPassword(auth, userAccount.email, password).catch(() => {});
      }

      onLogin(userAccount);
      showFeedback("success", "Logged in successfully!");
    } catch (err: any) {
      console.error("Login catch error:", err);
      if (err?.code === "auth/network-request-failed" || err?.message?.toLowerCase().includes("network")) {
        showFeedback("error", "Network error. Please check your internet connection.");
      } else {
        showFeedback("error", err?.message || "Login failed. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);
    const targetInput = (forgotEmail || resetEmail).trim();
    if (!targetInput) {
      return showFeedback("error", "Please enter your registered email address.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetInput })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset email.");
      }
      
      showFeedback("success", data.message || "A 6-digit verification code has been sent from zeroxnetworks@gmail.com to your email address.");
      setResetOtpMode(true);
    } catch (err: any) {
      console.error("Send Reset Email Error:", err);
      showFeedback("error", err.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);
    const targetInput = (forgotEmail || resetEmail).trim();
    if (!resetOtp || !newPassword) {
      return showFeedback("error", "Please enter the 6-digit OTP verification code and your new password.");
    }

    const passEval = evaluatePasswordStrength(newPassword);
    if (!passEval.isValid) {
      return showFeedback("error", passEval.feedback);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetInput, otp: resetOtp.trim(), newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid OTP or failed to reset password");
      }
      showFeedback("success", "Password updated successfully! You can now log in with your new password.");
      setForgotEmail("");
      setResetEmail("");
      setResetOtp("");
      setNewPassword("");
      setResetOtpMode(false);
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error("Verify Recovery OTP error:", err);
      showFeedback("error", err.message || "Invalid verification code or password fails formula.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
      const user = result.user;
      const uid = user.uid;
      const userEmail = (user.email || "").toLowerCase().trim();
      const displayName = user.displayName || "";
      const defaultUsername = displayName.replace(/\s+/g, '') || userEmail.split("@")[0] || "User";

      // 1. Check if user document already exists at users/{uid}
      let userDoc = await getDoc(doc(db, "users", uid));
      let data = userDoc.exists() ? userDoc.data() : null;

      // 2. If not found by UID, check if this user previously registered with this email
      if (!data && userEmail) {
        try {
          const q = query(collection(db, "users"), where("email", "==", userEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const existingDoc = snap.docs[0];
            data = existingDoc.data();
            // Merge existing data into users/{uid} so user keeps their balance, orders, and profile
            await setDoc(doc(db, "users", uid), {
              ...data,
              isVerified: true,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (e) {
          console.warn("Email lookup fallback error on Google sign-in:", e);
        }
      }

      // 3. If brand new user, create their document
      if (!data) {
        const newDbUser = {
          fullName: displayName || defaultUsername,
          whatsappNumber: "",
          email: userEmail,
          username: defaultUsername,
          usernameLower: defaultUsername.toLowerCase(),
          balance: 0,
          loyaltyPoints: 0,
          isVerified: true,
          status: "Active",
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", uid), newDbUser);
        data = newDbUser;
        
        // Trigger Admin Email Alert for New Google User Registration
        fetch("/api/email/admin-new-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: newDbUser.username,
            email: newDbUser.email,
            fullName: newDbUser.fullName || "Google User",
            whatsappNumber: "N/A",
            referralCodeUsed: "None",
            isGoogle: true
          })
        }).catch(err => console.error("Admin user email alert failed", err));

        fetch("/api/admin/alert/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_user",
            details: `Username: ${newDbUser.username}\nEmail: ${newDbUser.email}\nFull Name: ${newDbUser.fullName || "Google User"}\nRegistration Method: Google OAuth`
          })
        }).catch(err => console.error("Admin alert failed", err));

        // Trigger Welcome Email to User
        fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: newDbUser.email,
            username: newDbUser.username
          })
        }).catch(err => console.error("Welcome email failed", err));

        toast.success("Account created via Google! Welcome to Zerox Network.");
      } else {
        const isImmuneAdmin = (data.email || userEmail || "").toLowerCase() === "zeroxnetworks@gmail.com" || 
                              (data.email || userEmail || "").toLowerCase() === "pandapals.manager@gmail.com" || 
                              (data.email || userEmail || "").toLowerCase() === "info.rayanmirza@gmail.com";
        if (!isImmuneAdmin && (data.status === "Blocked" || data.status === "Suspended")) {
          await signOut(auth);
          localStorage.removeItem("zerox_local_user_id");
          localStorage.removeItem("zerox_user_account");
          return toast.error(`Your account has been ${data.status.toLowerCase()}. Please contact support.`);
        }
        toast.success("Logged in via Google!");
      }

      // Store local session identifiers
      localStorage.setItem("zerox_local_user_id", uid);
      const userAccount: UserAccount = {
        id: uid,
        username: data.username || defaultUsername,
        email: data.email || userEmail,
        balance: data.balance || 0,
        loyaltyPoints: data.loyaltyPoints || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        fullName: data.fullName || displayName || defaultUsername,
        whatsappNumber: data.whatsappNumber || "",
        status: data.status || "Active"
      };
      localStorage.setItem("zerox_user_account", JSON.stringify(userAccount));

      // Trigger Login Email Alert
      fetch("/api/email/login-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: data.email || userEmail,
          username: data.username || defaultUsername,
          device: navigator.userAgent.split(')')[0].split('(')[1] || "Web Browser",
          ip: "Current Session",
          time: new Date().toLocaleString()
        })
      }).catch(err => console.error("Login alert failed", err));

      onLogin(userAccount);
      if (onClose) onClose();
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // User closed or dismissed the popup without completing sign-in
        console.info("Google sign-in popup was closed by user.");
        return;
      }
      console.error("Google sign-in error:", err);
      if (err?.code === "auth/popup-blocked") {
        toast.error("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err?.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized in Firebase Authentication.");
      } else {
        toast.error(err?.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    localStorage.removeItem("zerox_local_user_id");
    localStorage.removeItem("zerox_user_account");
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("SignOut warning:", err);
    }
    onLogout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800/80 rounded-t-[28px] sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col h-full max-h-full">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#00AEEF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Mobile Pull Handle */}
      <div className="sm:hidden w-12 h-1 rounded-full bg-slate-700/60 mx-auto mt-2 mb-1 shrink-0" />

      {/* Clean Header with Logo, Title and Safe Close Button */}
      <div className="px-4 sm:px-6 pt-2 sm:pt-4 pb-3 border-b border-slate-800/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center p-1 shrink-0 shadow-inner">
            <ZXLogo size={20} withBackground={false} interactive={false} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white tracking-wide font-mono truncate">
              ZEROX NETWORK
            </h2>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {isSignUp ? "Create a verified member account" : "Sign in to access your dashboard"}
            </p>
          </div>
        </div>

        {onClose && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-sm shrink-0 ml-2"
            title="Close Login Window"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 space-y-3.5 custom-scrollbar">
          {/* Zerox Intelligent Audio & Visual Roadmap Guide */}
          <ZeroxAuthGuide
            currentStep={guideStep}
            isSignUp={isSignUp}
            registrationOtpStep={registrationOtpStep}
            usernameStatus={usernameStatus}
            usernameMsg={usernameMsg}
            emailStatus={emailStatus}
            emailMsg={emailMsg}
            passwordFeedback={passwordEvaluation}
            emailAddress={email}
            onSelectStep={(step) => setGuideStep(step)}
          />

          {/* Animated Segmented Auth Tabs */}
          <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 relative shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setGuideStep("LOGIN_MODE");
                setResetEmail("");
                setForgotEmail("");
                setShowForgotPassword(false);
                setAuthNotice(null);
              }}
              className={`relative flex-1 py-2.5 sm:py-2 min-h-[42px] rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer z-10 select-none ${
                !isSignUp
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {!isSignUp && (
                <motion.div
                  layoutId="authSegmentActivePill"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 z-[-1]"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </button>

            <button
              type="button"
              id="onboarding-signup-tab"
              onClick={() => {
                setIsSignUp(true);
                setGuideStep("MODE_SELECT");
                setResetEmail("");
                setForgotEmail("");
                setShowForgotPassword(false);
                setAuthNotice(null);
              }}
              className={`relative flex-1 py-2.5 sm:py-2 min-h-[42px] rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer z-10 select-none ${
                isSignUp
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isSignUp && (
                <motion.div
                  layoutId="authSegmentActivePill"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 z-[-1]"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <UserPlus className="h-4 w-4" />
              <span>Sign Up</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authNotice && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 transition-all ${
                  authNotice.type === "error"
                    ? "bg-red-950/50 border-red-500/30 text-red-200"
                    : "bg-emerald-950/50 border-emerald-500/30 text-emerald-200"
                }`}
              >
                {authNotice.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="leading-snug text-xs sm:text-[11px] font-semibold">{authNotice.msg}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthNotice(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold shrink-0 ml-1 cursor-pointer p-0.5"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {registrationOtpStep ? (
            <form onSubmit={handleVerifyRegistrationOtp} className="space-y-4">
              <div className="bg-sky-950/40 border border-[#00AEEF]/30 rounded-2xl p-4 text-center space-y-2 shadow-lg shadow-[#00AEEF]/5">
                <div className="inline-flex items-center justify-center p-3 bg-[#00AEEF]/10 text-[#00AEEF] rounded-full mb-1 border border-[#00AEEF]/20">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Email Verification Code Dispatched</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A 6-digit verification code was dispatched from <strong className="text-sky-400">zeroxnetworks@gmail.com</strong> to <strong className="text-sky-300 font-mono">{email}</strong>. Enter the code below to verify and activate your ZeroX Network account.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono text-center">
                  6-Digit Email Verification Code
                </label>
                <input
                  type="text"
                  id="onboarding-otp-input"
                  maxLength={6}
                  placeholder="123456"
                  value={regOtpCode}
                  onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="w-full text-center text-2xl font-mono tracking-[8px] font-extrabold bg-slate-900 border border-[#00AEEF]/50 text-sky-300 rounded-xl py-3 focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 shadow-inner"
                />
              </div>

              <button
                type="submit"
                id="onboarding-verify-btn"
                disabled={loading || regOtpCode.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-[#00AEEF] to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#00AEEF]/25 active:scale-[0.98]"
              >
                {loading ? "Verifying Email Code..." : "Verify & Activate Account"}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={resendCooldownTimer > 0 || loading}
                  onClick={handleResendRegistrationOtp}
                  className="text-sky-400 hover:text-sky-300 hover:underline font-semibold disabled:opacity-40"
                >
                  {resendCooldownTimer > 0 ? `Resend Code in ${resendCooldownTimer}s` : "Resend Email Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setRegistrationOtpStep(false)}
                  className="text-slate-400 hover:text-slate-200 font-medium"
                >
                  ← Change Email / Edit
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={isSignUp ? handleRegister : handleLogin} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="onboarding-fullname-input"
                      placeholder="Enter Full Name"
                      value={fullName}
                      onFocus={() => setGuideStep("FULLNAME")}
                      onChange={(e) => setFullName(e.target.value)}
                      autoCapitalize="words"
                      autoCorrect="off"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">WhatsApp Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      id="onboarding-whatsapp-input"
                      inputMode="tel"
                      placeholder="e.g. +923000000000"
                      value={whatsappNumber}
                      onFocus={() => setGuideStep("WHATSAPP")}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">Username</label>
                    {usernameStatus === "checking" && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                      </span>
                    )}
                    {usernameStatus === "available" && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                    )}
                    {usernameStatus === "taken" && (
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Already Taken
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="onboarding-username-input"
                      placeholder="Enter Username"
                      value={username}
                      onFocus={() => setGuideStep("USERNAME")}
                      onChange={(e) => setUsername(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`w-full bg-slate-900 border text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold focus:outline-none transition-all ${
                        usernameStatus === "taken"
                          ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : usernameStatus === "available"
                          ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          : "border-slate-800 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20"
                      }`}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                  {isSignUp ? "Email Address" : "Email or Username"}
                </label>
                {isSignUp && emailStatus === "checking" && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                  </span>
                )}
                {isSignUp && emailStatus === "available" && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Available
                  </span>
                )}
                {isSignUp && emailStatus === "taken" && (
                  <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Already Registered
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type={isSignUp ? "email" : "text"}
                  id="onboarding-email-input"
                  inputMode={isSignUp ? "email" : "text"}
                  placeholder={isSignUp ? "name@domain.com" : "Email or username"}
                  value={isSignUp ? email : username}
                  onFocus={() => setGuideStep("EMAIL")}
                  onChange={(e) => isSignUp ? setEmail(e.target.value) : setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full bg-slate-900 border text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold focus:outline-none transition-all ${
                    isSignUp && emailStatus === "taken"
                      ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : isSignUp && emailStatus === "available"
                      ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      : "border-slate-800 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="onboarding-password-input"
                  placeholder={isSignUp ? "e.g. Abcdef7!" : "••••••••"}
                  value={password}
                  onFocus={() => setGuideStep("PASSWORD")}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl pl-10 pr-12 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md cursor-pointer transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isSignUp && password && (
                <PasswordStrengthIndicator password={password} showDetails={true} />
              )}

              {!isSignUp && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(!showForgotPassword);
                      setForgotEmail(username.includes("@") ? username : "");
                    }}
                    className="text-xs sm:text-[10px] font-bold text-slate-400 hover:text-[#00AEEF] underline transition cursor-pointer py-1 px-1"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {showForgotPassword && !isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
              >
                {!resetOtpMode ? (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                        Reset Password Email
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Enter your registered email address. Our email system will dispatch a verification code from <strong className="text-blue-400">zeroxnetworks@gmail.com</strong>.
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="email"
                        inputMode="email"
                        placeholder="zeroxpubgstore@gmail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-3 sm:px-4 py-2.5 rounded-xl text-xs whitespace-nowrap cursor-pointer active:scale-95 shrink-0 shadow-sm"
                      >
                        {loading ? "Sending..." : "Send Reset"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                      Enter Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="6-Digit OTP Code"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none tracking-widest text-center font-mono text-lg"
                      maxLength={6}
                    />
                    <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono pt-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. Abcdef7!"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none"
                    />

                    {newPassword && (
                      <PasswordStrengthIndicator password={newPassword} showDetails={true} />
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyResetOtp}
                      disabled={loading || (newPassword ? !evaluatePasswordStrength(newPassword).isValid : false)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs cursor-pointer active:scale-95 shadow-sm mt-2"
                    >
                      {loading ? "Verifying..." : "Verify & Reset Password"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {isSignUp && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                    Referral Code (Referrer Username)
                  </label>
                  {referralCodeInput.trim() && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Auto-Applied
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <UserPlus className="h-4 w-4 text-[#00AEEF]" />
                  </span>
                  <input
                    type="text"
                    id="onboarding-referral-input"
                    placeholder="Referrer's Username (e.g. USER123)"
                    value={referralCodeInput}
                    onFocus={() => setGuideStep("REFERRAL")}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>
                {referralCodeInput.trim() && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <span className="text-emerald-400 font-bold">🎁 Linking account with @{referralCodeInput.trim()}</span>
                    <span>• Partner benefits active</span>
                  </p>
                )}
              </div>
            )}
            
            <button
              type="submit"
              id="onboarding-submit-btn"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3.5 sm:py-3 min-h-[48px] rounded-xl text-sm sm:text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                  <span>{loading ? "Creating your account..." : "Create Free Account"}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                  <span>{loading ? "Signing in..." : "Login"}</span>
                </>
              )}
            </button>
            
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink-0 mx-3 text-slate-500 text-[10px] sm:text-[9px] font-mono font-bold uppercase tracking-widest">Or Secure Link</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold py-3.5 sm:py-3 min-h-[48px] rounded-xl text-sm sm:text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
          )}
      </div>
    </div>
  );
}
