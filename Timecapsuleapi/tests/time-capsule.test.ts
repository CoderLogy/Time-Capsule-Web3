import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { CapsuleCreated } from "../generated/schema"
import { CapsuleCreated as CapsuleCreatedEvent } from "../generated/TimeCapsule/TimeCapsule"
import { handleCapsuleCreated } from "../src/time-capsule"
import { createCapsuleCreatedEvent } from "./time-capsule-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let owner = Address.fromString("0x0000000000000000000000000000000000000001")
    let capsuleIndex = BigInt.fromI32(234)
    let unlockDate = BigInt.fromI32(234)
    let dataURI = "Example string value"
    let newCapsuleCreatedEvent = createCapsuleCreatedEvent(
      owner,
      capsuleIndex,
      unlockDate,
      dataURI
    )
    handleCapsuleCreated(newCapsuleCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CapsuleCreated created and stored", () => {
    assert.entityCount("CapsuleCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CapsuleCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "owner",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CapsuleCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "capsuleIndex",
      "234"
    )
    assert.fieldEquals(
      "CapsuleCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "unlockDate",
      "234"
    )
    assert.fieldEquals(
      "CapsuleCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "dataURI",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
