# Walkthrough recorder

These Playwright scripts record a walkthrough of the deployed site into `demo-video/`.

**The recorded video shows the interface, not real transactions.** `record-real-demo.js` injects a mock
wallet into the page: it reports a real address and the Sepolia chain id, but every transaction it is
asked to send returns a placeholder hash (`0xbbbb…`) and never reaches the chain, and every signature is
a placeholder too. Nothing in the video was mined.

To see real transactions, connect a funded Sepolia wallet (MetaMask) to a deployment of the current
contracts.
