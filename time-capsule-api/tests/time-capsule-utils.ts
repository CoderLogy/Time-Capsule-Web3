import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CapsuleCreated,
  CapsuleOpened
} from "../generated/TimeCapsule/TimeCapsule"

export function createCapsuleCreatedEvent(
  owner: Address,
  capsuleIndex: BigInt,
  title: string,
  unlockDate: BigInt,
  dataURI: string
): CapsuleCreated {
  let capsuleCreatedEvent = changetype<CapsuleCreated>(newMockEvent())

  capsuleCreatedEvent.parameters = new Array()

  capsuleCreatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  capsuleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "capsuleIndex",
      ethereum.Value.fromUnsignedBigInt(capsuleIndex)
    )
  )
  capsuleCreatedEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )
  capsuleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "unlockDate",
      ethereum.Value.fromUnsignedBigInt(unlockDate)
    )
  )
  capsuleCreatedEvent.parameters.push(
    new ethereum.EventParam("dataURI", ethereum.Value.fromString(dataURI))
  )

  return capsuleCreatedEvent
}

export function createCapsuleOpenedEvent(
  owner: Address,
  capsuleIndex: BigInt,
  title: string,
  dataURI: string
): CapsuleOpened {
  let capsuleOpenedEvent = changetype<CapsuleOpened>(newMockEvent())

  capsuleOpenedEvent.parameters = new Array()

  capsuleOpenedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  capsuleOpenedEvent.parameters.push(
    new ethereum.EventParam(
      "capsuleIndex",
      ethereum.Value.fromUnsignedBigInt(capsuleIndex)
    )
  )
  capsuleOpenedEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )
  capsuleOpenedEvent.parameters.push(
    new ethereum.EventParam("dataURI", ethereum.Value.fromString(dataURI))
  )

  return capsuleOpenedEvent
}
