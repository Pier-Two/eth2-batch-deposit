const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Owner", function () {
  let contract;
  let depositContract;
  let owner;
  let addr2;

  beforeEach(async function () {
    [owner, _, addr2] = await ethers.getSigners();

    // Deploy the deposit contract first
    const DepositContract = await ethers.getContractFactory("DepositContract");
    depositContract = await DepositContract.deploy();
    await depositContract.waitForDeployment();

    const BatchDeposit = await ethers.getContractFactory("BatchDeposit");
    contract = await BatchDeposit.deploy(
      await depositContract.getAddress()
    );
    await contract.waitForDeployment();
  });
  
  it("should not renounce ownership", async function () {
    await expect(
      contract.connect(owner).renounceOwnership(),
    ).to.be.revertedWith("Ownable: renounceOwnership is disabled");
  });
});
