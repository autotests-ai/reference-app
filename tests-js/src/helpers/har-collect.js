/**
 * Client-side HAR via CDP Network events — no context.close() needed to flush
 * (unlike Playwright recordHar), so afterEach stays free of "Close context".
 */

function createHarCollector() {
  /** @type {Map<string, any>} */
  const requests = new Map();
  /** @type {Map<string, any>} */
  const responses = new Map();
  /** @type {Map<string, number>} */
  const finishedMs = new Map();
  /** @type {Map<string, number>} */
  const encodedBytes = new Map();
  /** @type {string[]} */
  const order = [];
  let wallStart = Number.NaN;
  let client = null;

  async function start(page) {
    client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    client.on('Network.requestWillBeSent', (params) => {
      const id = params.requestId;
      if (!id || !params.request) return;
      const ts = Number(params.timestamp);
      if (Number.isFinite(ts) && Number.isNaN(wallStart)) {
        wallStart = ts;
      }
      if (!requests.has(id)) {
        order.push(id);
      }
      requests.set(id, {
        url: String(params.request.url || ''),
        method: String(params.request.method || 'GET'),
        headers: params.request.headers || {},
        timestamp: ts,
        wallTime: params.wallTime != null ? Number(params.wallTime) : undefined,
      });
    });
    client.on('Network.responseReceived', (params) => {
      const id = params.requestId;
      if (!id || !params.response) return;
      responses.set(id, params.response);
    });
    client.on('Network.loadingFinished', (params) => {
      const id = params.requestId;
      if (!id) return;
      finishedMs.set(id, Number(params.timestamp) || 0);
      if (params.encodedDataLength != null) {
        encodedBytes.set(id, Number(params.encodedDataLength) || 0);
      }
    });
  }

  async function stop() {
    if (client) {
      await client.detach().catch(() => {});
      client = null;
    }
  }

  function toHarBytes() {
    const entries = [];
    for (const id of order) {
      const req = requests.get(id);
      if (!req) continue;
      const resp = responses.get(id) || {};
      const start = Number(req.timestamp);
      const end = finishedMs.has(id) ? finishedMs.get(id) : start;
      const timeMs =
        Number.isFinite(start) && Number.isFinite(end) && end >= start
          ? (end - start) * 1000
          : 0;
      let startedMs = Date.now();
      if (req.wallTime != null) {
        startedMs = Math.round(req.wallTime * 1000);
      } else if (Number.isFinite(wallStart) && Number.isFinite(end)) {
        startedMs = Date.now() - Math.round((end - wallStart) * 1000);
      }
      const size =
        encodedBytes.get(id) != null
          ? encodedBytes.get(id)
          : Number(resp.encodedDataLength) || 0;
      entries.push({
        startedDateTime: new Date(startedMs).toISOString(),
        time: timeMs,
        request: {
          method: req.method || 'GET',
          url: req.url,
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: headerList(req.headers),
          queryString: [],
          headersSize: -1,
          bodySize: -1,
        },
        response: {
          status: Number(resp.status) || 0,
          statusText: String(resp.statusText || ''),
          httpVersion: String(resp.protocol || 'HTTP/1.1'),
          cookies: [],
          headers: headerList(resp.headers),
          content: {
            size,
            mimeType: String(resp.mimeType || ''),
          },
          redirectURL: '',
          headersSize: -1,
          bodySize: -1,
        },
        cache: {},
        timings: {
          blocked: -1,
          dns: -1,
          connect: -1,
          ssl: -1,
          send: 0,
          wait: Math.max(0, timeMs),
          receive: 0,
        },
      });
    }
    return Buffer.from(
      JSON.stringify({
        log: {
          version: '1.2',
          creator: { name: 'reference-app har-collect', version: '1' },
          pages: [
            {
              startedDateTime: new Date().toISOString(),
              id: 'page_1',
              title: 'playwright-har',
              pageTimings: { onContentLoad: -1, onLoad: -1 },
            },
          ],
          entries,
        },
      }),
      'utf8',
    );
  }

  return { start, stop, toHarBytes };
}

function headerList(headers) {
  if (!headers || typeof headers !== 'object') return [];
  return Object.entries(headers).map(([name, value]) => ({
    name: String(name),
    value: value == null ? '' : String(value),
  }));
}

module.exports = { createHarCollector };
