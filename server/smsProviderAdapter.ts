import express from "express";

export interface ProviderHealth {
  status: "CONNECTED" | "OFFLINE" | "ERROR" | "DEGRADED";
  responseTimeMs: number;
  balance?: number;
  rating?: number;
  error?: string;
}

export interface SmsProviderAdapter {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string;

  checkHealth(): Promise<ProviderHealth>;
  getCountries(): Promise<{ status: string; data?: any; error?: string }>;
  getPrices(country?: string): Promise<{ status: string; data?: any; error?: string }>;
  getOperators(country?: string, product?: string): Promise<{ status: string; operators?: any[]; error?: string }>;
  allocateNumber(country: string, operator: string, product: string): Promise<{ status: string; phone?: string; orderId?: string; rawData?: any; error?: string }>;
  getOrderStatus(orderId: string): Promise<{ status: string; sms?: any[]; rawStatus?: string; error?: string }>;
  cancelOrder(orderId: string): Promise<{ status: string; error?: string }>;
  finishOrder(orderId: string): Promise<{ status: string; error?: string }>;
  banNumber?(orderId: string): Promise<{ status: string; error?: string }>;
}

export class FiveSimAdapter implements SmsProviderAdapter {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string;

  constructor(id: string, name: string, apiUrl: string, apiKey?: string) {
    this.id = id || "5sim_default";
    this.name = name || "5SIM Primary Gateway";
    this.apiUrl = (apiUrl || "https://5sim.net/v1").replace(/\/+$/, "");
    this.apiKey = apiKey || process.env.PROVIDER_API_KEY || "";
  }

  private getAuthHeader(): string {
    if (!this.apiKey) return "";
    const raw = this.apiKey.trim();
    if (raw.startsWith("Bearer ")) return raw;
    return `Bearer ${raw}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const headers: Record<string, string> = { "Accept": "application/json" };
      const auth = this.getAuthHeader();
      if (auth) headers["Authorization"] = auth;

      const res = await this.fetchWithTimeout(`${this.apiUrl}/user/profile`, { headers }, 5000);
      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return { status: "ERROR", responseTimeMs: elapsed, error: "Authentication Invalid / Unauthorized API Key" };
        }
        return { status: "OFFLINE", responseTimeMs: elapsed, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json().catch(() => ({}));
      return {
        status: "CONNECTED",
        responseTimeMs: elapsed,
        balance: typeof data.balance === "number" ? data.balance : undefined,
        rating: typeof data.rating === "number" ? data.rating : undefined
      };
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      const isTimeout = err.name === "AbortError";
      return {
        status: isTimeout ? "OFFLINE" : "ERROR",
        responseTimeMs: elapsed,
        error: isTimeout ? "Provider connection timed out (5s)" : (err.message || "Network error connecting to 5SIM")
      };
    }
  }

  async getCountries(): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const res = await this.fetchWithTimeout(`${this.apiUrl}/guest/countries`, {
        headers: { "Accept": "application/json" }
      }, 6000);

      if (!res.ok) {
        return { status: "OFFLINE", error: `Provider HTTP ${res.status}` };
      }
      const data = await res.json();
      return { status: "CONNECTED", data };
    } catch (err: any) {
      return { status: "ERROR", error: err.message || "Failed to fetch countries" };
    }
  }

  async getPrices(country?: string): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const targetUrl = country
        ? `${this.apiUrl}/guest/prices?country=${encodeURIComponent(country)}`
        : `${this.apiUrl}/guest/prices`;

      const res = await this.fetchWithTimeout(targetUrl, {
        headers: { "Accept": "application/json" }
      }, 6000);

      if (!res.ok) {
        return { status: "OFFLINE", error: `Provider HTTP ${res.status}` };
      }
      const data = await res.json();
      if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
        return { status: "NO_STOCK", data: {} };
      }
      return { status: "CONNECTED", data };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      return {
        status: isTimeout ? "OFFLINE" : "ERROR",
        error: isTimeout ? "Provider catalog request timed out" : (err.message || "Failed to fetch catalog prices")
      };
    }
  }

  async getOperators(country?: string, product?: string): Promise<{ status: string; operators?: any[]; error?: string }> {
    const pricesResult = await this.getPrices(country);
    if (pricesResult.status !== "CONNECTED" || !pricesResult.data) {
      return { status: pricesResult.status, error: pricesResult.error };
    }

    let countryData = pricesResult.data;
    if (country && countryData[country]) {
      countryData = countryData[country];
    }

    const opsList: any[] = [];
    if (product && countryData[product] && typeof countryData[product] === "object") {
      const opsObj = countryData[product];
      Object.keys(opsObj).forEach((opKey) => {
        opsList.push({
          key: opKey,
          name: opKey === "any" ? "Any Operator" : opKey.charAt(0).toUpperCase() + opKey.slice(1),
          cost: opsObj[opKey]?.cost || 0,
          count: opsObj[opKey]?.count || 0
        });
      });
    }

    return { status: "CONNECTED", operators: opsList };
  }

  async allocateNumber(country: string, operator: string, product: string): Promise<{ status: string; phone?: string; orderId?: string; rawData?: any; error?: string }> {
    try {
      const targetUrl = `${this.apiUrl}/user/buy/activation/${encodeURIComponent(country)}/${encodeURIComponent(operator)}/${encodeURIComponent(product)}`;
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      const auth = this.getAuthHeader();
      if (auth) headers["Authorization"] = auth;

      const res = await this.fetchWithTimeout(targetUrl, { headers }, 10000);
      const resText = await res.text();

      if (!res.ok || resText === "no free phones" || resText === "not enough rating" || resText === "not enough user balance" || resText === "no product") {
        if (resText === "no free phones" || resText === "no product") {
          return { status: "NO_STOCK", error: "Out of stock / No free numbers available from provider" };
        }
        return { status: "ERROR", error: resText || `HTTP ${res.status}` };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(resText);
      } catch {
        return { status: "ERROR", error: "Invalid provider response: " + resText };
      }

      return {
        status: "CONNECTED",
        phone: parsed.phone,
        orderId: String(parsed.id),
        rawData: parsed
      };
    } catch (err: any) {
      return { status: "OFFLINE", error: err.message || "Failed to connect to allocation service" };
    }
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; sms?: any[]; rawStatus?: string; error?: string }> {
    try {
      const targetUrl = `${this.apiUrl}/user/check/${encodeURIComponent(orderId)}`;
      const headers: Record<string, string> = { "Accept": "application/json" };
      const auth = this.getAuthHeader();
      if (auth) headers["Authorization"] = auth;

      const res = await this.fetchWithTimeout(targetUrl, { headers }, 6000);
      if (!res.ok) {
        return { status: "ERROR", error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return {
        status: "CONNECTED",
        rawStatus: data.status,
        sms: data.sms || []
      };
    } catch (err: any) {
      return { status: "OFFLINE", error: err.message || "Order check failed" };
    }
  }

  async cancelOrder(orderId: string): Promise<{ status: string; error?: string }> {
    try {
      const targetUrl = `${this.apiUrl}/user/cancel/${encodeURIComponent(orderId)}`;
      const headers: Record<string, string> = { "Accept": "application/json" };
      const auth = this.getAuthHeader();
      if (auth) headers["Authorization"] = auth;

      const res = await this.fetchWithTimeout(targetUrl, { headers }, 6000);
      if (!res.ok) {
        return { status: "ERROR", error: `HTTP ${res.status}` };
      }
      return { status: "CONNECTED" };
    } catch (err: any) {
      return { status: "OFFLINE", error: err.message || "Cancel order failed" };
    }
  }

  async finishOrder(orderId: string): Promise<{ status: string; error?: string }> {
    try {
      const targetUrl = `${this.apiUrl}/user/finish/${encodeURIComponent(orderId)}`;
      const headers: Record<string, string> = { "Accept": "application/json" };
      const auth = this.getAuthHeader();
      if (auth) headers["Authorization"] = auth;

      const res = await this.fetchWithTimeout(targetUrl, { headers }, 6000);
      if (!res.ok) {
        return { status: "ERROR", error: `HTTP ${res.status}` };
      }
      return { status: "CONNECTED" };
    } catch (err: any) {
      return { status: "OFFLINE", error: err.message || "Finish order failed" };
    }
  }

  async banNumber(orderId: string): Promise<{ status: string; error?: string }> {
    try {
      const targetUrl = `${this.apiUrl}/user/ban/${encodeURIComponent(orderId)}`;
      const headers: Record<string, string> = { "Accept": "application/json" };
      const auth = this.getAuthHeader();
      if (auth) headers["Authorization"] = auth;

      const res = await this.fetchWithTimeout(targetUrl, { headers }, 6000);
      if (!res.ok) {
        return { status: "ERROR", error: `HTTP ${res.status}` };
      }
      return { status: "CONNECTED" };
    } catch (err: any) {
      return { status: "OFFLINE", error: err.message || "Ban number failed" };
    }
  }
}
