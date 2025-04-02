// This contract allows deposit of multiple validators in one transaction
// This contract is a fork of https://github.com/stakefish/eth2-batch-deposit with fee collection removed
// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.29;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// Deposit contract interface
interface IDepositContract {
    /// @notice A processed deposit event.
    event DepositEvent(
        bytes pubkey,
        bytes withdrawal_credentials,
        bytes amount,
        bytes signature,
        bytes index
    );

    /// @notice Submit a Phase 0 DepositData object.
    /// @param pubkey A BLS12-381 public key.
    /// @param withdrawal_credentials Commitment to a public key for withdrawals.
    /// @param signature A BLS12-381 signature.
    /// @param deposit_data_root The SHA-256 hash of the SSZ-encoded DepositData object.
    /// Used as a protection against malformed input.
    function deposit(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external payable;

    /// @notice Query the current deposit root hash.
    /// @return The deposit root hash.
    function get_deposit_root() external view returns (bytes32);

    /// @notice Query the current deposit count.
    /// @return The deposit count encoded as a little endian 64-bit number.
    function get_deposit_count() external view returns (bytes memory);
}


contract BatchDeposit is Pausable, Ownable {
    using Math for uint256;
    address depositContract;

    uint256 constant PUBKEY_LENGTH = 48;
    uint256 constant SIGNATURE_LENGTH = 96;
    uint256 constant CREDENTIALS_LENGTH = 32;
    uint256 constant MAX_VALIDATORS = 100;
    uint256 constant MAX_DEPOSIT_AMOUNT = 2048 ether;
    uint256 constant MIN_DEPOSIT_AMOUNT = 32 ether;

    event Withdrawn(address indexed payee, uint256 weiAmount);

    constructor(address depositContractAddr) Pausable() Ownable(msg.sender) {
        depositContract = depositContractAddr;
    }

    /**
     * @dev Performs a batch deposit
     * @param pubkeys Array of validator public keys
     * @param withdrawal_credentials Withdrawal credentials for all validators
     * @param signatures Array of validator signatures
     * @param deposit_data_roots Array of deposit data roots
     * @param amounts Array of deposit amounts for each validator (in wei)
     */
    function batchDeposit(
        bytes calldata pubkeys, 
        bytes calldata withdrawal_credentials, 
        bytes calldata signatures, 
        bytes32[] calldata deposit_data_roots,
        uint256[] calldata amounts
    ) 
        external payable whenNotPaused 
    {
        // sanity checks
        require(msg.value % 1 gwei == 0, "BatchDeposit: Deposit value not multiple of GWEI");
        
        uint256 count = deposit_data_roots.length;
        require(count > 0, "BatchDeposit: You should deposit at least one validator");
        require(count <= MAX_VALIDATORS, "BatchDeposit: You can deposit max 100 validators at a time");
        require(count == amounts.length, "BatchDeposit: Amounts array length must match validator count");

        require(pubkeys.length == count * PUBKEY_LENGTH, "BatchDeposit: Pubkey count don't match");
        require(signatures.length == count * SIGNATURE_LENGTH, "BatchDeposit: Signatures count don't match");
        require(withdrawal_credentials.length == 1 * CREDENTIALS_LENGTH, "BatchDeposit: Withdrawal Credentials count don't match");

        uint256 totalDepositAmount = 0;
        for (uint256 i = 0; i < count; ++i) {
            require(amounts[i] >= MIN_DEPOSIT_AMOUNT, "BatchDeposit: Amount is too low");
            require(amounts[i] <= MAX_DEPOSIT_AMOUNT, "BatchDeposit: Amount exceeds maximum");
            require(amounts[i] % 1 gwei == 0, "BatchDeposit: Amount must be multiple of GWEI");
            totalDepositAmount += amounts[i];
        }

        uint256 expectedAmount = totalDepositAmount;
        require(msg.value == expectedAmount, "BatchDeposit: Amount is not aligned with validator amounts");


        _processDeposits(pubkeys, withdrawal_credentials, signatures, deposit_data_roots, amounts);
    }

    /**
     * @dev Internal function to process deposits
     */
    function _processDeposits(
        bytes calldata pubkeys,
        bytes calldata withdrawal_credentials,
        bytes calldata signatures,
        bytes32[] calldata deposit_data_roots,
        uint256[] calldata amounts
    ) internal {
        uint256 count = deposit_data_roots.length;
        for (uint256 i = 0; i < count; ++i) {
            bytes memory pubkey = bytes(pubkeys[i*PUBKEY_LENGTH:(i+1)*PUBKEY_LENGTH]);
            bytes memory signature = bytes(signatures[i*SIGNATURE_LENGTH:(i+1)*SIGNATURE_LENGTH]);

            IDepositContract(depositContract).deposit{value: amounts[i]}(
                pubkey,
                withdrawal_credentials,
                signature,
                deposit_data_roots[i]
            );
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * Disable renunce ownership
     */
    function renounceOwnership() public view override onlyOwner {
        revert("Ownable: renounceOwnership is disabled");
    }
}
