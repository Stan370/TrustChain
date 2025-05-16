# VerifiAI - TrustChain AI Application

In an era of autonomous agents and synthetic media, how do we trust what’s real — and who’s responsible?

TrustChain AI is a decentralized verification layer for AI agents and their outputs. Powered by DIDs (Decentralized Identifiers), Verifiable Credentials (VCs), and DID-Linked Resources (DLRs) from the cheqd network, TrustChain AI bridges the agentic economy with human-centric trust.

We enable:

✅ Trustworthy AI agent identity: Sign, verify, and delegate actions across multi-agent systems using DIDs and authorization credentials.

🔗 Cross-agent proof exchange: Enable agents to verify each other’s roles, capabilities, and provenance in real time.

🧾 Verifiable AI content: Tag, anchor, and cryptographically prove the origin and integrity of generated content (text, images, data).

📂 Verified data pipelines: Consumers can audit datasets and agent reasoning trails using decentralized trust registries and linked resources.

TrustChain AI empowers trust by design, not trust by reputation.

Built for:

🔐 AI developers embedding provenance and identity into autonomous systems

🧠 Multi-agent workflows verifying delegation and authorship

🌍 End-users & regulators demanding transparency in AI decisions

## Prerequisites

- Node.js (v16+)
- npm or yarn
- An OpenAI API key

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/trustchain.git
   cd verifi-ai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3001
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Replace `your-openai-api-key-here` with your actual OpenAI API key.

## Running the Application

1. Build the frontend:
   ```
   npm run build
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3001`

## Development

To run the application in development mode:

```
npm run dev
```

This will start the Vite development server. Note that in development mode, you'll still need to start the backend server separately:

```
node server.js
```

## Components

- **ChatInterface**: AI chat with content provenance tracking
- **UserAuth**: DID-based authentication system
- **DataMarketplace**: Verified dataset exchange platform
- **Cheqd Service**: Integration with cheqd SDK for DIDs and VCs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
