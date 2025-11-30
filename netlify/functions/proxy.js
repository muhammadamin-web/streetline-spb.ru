const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
  try {
    const path = event.path || '/';
    const queryStringParameters = event.queryStringParameters || {};
    
    // Route 1: HTML proxy at /
    if (path === '/' || path === '') {
      try {
        // Fetch HTML from Vercel origin
        const response = await fetchUrl('https://streetline-spb-ru-git-main-muhammadamin-webs-projects.vercel.app');
        let html = response.body;
        
        // Rewrite framerusercontent.com URLs to local CDN proxy
        html = html.replace(
          /https:\/\/framerusercontent\.com/g,
          '/.netlify/functions/cdn?url=https://framerusercontent.com'
        );
        
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          },
          body: html
        };
      } catch (error) {
        console.error('HTML proxy error:', error);
        return { 
          statusCode: 500, 
          body: 'Error fetching HTML: ' + error.message 
        };
      }
    }
    
    // Route 2: CDN proxy at /.netlify/functions/cdn
    if (path === '/.netlify/functions/cdn' || path.startsWith('/.netlify/functions/cdn')) {
      try {
        const url = queryStringParameters.url;
        if (!url) {
          return { 
            statusCode: 400, 
            body: 'Missing url parameter' 
          };
        }
        
        // Fetch the CDN resource
        const response = await fetchUrl(url);
        
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': response.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
          },
          body: response.body,
          isBase64Encoded: true
        };
      } catch (error) {
        console.error('CDN proxy error:', error);
        return { 
          statusCode: 500, 
          body: 'Error fetching CDN resource: ' + error.message 
        };
      }
    }
    
    return { 
      statusCode: 404, 
      body: 'Not found' 
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return { 
      statusCode: 500, 
      body: 'Internal server error: ' + error.message 
    };
  }
};

// Helper function to fetch URLs and return base64-encoded body
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        // Determine content type
        const contentType = res.headers['content-type'] || 'application/octet-stream';
        
        // Check if response is text or binary
        const isText = contentType.includes('text/') || contentType.includes('application/json');
        
        let body;
        if (isText) {
          body = data.toString('utf-8');
        } else {
          body = data.toString('base64');
        }
        
        resolve({
          body: body,
          contentType: contentType,
          isBase64Encoded: !isText
        });
      });
    }).on('error', (err) => {
      reject(new Error('Failed to fetch ' + url + ': ' + err.message));
    });
  });
}
