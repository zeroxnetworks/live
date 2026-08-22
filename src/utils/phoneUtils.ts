import { popularCountries } from "../data/countries";

export interface ParsedPhone {
  full: string;
  local: string;
  display: string;
  countryCode: string;
}

export function getCountryDetails(countryKey: string = "") {
  const cleanKey = (countryKey || "").toLowerCase().trim();
  const matched = popularCountries.find(
    c => c.key.toLowerCase() === cleanKey ||
         c.name.toLowerCase() === cleanKey ||
         cleanKey.includes(c.key.toLowerCase())
  );

  if (matched) {
    return {
      name: matched.name,
      emoji: matched.emoji,
      code: matched.code
    };
  }

  // Fallback for common aliases
  if (cleanKey === "us" || cleanKey === "usa" || cleanKey === "united states") {
    return { name: "United States", emoji: "🇺🇸", code: "+1" };
  }
  if (cleanKey === "uk" || cleanKey === "england" || cleanKey === "gb" || cleanKey === "united kingdom") {
    return { name: "United Kingdom", emoji: "🇬🇧", code: "+44" };
  }
  if (cleanKey === "pk" || cleanKey === "pakistan") {
    return { name: "Pakistan", emoji: "🇵🇰", code: "+92" };
  }

  return {
    name: countryKey ? countryKey.charAt(0).toUpperCase() + countryKey.slice(1) : "International",
    emoji: "🌐",
    code: ""
  };
}

export function parsePhoneNumber(rawPhone: string = "", countryKey: string = ""): ParsedPhone {
  if (!rawPhone) {
    return { full: "", local: "", display: "N/A", countryCode: "" };
  }

  let digitsOnly = rawPhone.replace(/\D/g, "");
  let fullWithPlus = rawPhone.startsWith("+") ? rawPhone.replace(/[^\d+]/g, "") : `+${digitsOnly}`;

  // Find country code
  const countryInfo = getCountryDetails(countryKey);
  let dialDigits = countryInfo.code.replace(/\D/g, "");

  let local = digitsOnly;

  if (dialDigits && digitsOnly.startsWith(dialDigits)) {
    local = digitsOnly.slice(dialDigits.length);
  } else {
    // Check known international prefixes if country code wasn't an exact match
    const knownPrefixes = ["1", "44", "92", "7", "49", "33", "55", "84", "62", "380", "34", "39", "90", "234", "20", "63", "52", "57", "54", "880", "27", "40", "48", "60", "66", "212", "46", "31", "970", "93", "355", "213", "244", "374", "61", "43", "994", "973", "375", "32", "229", "591", "387", "359", "855", "237", "56", "86", "506", "385", "357", "420", "45"];
    for (const p of knownPrefixes) {
      if (digitsOnly.startsWith(p) && digitsOnly.length > p.length + 6) {
        dialDigits = p;
        local = digitsOnly.slice(p.length);
        break;
      }
    }
  }

  // Format nicely for display (e.g., +1 365 819 3694 or +44 7449 878218)
  let formattedDisplay = fullWithPlus;
  if (dialDigits && local) {
    if (local.length === 10) {
      formattedDisplay = `+${dialDigits} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    } else if (local.length === 9) {
      formattedDisplay = `+${dialDigits} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    } else if (local.length >= 7) {
      formattedDisplay = `+${dialDigits} ${local.slice(0, 4)} ${local.slice(4)}`;
    }
  }

  return {
    full: fullWithPlus,
    local: local || digitsOnly,
    display: formattedDisplay,
    countryCode: dialDigits ? `+${dialDigits}` : ""
  };
}
