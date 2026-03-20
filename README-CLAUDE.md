# Claude API (Anthropic) integration

## 1) Get your `ANTHROPIC_API_KEY`
1. Go to the Anthropic Console.
2. Create an API key (or open an existing one).
3. Copy the key.

## 2) Setup environment variables
This project uses `dotenv`.

1. Create a file named `.env` in the project root.
2. Add:
   ```env
   ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
   ```

Notes:
- Do **not** commit `.env` to Git. It is ignored by `.gitignore`.

## 3) Files
- `claude-helper.js`
  - `sendClaudeMessage({ message, system?, maxTokens?, temperature? })`
  - `chatClaude({ userMessage, history?, system?, maxTokens?, temperature? })`
- `test-claude.js`
  - Demonstrates both helper functions

Model used:
- `claude-3-sonnet-20240229`

## 4) Install dependencies
```bash
npm install @anthropic-ai/sdk dotenv
```

## 5) Run the example
```bash
node test-claude.js
```

