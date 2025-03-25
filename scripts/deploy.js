const { ethers, network, run } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deposit contract addresses for different networks
  const DEPOSIT_CONTRACT_ADDRESSES = {
    mainnet: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    hoodi: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    holesky: "0x4242424242424242424242424242424242424242",
  };

  const depositContractAddress = DEPOSIT_CONTRACT_ADDRESSES[network.name];
  if (!depositContractAddress) {
    throw new Error(`Unsupported network: ${network.name}`);
  }

  // Initial fee in wei (e.g., 0.1 ETH = 100000000000000000 wei)
  const INITIAL_FEE = ethers.parseEther("0");

  // Deploy BatchDeposit contract
  const BatchDeposit = await ethers.getContractFactory("BatchDeposit");
  const batchDeposit = await BatchDeposit.deploy(
    depositContractAddress,
    INITIAL_FEE,
  );

  await batchDeposit.waitForDeployment();
  const batchDepositAddress = await batchDeposit.getAddress();

  console.log("Network:", network.name);
  console.log("Deposit contract address:", depositContractAddress);
  console.log("BatchDeposit deployed to:", batchDepositAddress);
  console.log("Initial fee set to:", ethers.formatEther(INITIAL_FEE), "ETH");

  // Wait for a few block confirmations before verification
  console.log("Waiting for block confirmations...");
  await batchDeposit.deploymentTransaction().wait(5);
  console.log("Block confirmations received");

  // Verify the contract
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: batchDepositAddress,
      constructorArguments: [depositContractAddress, INITIAL_FEE],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified");
    } else {
      console.error("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
