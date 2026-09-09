import "dotenv/config";
import { startOrderPollingEngine } from "./orderEngine";
import { startProviderSyncEngine } from "./providerSyncEngine";
import { startAutomaticBackupScheduler } from "./backupEngine";
import { initWhatsAppEngine } from "./whatsappEngine";

/**
 * Persistent production worker. Run this on a long-lived Node host, not as a
 * Vercel serverless function. Firebase/Storage provide durable application
 * state; this process owns timers, polling, WhatsApp and scheduled backups.
 */
async function main() {
  console.log("[Zerox Worker] starting persistent services...");

  startOrderPollingEngine();
  startProviderSyncEngine();

  if (process.env.WORKER_BACKUPS_ENABLED !== "false") {
    startAutomaticBackupScheduler();
  }

  if (process.env.WORKER_WHATSAPP_ENABLED !== "false") {
    try {
      initWhatsAppEngine();
    } catch (error) {
      console.error("[Zerox Worker] WhatsApp initialization failed:", error);
    }
  }

  console.log("[Zerox Worker] persistent services initialized.");
}

main().catch((error) => {
  console.error("[Zerox Worker] fatal startup error:", error);
  process.exitCode = 1;
});
