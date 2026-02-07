export async function handler(event) {
    try {
      const SCRIPT_URL =
        'https://script.google.com/macros/s/AKfycbypBBxnMMl5uJe7C6JQFEJXw6Qy26XSMDZ4dqZfVuQr2i7QNQ5cRSqJXSZoXFN9ETu73w/exec';
  
      const res = await fetch(SCRIPT_URL, {
        method: event.httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: event.httpMethod === 'GET' ? null : event.body
      });
  
      const text = await res.text();
  
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: text
      };
  
    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'error',
          message: err.message || String(err)
        })
      };
    }
  }
  