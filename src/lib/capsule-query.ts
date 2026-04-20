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

export type CapsuleCreated = {
  id: string;
  capsuleIndex: string;
  title: string;
  unlockDate: string;
  dataURI: string;
  blockTimestamp: string;
};

export type CapsuleStatus = "locked" | "ready";

export type Capsule = CapsuleCreated & {
  status: CapsuleStatus;
  message?: string;
};

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
