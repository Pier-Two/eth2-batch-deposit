const { expect } = require("chai");
const { ethers } = require("hardhat");

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

describe("MultipleDeposits", function () {
  let contract;
  let depositContract;
  let owner;
  let addr1;
  let addr2;
  let addr6;

  beforeEach(async function () {
    [owner, addr1, addr2, , , , addr6] = await ethers.getSigners();

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

  it("can perform multiple deposits with different amounts in one tx", async function () {
    const amounts = [
      ethers.parseEther("32"), // 32 ETH
      ethers.parseEther("64"), // 64 ETH
      ethers.parseEther("128"), // 128 ETH
    ];
    const totalDepositAmount = amounts.reduce((a, b) => a + b, 0n);

    // Create arrays for pubkeys and signatures
    const pubkeys = [
      depositData["32"].pubkey.slice(2),
      depositData["64"].pubkey.slice(2),
      depositData["128"].pubkey.slice(2),
    ].join("");

    const signatures = [
      depositData["32"].signature.slice(2),
      depositData["64"].signature.slice(2),
      depositData["128"].signature.slice(2),
    ].join("");

    const dataRoots = [
      depositData["32"].dataRoots,
      depositData["64"].dataRoots,
      depositData["128"].dataRoots,
    ];

    const tx = await contract
      .connect(addr1)
      .batchDeposit(
        "0x" + pubkeys,
        depositData["32"].creds,
        "0x" + signatures,
        dataRoots,
        amounts,
        {
          value: totalDepositAmount,
        },
      );

    const receipt = await tx.wait();
    expect(receipt.logs.length).to.equal(3);

    const balance = await ethers.provider.getBalance(contract.target);
    expect(balance).to.equal(0); // No fee collected

    // check owner is correct
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should revert if amount is too low", async function () {
    const amounts = [
      ethers.parseEther("16"), // 16 ETH (below minimum)
      ethers.parseEther("32"),
      ethers.parseEther("64"),
    ];
    const totalDepositAmount = amounts.reduce((a, b) => a + b, 0n);

    await expect(
      contract
        .connect(addr2)
        .batchDeposit(
          "0x" +
            [
              depositData["32"].pubkey.slice(2),
              depositData["32"].pubkey.slice(2),
              depositData["64"].pubkey.slice(2),
            ].join(""),
          depositData["32"].creds,
          "0x" +
            [
              depositData["32"].signature.slice(2),
              depositData["32"].signature.slice(2),
              depositData["64"].signature.slice(2),
            ].join(""),
          [
            depositData["32"].dataRoots,
            depositData["32"].dataRoots,
            depositData["64"].dataRoots,
          ],
          amounts,
          {
            value: totalDepositAmount,
          },
        ),
    ).to.be.revertedWith("BatchDeposit: Amount is too low");
  });

  it("should revert if amount exceeds maximum", async function () {
    const amounts = [
      ethers.parseEther("2049"), // 2049 ETH (above maximum)
      ethers.parseEther("32"),
      ethers.parseEther("64"),
    ];
    const totalDepositAmount = amounts.reduce((a, b) => a + b, 0n);

    await expect(
      contract
        .connect(addr2)
        .batchDeposit(
          "0x" +
            [
              depositData["32"].pubkey.slice(2),
              depositData["32"].pubkey.slice(2),
              depositData["64"].pubkey.slice(2),
            ].join(""),
          depositData["32"].creds,
          "0x" +
            [
              depositData["32"].signature.slice(2),
              depositData["32"].signature.slice(2),
              depositData["64"].signature.slice(2),
            ].join(""),
          [
            depositData["32"].dataRoots,
            depositData["32"].dataRoots,
            depositData["64"].dataRoots,
          ],
          amounts,
          {
            value: totalDepositAmount,
          },
        ),
    ).to.be.revertedWith("BatchDeposit: Amount exceeds maximum");
  });

  it("should change owner", async function () {
    // check owner is correct
    expect(await contract.owner()).to.equal(owner.address);

    // transfer ownership to addr2
    await contract.connect(owner).transferOwnership(addr2.address);

    // check owner is addr2
    expect(await contract.owner()).to.equal(addr2.address);
  });

  it("should handle deposits when amounts order doesn't match other arrays", async function () {
    // Create arrays with different orders
    const amounts = [
      ethers.parseEther("128"), // 128 ETH
      ethers.parseEther("32"), // 32 ETH
      ethers.parseEther("64"), // 64 ETH
    ];
    const totalDepositAmount = amounts.reduce((a, b) => a + b, 0n);

    // Create arrays for pubkeys and signatures in original order
    const pubkeys = [
      depositData["32"].pubkey.slice(2),
      depositData["64"].pubkey.slice(2),
      depositData["128"].pubkey.slice(2),
    ].join("");

    const signatures = [
      depositData["32"].signature.slice(2),
      depositData["64"].signature.slice(2),
      depositData["128"].signature.slice(2),
    ].join("");

    const dataRoots = [
      depositData["32"].dataRoots,
      depositData["64"].dataRoots,
      depositData["128"].dataRoots,
    ];

    await expect(
      contract
        .connect(addr1)
        .batchDeposit(
          "0x" + pubkeys,
          depositData["32"].creds,
          "0x" + signatures,
          dataRoots,
          amounts,
          {
            value: totalDepositAmount,
          },
        ),
    ).to.be.revertedWith(
      "DepositContract: reconstructed DepositData does not match supplied deposit_data_root",
    );
  });
});
