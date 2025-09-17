const SANDBOX_API_KEY = 'mt_sandbox_employer_2025_demo';

const generateEmploymentData = (ssn) => {
  const profiles = {
    '777-77-7777': { risk: 'low', w2Count: 1, wages: 95000, employers: 1 },
    '888-88-8888': { risk: 'high', w2Count: 3, wages: 255000, employers: 3 },
    '999-99-9999': { risk: 'medium', w2Count: 1, wages: 135000, employers: 1 }
  };
  return profiles[ssn] || profiles['777-77-7777'];
};

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/employment-verify', '');
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }
  
  if (path === '/health' || path === '') {
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'healthy', 
        version: '3.0.0',
        endpoints: ['/health', '/verify']
      })
    };
  }
  
  if (event.httpMethod === 'POST' && path.includes('/verify')) {
    const body = JSON.parse(event.body || '{}');
    const data = generateEmploymentData(body.candidate_info?.ssn || body.ssn || '777-77-7777');
    
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request_id: 'req_' + Date.now(),
        status: 'completed',
        overemployment_risk: data.risk,
        employer_count: data.employers,
        total_wages: data.wages
      })
    };
  }
  
  return {
    statusCode: 404,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Not found' })
  };
};
