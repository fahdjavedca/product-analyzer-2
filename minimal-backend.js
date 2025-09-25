const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Backend is running' }));
    return;
  }

  if (req.url === '/api/products/generate-keywords' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { productTitle } = data;
        
        // Simple keyword extraction fallback
        const keywords = productTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 3);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            keywords,
            isRealData: false
          }
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Failed to parse request'
        }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Minimal backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
