// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeCapsule {
    struct Capsule {
        uint256 unlockDate;
        string dataURI; // ipfs://... or encrypted payload
        bool opened;
    }

    // Each user has their own list of capsules
    mapping(address => Capsule[]) private userCapsules;

    address payable public immutable feeReceiver;
    uint256 public immutable capsuleFee;

    event CapsuleCreated(
        address indexed owner,
        uint256 indexed capsuleIndex,
        uint256 unlockDate
    );

    event CapsuleOpened(
        address indexed owner,
        uint256 indexed capsuleIndex
    );

    constructor(address payable _feeReceiver, uint256 _capsuleFee) {
        require(_feeReceiver != address(0), "Invalid receiver");
        feeReceiver = _feeReceiver;
        capsuleFee = _capsuleFee;
    }

    // ------------------------
    // CREATE
    // ------------------------
    function createCapsule(
        uint256 unlockDate,
        string calldata dataURI
    ) external payable {
        require(msg.value == capsuleFee, "Wrong fee");
        require(unlockDate > block.timestamp, "Unlock in future");

        // Pay fee
        (bool sent,) = feeReceiver.call{value: msg.value}("");
        require(sent, "Fee transfer failed");

        userCapsules[msg.sender].push(
            Capsule({
                unlockDate: unlockDate,
                dataURI: dataURI,
                opened: false
            })
        );

        emit CapsuleCreated(
            msg.sender,
            userCapsules[msg.sender].length - 1,
            unlockDate
        );
    }

    // ------------------------
    // READ (VIEW)
    // ------------------------
    function getCapsuleCount(address user) external view returns (uint256) {
        return userCapsules[user].length;
    }

    function getCapsule(
        address user,
        uint256 index
    ) external view returns (
        uint256 unlockDate,
        string memory dataURI,
        bool opened
    ) {
        Capsule memory c = userCapsules[user][index];
        return (c.unlockDate, c.dataURI, c.opened);
    }

    function openCapsule(
        uint256 index
    ) external view returns (string memory) {
        Capsule memory c = userCapsules[msg.sender][index];
        require(block.timestamp >= c.unlockDate, "Too early");
        require(!c.opened, "Already opened");
        return c.dataURI;
    }

    // ------------------------
    // MUTATE
    // ------------------------
    function markOpened(uint256 index) external {
        Capsule storage c = userCapsules[msg.sender][index];
        require(block.timestamp >= c.unlockDate, "Too early");
        require(!c.opened, "Already opened");

        c.opened = true;
        emit CapsuleOpened(msg.sender, index);
    }
}
