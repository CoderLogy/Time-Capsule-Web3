# Privacy Policy

**Last Updated:** April 2026 | **Version:** 4.0
**Repository:** https://github.com/CoderLogy/Time-Capsule-Web3

---

> **Open Source Notice:** Every claim in this policy can be independently verified by reviewing our source code on GitHub. We encourage you to do so.

> **Liability:** This policy covers data practices only. For full disclaimers, limitation of liability, and user responsibilities, see our [Terms & Conditions](TERMS.md).

---

## 1. Overview

Time Capsule Web3 collects minimal data by design. We do not access, decrypt, view, or store your capsule content. Your encrypted messages are processed entirely on your device and never reach our servers.

By using this service, you confirm you have read and accepted this Privacy Policy in full.

---

## 2. Data We Collect

### 2.1 Wallet & Account Data

- Ethereum/Sepolia wallet address (lowercase)
- Wallet provider type (MetaMask, WalletConnect, Rainbow, etc.)
- Chain ID (Sepolia: 11155111)
- Wallet connection and disconnection status

### 2.2 Blockchain & Transaction Data

- Transaction hashes and status (success/failure)
- Gas fees paid
- Time-lock timestamps (capsule unlock dates)
- Capsule visibility status (private or public)
- Wallet balance changes related to our smart contract only

### 2.3 Analytics & Event Data

We use **Amplitude Analytics** to track the following events:

- Wallet connections and disconnections
- Account creation and login
- Capsule creation — metadata only (ID, unlock date, visibility status)
- Capsule viewing and deletion
- Transaction submission and confirmation
- Errors, page navigation, and feature interactions

### 2.4 Session & Device Data

Collected automatically via Amplitude:

- Session ID and duration
- Device type, browser, and operating system
- IP address (used to derive approximate geographic location)
- Interaction timestamps

---

## 3. Data We Do Not Collect

**If we do not collect data, we cannot read it, access it, modify it, or delete it. This is a technical reality, not a policy choice — verifiable via our open-source code.**

We never receive, store, or process:

- **Capsule content** — messages, attachments, or any user-generated content inside capsules. Encryption happens on your device before data leaves it.
- **Personal identity** — no name, email, phone number, address, date of birth, or any personally identifying information. Your wallet address is not personal identity information.
- **Cryptographic material** — no private keys, seed phrases, wallet passwords, or decryption keys. These never leave your device.
- **Financial information** — no bank accounts, credit card data, non-blockchain financial history, income, or tax information.
- **Capsule ownership mapping** — by design, we do not map capsules to wallets. We do not store which wallet created which capsule. This protects anonymity but means we cannot identify your capsules even with your cooperation.
- **Off-service activity** — no browsing history, apps, or activities outside this application.
- **Device contents** — no contacts, photos, files, calendar, email, or device identifiers.

---

## 4. Third-Party Services

We share data with the following services. Each operates under its own privacy policy, which you should read independently.

| Service | Data They Receive | Their Privacy Policy |
|---|---|---|
| **Amplitude** | Wallet address, events, session data, device/IP info | https://amplitude.com/privacy |
| **The Graph** | Wallet addresses, transaction records, blockchain events | https://thegraph.com/privacy |
| **WalletConnect** | Wallet connection metadata | https://walletconnect.com/privacy |
| **Pinata/IPFS** | Encrypted capsule data (content we cannot read) | https://pinata.cloud/privacy |
| **Vercel** | Hosting infrastructure logs | https://vercel.com/legal/privacy-policy |

We are not responsible for data handled by these services. Their retention schedules are beyond our control.

---

## 5. What We Cannot Access, Control, or Delete

### 5.1 Data We Cannot Access

We have no technical capability to access: capsule content (encrypted on your device), private keys or cryptographic secrets, personal identity information, your financial accounts, your device or personal files, or any data stored exclusively on services we do not operate.

### 5.2 Data We Cannot Delete — Ever

Even if you request deletion, the following cannot be deleted by anyone, including us:

- **Blockchain records** — Ethereum Sepolia transactions are permanently immutable. Wallet addresses, transaction hashes, gas fees, and smart contract interactions are public forever.
- **IPFS content on other nodes** — We can only remove data from our own Pinata nodes. Content pinned by other IPFS nodes persists on the decentralized network permanently and beyond our control.
- **Third-party service data** — Amplitude, The Graph, WalletConnect, Vercel, and Pinata retain data under their own policies. We cannot instruct them to delete on your behalf.
- **Data we never held** — We cannot delete data we never received or stored.

### 5.3 Our Right to Delete Capsules from Pinata

We reserve the right to delete capsule data from our Pinata nodes at any time, for any reason or no reason, without notice. Before using this service, you must understand:

- **Deletions may be broad, not granular.** We may delete an entire profile's associated data rather than specific capsules. We do not guarantee selective, item-by-item deletion.
- **We cannot read capsule content before deleting it.** We operate on encrypted blobs we cannot inspect. Our deletions are blind to content.
- **Deletion actions on Pinata may be performed anonymously** using internal references, not your wallet address.
- **Deletions are irreversible.** Once removed from our Pinata nodes, data cannot be recovered by us.
- **Deletion from our nodes ≠ deletion from IPFS.** Content pinned by other nodes remains on the network indefinitely.

You are responsible for understanding where your data is stored and the limitations of deletion across blockchain, IPFS, and third-party systems.

---

## 6. Deletion Requests

To request deletion of data we hold:

**Email:** sourceboxtv+timecapsuleprivacy@gmail.com

Include your wallet address, the type of data you want deleted, and any relevant transaction hashes or timestamps.

**What we can attempt to delete:** Your Amplitude analytics profile and associated events, session data in our systems, user identification logs, and cached wallet data we hold.

**What we cannot guarantee:** 100% deletion of all tracked data, deletion of third-party copies, deletion of immutable blockchain records, or that backup copies do not exist.

We will respond within approximately one month. Response time is not guaranteed and we may not respond at all. We are not liable for delays or non-response.

---

## 7. Data Retention

| Data Type | Retention |
|---|---|
| Amplitude Analytics | 12+ months (per Amplitude's policy) |
| Transaction Logs | 30–90 days |
| Error Logs | Up to 30 days |
| Session Data | Until deletion or service closure |
| Blockchain Data | Permanent (immutable by design) |
| IPFS/Pinata Data | Indefinite (distributed storage) |

Third-party services retain their own copies independently. We cannot control or override their retention.

---

## 8. Policy Changes

We may update this policy at any time without notice. Changes take effect immediately upon posting to GitHub. Your continued use of the service constitutes acceptance. We do not send email notifications. Check the repository regularly.

---

## 9. Contact

**Privacy questions:** sourceboxtv+timecapsuleprivacy@gmail.com
**Bugs and issues:** https://github.com/CoderLogy/Time-Capsule-Web3/issues
**Source code:** https://github.com/CoderLogy/Time-Capsule-Web3

---

This Privacy Policy, together with our Terms & Conditions, constitutes the entire agreement regarding data practices. If any part is found unenforceable, the remaining parts remain in full effect.

**Last Modified:** April 2026 | **Version:** 4.0 | **License:** MIT