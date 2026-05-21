// ============================================================
// Netlify Function — GAS Proxy
// بيستقبل الـ request من الـ HTML ويبعته لـ GAS
// من الـ server side = مفيش CORS
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOt_wxvDgDhEaHtvebNQIMa_b1Q03XOYztILAvPbfOT8j1H9aOUmy4rr3XqNeyCij3/exec';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type'                : 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    let gasRes;

    if (event.httpMethod === 'GET') {
      // قراءة البيانات
      gasRes = await fetch(GAS_URL, { method: 'GET', redirect: 'follow' });

    } else if (event.httpMethod === 'POST') {
      // كتابة / تعديل / حذف
      const body = event.body || '{}';
      gasRes = await fetch(GAS_URL, {
        method  : 'POST',
        redirect: 'follow',
        headers : { 'Content-Type': 'application/json' },
        body,
      });
    } else {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const text = await gasRes.text();
    return { statusCode: 200, headers, body: text };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
