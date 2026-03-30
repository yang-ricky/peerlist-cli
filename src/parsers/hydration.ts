export function extractNextData(html: string): unknown | null {
  const match = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function extractRscPayload(html: string): string[] {
  const matches = [...html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\);?/g)];

  return matches.map((match) => match[1]).filter(Boolean);
}

export function extractStructuredData(html: string): unknown[] {
  const matches = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];

  const payloads: unknown[] = [];

  for (const match of matches) {
    try {
      payloads.push(JSON.parse(match[1]));
    } catch {
      continue;
    }
  }

  return payloads;
}
