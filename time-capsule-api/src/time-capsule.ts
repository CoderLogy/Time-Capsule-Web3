import {
  CapsuleCreated as CapsuleCreatedEvent,
  CapsuleOpened as CapsuleOpenedEvent
} from "../generated/TimeCapsule/TimeCapsule"
import { CapsuleCreated, CapsuleOpened } from "../generated/schema"

export function handleCapsuleCreated(event: CapsuleCreatedEvent): void {
  let entity = new CapsuleCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.capsuleIndex = event.params.capsuleIndex
  entity.title = event.params.title
  entity.unlockDate = event.params.unlockDate
  entity.dataURI = event.params.dataURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCapsuleOpened(event: CapsuleOpenedEvent): void {
  let entity = new CapsuleOpened(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.capsuleIndex = event.params.capsuleIndex
  entity.title = event.params.title
  entity.dataURI = event.params.dataURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
