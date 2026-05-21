// ============================================================
// Netlify Function — GAS Proxy
// GET  → بيمرر للـ GAS مباشرة
// POST → بيحول الـ body لـ GET parameter عشان GAS مش بيقرأ POST body صح
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOt_wxvDgDhEaHtvebNQIMa_b1Q03XOYztILAvPbfOT8j1H9aOUmy4rr3XqNeyCij3/exec';

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type'                : 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    let url = GAS_URL;
    let gasRes;

    if (event.httpMethod === 'GET') {
      gasRes = await fetch(url, { method: 'GET', redirect: 'follow' });

    } else if (event.httpMethod === 'POST') {
      // GAS مش بيقرأ POST body بعد الـ redirect
      // الحل: نحط الـ body كـ URL parameter
      const body = JSON.parse(event.body || '{}');
      const params = new URLSearchParams();
      params.set('action', body.action);

      if (body.action === 'delete') {
        params.set('id', String(body.id));
      } else {
        params.set('data', JSON.stringify(body.row || body));
      }

      url = GAS_URL + '?' + params.toString();
      gasRes = await fetch(url, { method: 'GET', redirect: 'follow' });
    }

    const text = await gasRes.text();

    // تأكد إن الـ response JSON مش HTML
    let result;
    try {
      result = JSON.parse(text);
    } catch(e) {
      console.error('GAS returned non-JSON:', text.slice(0, 200));
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'GAS returned invalid response', raw: text.slice(0, 200) }),
      };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(result) };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
