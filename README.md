# VerifiAI - TrustChain AI Application

A platform for establishing trust in AI systems using cheqd's decentralized identifiers (DIDs) and verifiable credentials (VCs).

## Features

- AI agent verification through verifiable credentials
- Content provenance tracking using C2PA standard
- DID-based user authentication
- Verifiable dataset marketplace
- Secure OpenAI API integration via server-side proxy

## Security Enhancements

This application implements a secure approach for OpenAI API integration:

- API keys are stored on the server side only, using environment variables
- Client-side requests are proxied through a secure backend
- API credentials are never exposed to the client
- All API communications are handled via HTTPS

## Prerequisites

- Node.js (v16+)
- npm or yarn
- An OpenAI API key

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/verifi-ai.git
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
