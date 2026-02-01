import { defineConfig } from "hardhat/config";
import "dotenv/config";
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [HardhatIgnitionEthersPlugin, hardhatVerify],
  solidity: "0.8.28",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY!,
    },
  },
});
