import { chatClaude, sendClaudeMessage } from "./claude-helper.js";

async function main() {
  // 1) Single-shot message
  const single = await sendClaudeMessage({
    system: "You are a helpful assistant.",
    message: "Give me a short checklist for shipping a medical tourism marketplace UI.",
  });

  console.log("\n=== sendClaudeMessage result ===\n");
  console.log(single);

  // 2) Conversational chat with history
  let history = [];
  const first = await chatClaude({
    system: "You are a senior product QA engineer. Keep answers concise.",
    userMessage:
      "Tailor it to a dark UI + trusted onboarding. List what to verify on /packages and /trust-and-safety.",
    history,
  });

  console.log("\n=== chatClaude step 1 ===\n");
  console.log(first.reply);
  history = first.history;

  const second = await chatClaude({
    userMessage:
      "Add a quick test plan order (manual first, then automated) and mention what should not break (auth/Stripe/webhook).",
    history,
  });

  console.log("\n=== chatClaude step 2 ===\n");
  console.log(second.reply);
}

main().catch((err) => {
  console.error("\nTest failed:\n", err);
  process.exitCode = 1;
});

