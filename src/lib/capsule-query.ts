import { gql, request } from 'graphql-request';

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/1742250/time-capsule/version/latest";
const SUBGRAPH_HEADERS = { Authorization: `Bearer ${import.meta.env.VITE_SUBGRAPH_API}` };

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
`

export type CapsuleCreated = {
    id: string
    capsuleIndex: string
    title: string
    unlockDate: string
    dataURI: string
    blockTimestamp: string
}

export type CapsuleStatus = 'locked' | 'ready'

export type Capsule = CapsuleCreated & {
    status: CapsuleStatus,
    message?: string
}

export async function GetUserCapsules(owner: string): Promise<Capsule[]> {
    const data: { capsuleCreateds: CapsuleCreated[] } = await request(
        SUBGRAPH_URL,
        GET_USER_CAPSULES,
        { owner: owner.toLowerCase() },
        SUBGRAPH_HEADERS
    )

    const now = Math.floor(Date.now() / 1000)

    return data.capsuleCreateds.map((c) => ({
        ...c,
        status: Number(c.unlockDate) <= now ? 'ready' : 'locked'
    }))
}