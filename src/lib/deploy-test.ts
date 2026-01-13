import hre from "hardhat";
import "dotenv/config"
async function main() {
    const conn = await hre.network.connect();
    const contract = await conn.ethers.getContractAt(
        "TimeCapsule",
        `${process.env.CONTRACT_ADDRESS}`
    ) as any;

    const user = (await conn.ethers.getSigners())[0];

    const feeReceiver = await contract.feeReceiver();
    const capsuleFee = await contract.capsuleFee();
    console.log("Fee receiver:", feeReceiver);
    console.log("Capsule fee:", conn.ethers.formatEther(capsuleFee), "ETH");

    // ✅ get balances
    const balanceBefore = await user.provider!.getBalance(feeReceiver);
    console.log("Balance before:", conn.ethers.formatEther(balanceBefore), "ETH");

    // Create capsule
    const unlockDate = Math.floor(Date.now() / 1000) + 60;
    const tx = await contract.connect(user).createCapsule(
        unlockDate,
        "test",
        { value: capsuleFee }
    );
    await tx.wait();
    console.log("Capsule created! Tx hash:", tx.hash);

    // Check balances after
    const balanceAfter = await user.provider!.getBalance(feeReceiver);
    console.log("Balance after:", conn.ethers.formatEther(balanceAfter), "ETH");

    // Calculate received ETH (bigint subtraction)
    const received = balanceAfter - balanceBefore;
    console.log("ETH received by feeReceiver:", conn.ethers.formatEther(received), "ETH");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
