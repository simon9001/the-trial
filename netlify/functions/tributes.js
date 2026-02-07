export async function handler(event) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwHVNKPTGBjLXPYJOEv_yItH6X66KbKB75TnCpBRyRdfveX4Oth0Jj_uVcUlLwpi2LS9A/exec';
  
    const res = await fetch(SCRIPT_URL, {
      method: event.httpMethod,
      headers: { 'Content-Type': 'application/json' },
      body: event.body
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
  }
  