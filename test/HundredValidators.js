/*
  This is disabled because hard to implement in the pipeline. To run it manually:
  npx ganache-cli --defaultBalanceEther 35000 -l 8000000
  truffle test --network coverage
*/

const { expect } = require("chai");
const { ethers } = require("hardhat");

// var BatchDeposit = artifacts.require("BatchDeposit");
// const assert = require("chai").assert;
// const truffleAssert = require("truffle-assertions");

// Fake deposits for different amounts
const depositData = {
  32: {
    pubkey:
      "0x9326240e149554acf00885d81485c59bc368526e9241aadfe83d56b1a56ef039b5dd8fb82224ec5810dd37ebd1cf6b46",
    creds: "0x0200000000000000000000009308245a3ca756b506fa1d3a1962b5a563f92470",
    signature:
      "0xa186d2f6ccbb7d1a01ab50bb26aa64e38a8b73bb425516460fc55e89e61cd78837a418364502fe083b5eb4d40582ed93125024cd63cfacffb70823bd194a23a6d71228e6a0343ca6c6098eb39a4bb01c76c1d6859acb3258f1df19973818194f",
    dataRoots:
      "0xf705b9f07b584ab362b9f7bda199d2d61bbd56b4af1995018e395493dcb2203e",
  },
  64: {
    pubkey:
      "0xb7021ffbff7c1551056631cc1cda0fc3ac92ef6d9d4178adf51711b483a1cca2b24ddf7e07997d2e4b15638967ffaacb",
    creds: "0x0200000000000000000000009308245a3ca756b506fa1d3a1962b5a563f92470",
    signature:
      "0xad500c9c6b44754d880355d55624a683dd857a1a045210e993fcd6f50d0c678ad9aba85e213c04b7c25cd93d982bb99b03a972cfe01dddb572deb8d9d80ff3bf721f4402718d5f05dcf11d548569d35417c07af2d5ee73284822d29bd5307225",
    dataRoots:
      "0x42f510364cf385e9b2482a16edc02b2881e6426a71fc0dc1a9f2e320126b459d",
  },
  128: {
    pubkey:
      "0xb9e279e2041329ab1e3d4908640a4cb443bce7c786c05b7ab3070627077a881258ffc811aa63829d2b9df3b1e9f04ec7",
    creds: "0x0200000000000000000000009308245a3ca756b506fa1d3a1962b5a563f92470",
    signature:
      "0xa3c46409acdb09f2944f3a865187d8e288f4de1d4200be8fd21918fe8791d21bef4ffe43de2a262e19420f27718909a200c9b45b613eb6e390bc14ca82eea2e89a80ace3fee5a3e22ef6b2e195e78a5851c11fab46c3928a5b623d0fe832d487",
    dataRoots:
      "0x33d543a6f08230ffe1bdbcd3aae44c7d3f725842f14389296bac1382e7c67c1c",
  },
};

describe("HundredValidators", function () {
  let contract;
  let depositContract;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

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

  it("can deposit 100 validators with different amounts in one shot", async function () {
    // Create arrays for 100 validators with varying amounts
    const amounts = [];
    let totalDepositAmount = 0n;

    for (let i = 0; i < 100; i++) {
      // Alternate between 32 ETH and 64 ETH for testing
      const amount =
        i % 2 === 0 ? ethers.parseEther("32") : ethers.parseEther("64");
      amounts.push(amount);
      totalDepositAmount += amount;
    }

    const totalAmount = totalDepositAmount

    // Create arrays for pubkeys and signatures
    const pubkeys = Array(100)
      .fill()
      .map((_, i) => {
        const data = depositData[i % 2 === 0 ? "32" : "64"];
        return data.pubkey.slice(2); // Remove 0x prefix
      })
      .join("");

    const signatures = Array(100)
      .fill()
      .map((_, i) => {
        const data = depositData[i % 2 === 0 ? "32" : "64"];
        return data.signature.slice(2); // Remove 0x prefix
      })
      .join("");

    const dataRoots = Array(100)
      .fill()
      .map((_, i) => {
        const data = depositData[i % 2 === 0 ? "32" : "64"];
        return data.dataRoots;
      });

    const tx = await contract
      .connect(addr1)
      .batchDeposit(
        "0x" + pubkeys,
        depositData["32"].creds,
        "0x" + signatures,
        dataRoots,
        amounts,
        {
          value: totalAmount,
        },
      );

    const receipt = await tx.wait();
    expect(receipt.logs.length).to.equal(100);

    // Confirm that no fee was collected
    const balance = await ethers.provider.getBalance(contract.target);
    expect(balance).to.equal(0); // No fee collected

    // check owner is correct
    expect(await contract.owner()).to.equal(owner.address);
  });
});
