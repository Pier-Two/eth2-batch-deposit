require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

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
    mainnet: {
      chainId: 1,
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.MAINNET_PRIVATE_KEY
        ? [process.env.MAINNET_PRIVATE_KEY]
        : [],
    },
    hoodi: {
      chainId: 560048,
      url: process.env.HOODI_RPC_URL || "",
      accounts: process.env.HOODI_PRIVATE_KEY
        ? [process.env.HOODI_PRIVATE_KEY]
        : [],
    },
    holesky: {
      chainId: 17000,
      url: process.env.HOLESKY_RPC_URL || "",
      accounts: process.env.HOLESKY_PRIVATE_KEY
        ? [process.env.HOLESKY_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    customChains: [
      {
        network: "hoodi",
        chainId: 560048,
        urls: {
          apiURL: "https://api-hoodi.etherscan.io/api",
          browserURL: "https://hoodi.etherscan.io",
        },
      },
    ],
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
