import { gql } from "graphql-request";
import { querySubgraph } from "@/lib/api-client";

const GET_USER_CAPSULES = gql`
  query GetUserCapsules($owner: Bytes!) {
    capsuleCreateds(
      where: { owner: $owner }
      orderBy: capsuleIndex
      orderDirection: asc
    ) {
      id
      capsuleIndex
      title
      unlockDate
      dataURI
      blockTimestamp
    }
  }
`;

const GET_ALL_CAPSULE_ACTIVITY = gql`
  query GetAllCapsuleActivity($owner: Bytes!) {
    created: capsuleCreateds(
      where: { owner: $owner }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      title
      unlockDate
      blockTimestamp
      __typename
    }
    opened: capsuleOpeneds(
      where: { owner: $owner }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      blockTimestamp
      __typename
    }
  }
`;

export type CapsuleCreated = {
  id: string;
  capsuleIndex: string;
  title: string;
  unlockDate: string;
  dataURI: string;
  blockTimestamp: string;
};

export type CapsuleCreatedEvent = {
  id: string;
  title: string;
  unlockDate: string;
  blockTimestamp: string;
  __typename: "CapsuleCreated";
};

export type CapsuleOpenedEvent = {
  id: string;
  blockTimestamp: string;
  __typename: "CapsuleOpened";
};

export type CapsuleStatus = "locked" | "ready";

export type Capsule = CapsuleCreated & {
  status: CapsuleStatus;
  message?: string;
};

export type CapsuleActivityResponse = {
  created: CapsuleCreatedEvent[];
  opened: CapsuleOpenedEvent[];
};

export type CapsuleActivityItem =
  | (CapsuleCreatedEvent & { type: "created" })
  | (CapsuleOpenedEvent & { type: "opened" });

export async function GetUserCapsules(owner: string): Promise<Capsule[]> {
  // Query via backend API function (authentication handled server-side)
  const data: { capsuleCreateds: CapsuleCreated[] } = await querySubgraph(
    GET_USER_CAPSULES,
    { owner: owner.toLowerCase() }
  );

  const now = Math.floor(Date.now() / 1000);

  return data.capsuleCreateds.map((c) => ({
    ...c,
    status: Number(c.unlockDate) <= now ? "ready" : "locked",
  }));
}

/**
 * Get all capsule activity (created and opened events) for a user
 * Returns combined activity timeline sorted by timestamp
 */
export async function GetAllCapsuleActivity(owner: string): Promise<CapsuleActivityItem[]> {
  const data: CapsuleActivityResponse = await querySubgraph(
    GET_ALL_CAPSULE_ACTIVITY,
    { owner: owner.toLowerCase() }
  );

  // Combine created and opened events into a single timeline
  const createdItems: CapsuleActivityItem[] = data.created.map((event) => ({
    ...event,
    type: "created" as const,
  }));

  const openedItems: CapsuleActivityItem[] = data.opened.map((event) => ({
    ...event,
    type: "opened" as const,
  }));

  // Merge and sort by blockTimestamp descending (newest first)
  const allActivity = [...createdItems, ...openedItems].sort(
    (a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp)
  );

  return allActivity;
}

/**
 * Get detailed capsule info with creation and open status
 */
export async function GetCapsuleActivityWithStatus(
  owner: string
): Promise<
  (CapsuleCreatedEvent & { type: "created"; status: CapsuleStatus; isOpened: boolean })[]
> {
  const activity = await GetAllCapsuleActivity(owner);
  const now = Math.floor(Date.now() / 1000);

  // Build a set of opened capsule IDs
  const openedIds = new Set(
    activity.filter((item) => item.type === "opened").map((item) => item.id)
  );

  // Return created events with status and open tracking
  return activity
    .filter((item) => item.type === "created")
    .map((item) => ({
      ...(item as CapsuleCreatedEvent),
      type: "created" as const,
      status: Number(item.unlockDate) <= now ? "ready" : "locked",
      isOpened: openedIds.has(item.id),
    }));
}
