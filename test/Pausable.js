const { expect } = require("chai");
const { ethers } = require("hardhat");

// 1 gwei fee
const fee = ethers.parseUnits("1", "gwei");

describe("Pausable", function () {
  let contract;
  let depositContract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

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

  it("should not pause contract", async function () {
    await expect(contract.connect(addr2).pause()).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should pause the contract", async function () {
    const tx = await contract.connect(owner).pause();
    const receipt = await tx.wait();

    expect(receipt.logs.length).to.equal(1);
    const paused = await contract.paused();
    expect(paused).to.be.true;
  });

  it("should not deposit if contract is paused", async function () {
    await contract.connect(owner).pause();

    await expect(
      contract
        .connect(addr1)
        .batchDeposit(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          ],
          {
            value: ethers.parseUnits("1000", "gwei"),
          }
        )
    ).to.be.revertedWithCustomError(contract, "EnforcedPause");
  });

  it("should not unpause contract", async function () {
    await expect(
      contract.connect(addr2).unpause()
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("should unpause the contract", async function () {
    await contract.connect(owner).pause();
    const tx = await contract.connect(owner).unpause();
    const receipt = await tx.wait();

    expect(receipt.logs.length).to.equal(1);
    const paused = await contract.paused();
    expect(paused).to.be.false;
  });
});
