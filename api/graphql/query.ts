/**
 * API endpoint for secure GraphQL queries to The Graph subgraph
 * This runs server-side so the subgraph API key is never exposed to the browser
 *
 * POST /api/graphql/query
 * Request: { query: string, variables?: Record<string, any> }
 * Response: GraphQL response with data or errors
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { query, variables } = req.body as GraphQLRequest;
    const subgraphUrl = process.env.VITE_SUBGRAPH_URL;
    const apiKey = process.env.VITE_SUBGRAPH_API_KEY;

    // Validate environment variables
    if (!subgraphUrl || !apiKey) {
      console.error('Missing subgraph configuration');
      return res.status(500).json({ error: 'Subgraph configuration error' });
    }

    // Validate request
    if (!query) {
      return res.status(400).json({ error: 'Missing query field' });
    }

    // Make GraphQL request with auth header
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    if (!response.ok) {
      console.error(`GraphQL request failed: ${response.status}`);
      return res.status(response.status).json({
        error: `GraphQL request failed with status ${response.status}`,
      });
    }

    const graphqlResponse = (await response.json()) as GraphQLResponse;

    // Return the GraphQL response (including errors if any)
    return res.status(200).json(graphqlResponse);
  } catch (error) {
    console.error('GraphQL query error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process GraphQL query',
    });
  }
}
