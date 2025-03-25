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

// 1 gwei fee
const fee = ethers.parseUnits("1", "gwei");

// Fake deposits
const fakeData = {
  pubkey:
    "b397443cf61fbb6286550d9ef9b58a033deeb0378fe504ec09978d94eb87aedea244892853b994e27d6f77133fce723e",

  creds: "0x00e53ca56e7f6412ca6024989d8a37cb0520d70d7e3472bf08fc629816603b5c",

  signature:
    "a45d0dd7c44a73209d2377fbc3ded47e5af5ee38ade2e08c53551dd34b98248b8a1e1feb1912fb024033435927d47ad70adf10b1ee4a65bfc8ae1501962dee655bfeb5cefdff3389c2d9eadcc6fdc4e8ed340f0414b684168146c15aa4edbfed",

  dataRoots:
    "0x2c16c5739ec31a951e5551e828ef57ee2d6944b36cf674db9f884173289c7946",
};

describe("HundredValidators", function () {
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

  it("can deposit 100 validators in one shot", async function () {
    const amountEth = 32 * 100;
    const amountWei = ethers.parseEther(amountEth.toString());
    const stakefishFee = fee * 100n;
    const totalAmount = amountWei + stakefishFee;

    let pubkeys = "0x";
    let signatures = "0x";
    const dataRoots = [];

    for (let i = 0; i < 100; i++) {
      pubkeys += fakeData.pubkey;
      signatures += fakeData.signature;
      dataRoots.push(fakeData.dataRoots);
    }

    const tx = await contract
      .connect(addr1)
      .batchDeposit(pubkeys, fakeData.creds, signatures, dataRoots, {
        value: totalAmount,
      });

    const receipt = await tx.wait();
    expect(receipt.logs.length).to.equal(101);

    // Check that we have fee in the contract balance
    const balance = await ethers.provider.getBalance(contract.target);
    expect(balance).to.equal(stakefishFee);

    // check owner is correct
    expect(await contract.owner()).to.equal(owner.address);
  });
});
