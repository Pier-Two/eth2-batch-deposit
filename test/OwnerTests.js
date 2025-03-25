const { expect } = require("chai");
const { ethers } = require("hardhat");

// 1 gwei fee
const fee = ethers.parseUnits("1", "gwei");

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
      await depositContract.getAddress(),
      fee
    );
    await contract.waitForDeployment();
  });

  it("initial fee should be 1 gwei", async function () {
    const currentFee = await contract.fee();
    expect(currentFee).to.equal(ethers.parseUnits("1", "gwei"));
  });

  it("should change fee", async function () {
    const currentFee = await contract.fee();
    const newFee = ethers.parseUnits("1", "ether");

    const tx = await contract.connect(owner).changeFee(newFee);
    const receipt = await tx.wait();

    expect(receipt.logs.length).to.equal(1);
    const updatedFee = await contract.fee();

    expect(newFee).to.equal(updatedFee);
    expect(currentFee).to.not.equal(updatedFee);
  });

  it("should not change fee", async function () {
    const newFee = ethers.parseUnits("2", "ether");

    await expect(
      contract.connect(addr2).changeFee(newFee)
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("should not renounce ownership", async function () {
    await expect(
      contract.connect(owner).renounceOwnership()
    ).to.be.revertedWith("Ownable: renounceOwnership is disabled");
  });
});
