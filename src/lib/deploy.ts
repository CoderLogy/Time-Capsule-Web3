import hre from "hardhat"

const connection = await hre.network.connect()

async function main() {
    const [deployer] = await connection.ethers.getSigners()
    console.log("Deploying contracts with account: ", deployer.address)
    const feeReceiver = "0x767a8be484bc3da171bc86f1294028336d1661bc" 
    const capsuleFee = connection.ethers.parseEther("0.00002")
    const TimeCapsule = await connection.ethers.getContractFactory("TimeCapsule")
    const timeCapsuleDeploy = await TimeCapsule.deploy(feeReceiver, capsuleFee)
    await timeCapsuleDeploy.waitForDeployment()
    console.log("TimeCapsule deployed to: ", timeCapsuleDeploy.target)
}

main()