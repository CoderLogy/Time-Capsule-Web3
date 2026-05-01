// Tests contract deployment and fee collection mechanism

import hre from "hardhat";
import "dotenv/config";

async function testHardhatDeploy() {
  const conn = await hre.network.connect();
  const contract = (await conn.ethers.getContractAt(
    "TimeCapsule",
    `${process.env.CONTRACT_ADDRESS}`,
  )) as any;

  const user = (await conn.ethers.getSigners())[0];

  const feeReceiver = await contract.feeReceiver();
  const capsuleFee = BigInt(await contract.capsuleFee());
  console.log("Fee receiver:", feeReceiver);
  console.log("Capsule fee:", conn.ethers.formatEther(capsuleFee), "ETH");

  // Get balances before creating capsule
  const balanceBefore = await user.provider!.getBalance(feeReceiver, "latest");
  console.log("Balance before:", conn.ethers.formatEther(balanceBefore), "ETH");

  // Create test capsule
  const unlockDate = Math.floor(Date.now() / 1000) + 60;
  const tx = await contract
    .connect(user)
    .createCapsule("Test Capsule", unlockDate, "test message!", { value: capsuleFee });
  const receipt = await tx.wait();
  console.log("Capsule created! Tx hash:", tx.hash);

  // Wait for confirmation
  const balanceAfter = await user.provider!.getBalance(
    feeReceiver,
    receipt.blockNumber,
  );
  console.log("Balance after:", conn.ethers.formatEther(balanceAfter), "ETH");

  // Calculate received ETH
  const received = balanceAfter - balanceBefore;
  console.log(
    "ETH received by feeReceiver:",
    conn.ethers.formatEther(received),
    "ETH",
  );

  // Verify fee was collected correctly
  if (received === capsuleFee) {
    console.log("✅ TEST PASSED: Fee collected correctly");
  } else {
    console.log("❌ TEST FAILED: Fee mismatch");
    process.exit(1);
  }
}

testHardhatDeploy().catch((error) => {
  console.error("❌ Test error:", error);
  process.exit(1);
});
