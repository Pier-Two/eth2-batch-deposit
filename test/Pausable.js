const { expect } = require("chai");
const { ethers } = require("hardhat");

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
      await depositContract.getAddress()
    );
    await contract.waitForDeployment();
  });

  it("should not pause contract", async function () {
    await expect(contract.connect(addr2).pause()).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount",
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

    const amounts = [ethers.parseEther("32")];

    await expect(
      contract
        .connect(addr1)
        .batchDeposit(
          "0x9326240e149554acf00885d81485c59bc368526e9241aadfe83d56b1a56ef039b5dd8fb82224ec5810dd37ebd1cf6b46",
          "0x0200000000000000000000009308245a3ca756b506fa1d3a1962b5a563f92470",
          "0xa186d2f6ccbb7d1a01ab50bb26aa64e38a8b73bb425516460fc55e89e61cd78837a418364502fe083b5eb4d40582ed93125024cd63cfacffb70823bd194a23a6d71228e6a0343ca6c6098eb39a4bb01c76c1d6859acb3258f1df19973818194f",
          [
            "0xf705b9f07b584ab362b9f7bda199d2d61bbd56b4af1995018e395493dcb2203e",
          ],
          amounts,
          {
            value: ethers.parseEther("32"),
          },
        ),
    ).to.be.revertedWithCustomError(contract, "EnforcedPause");
  });

  it("should not unpause contract", async function () {
    await expect(
      contract.connect(addr2).unpause(),
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
