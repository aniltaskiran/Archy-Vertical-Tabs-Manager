import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const distPath = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file doesn't exist, try to list directory contents
      if (req.url === '/' || req.url === '') {
        fs.readdir(distPath, (err, files) => {
          if (err) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
          }
          
          const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Archy Extension Files</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    ul { list-style-type: none; padding: 0; }
    li { margin: 10px 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Archy - Vertical Tabs Manager</h1>
  <h2>Extension Files:</h2>
  <ul>
    ${files.map(file => `<li><a href="/${file}" target="_blank">${file}</a></li>`).join('')}
  </ul>
</body>
</html>`;
          
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(html);
        });
        return;
      }
      
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      
      // Set content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      
      const contentType = contentTypes[ext] || 'text/plain';
      res.writeHead(200, {'Content-Type': contentType});
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});