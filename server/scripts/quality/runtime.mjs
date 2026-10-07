import http from 'node:http';

const port = process.env.PORT || '3000';
const host = process.env.HOST || 'localhost';
const baseUrl = `http://${host}:${port}`;

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${path}`, (res) => {
      let body = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, body });
      });
    });

    req.setTimeout(5_000, () => {
      req.destroy(new Error(`Timed out while calling ${path}`));
    });
    req.on('error', reject);
  });
}

async function main() {
  const root = await request('/api/v1');
  if (root.statusCode !== 200) {
    throw new Error(`GET /api/v1 returned HTTP ${root.statusCode}`);
  }

  const health = await request('/health');
  if (health.statusCode !== 200) {
    throw new Error(`GET /health returned HTTP ${health.statusCode}`);
  }

  let parsedHealth;
  try {
    parsedHealth = JSON.parse(health.body);
  } catch {
    throw new Error('GET /health did not return JSON');
  }

  if (parsedHealth.status !== 'ok') {
    throw new Error(
      `Runtime dependencies are not ready: ${JSON.stringify(parsedHealth)}`,
    );
  }

  console.log(`Runtime OK at ${baseUrl}`);
  console.log(`API root: ${root.body}`);
  console.log(`Health: ${health.body}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
