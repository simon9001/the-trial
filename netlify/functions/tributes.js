export async function handler(event) {
    try {
      const SCRIPT_URL =
        'https://script.google.com/macros/s/AKfycbxGJYGMlwzuMMtDF93sfvVy90WSfYaxaWWKdqM_wzqHBWM6t1XuFCgjj-ml7BxlGcLskw/exec';
  
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
  