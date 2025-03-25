require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 5000000,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
};
