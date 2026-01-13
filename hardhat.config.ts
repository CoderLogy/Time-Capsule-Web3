import { defineConfig } from "hardhat/config";
import "dotenv/config";
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";

export default defineConfig({
  plugins: [HardhatIgnitionEthersPlugin],
  solidity: "0.8.28",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
});
