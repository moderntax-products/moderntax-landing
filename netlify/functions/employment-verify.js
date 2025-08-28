const SANDBOX_API_KEY = 'mt_sandbox_employer_2025_demo';
const WEBHOOK_SECRET = 'whsec_employer_com_sandbox_secret';
const requests = new Map();

const validateApiKey = (req) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  const apiKey = auth?.replace('Bearer ', '');
  return apiKey === SANDBOX_API_KEY;
};

exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/employment-verify', '');
  
  try {
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

    // GET /docs - API Documentation
    if (event.httpMethod === 'GET' && (path === '/docs' || path === '')) {
      const baseUrl = 'https://sandbox.moderntax.io/.netlify/functions/employment-verify';
      
      return {
        statusCode: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'ModernTax Employment Verification API',
          client: 'Employer.com POC',
          version: '1.0.0',
          baseUrl: baseUrl,
          credentials: {
            api_key: SANDBOX_API_KEY,
            webhook_secret: WEBHOOK_SECRET,
            note: 'Use these credentials for all API requests'
          },
          endpoints: {
            documentation: `${baseUrl}/docs`,
            create_verification: {
              method: 'POST',
              url: `${baseUrl}/api/v1/employment/verify`,
              description: 'Create new employment verification request'
            },
            check_status: {
              method: 'GET', 
              url: `${baseUrl}/api/v1/employment/verify/{request_id}`,
              description: 'Check verification request status'
            },
            health_check: {
              method: 'GET',
              url: `${baseUrl}/health`,
              description: 'API health status'
            }
          },
          test_example: {
            description: 'Test the API with this curl command',
            curl: `curl -X POST '${baseUrl}/api/v1/employment/verify' \\
  -H 'Authorization: Bearer ${SANDBOX_API_KEY}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "candidate_info": {
      "ssn": "123-45-6789",
      "first_name": "John",
      "last_name": "Smith",
      "current_address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94105"
      }
    },
    "employer_info": {
      "company_name": "Employer.com",
      "contact_email": "joe@mainstreet.com"
    },
    "consent_token": "consent_test_12345",
    "service_level": "standard",
    "years_requested": 3
  }'`
          }
        })
      };
    }

    // POST /api/v1/employment/verify
    if (event.httpMethod === 'POST' && path === '/api/v1/employment/verify') {
      if (!validateApiKey(event)) {
        return {
          statusCode: 401,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid API key' })
        };
      }

      const body = JSON.parse(event.body);
      const request_id = 'req_' + Math.random().toString(36).substring(2, 15);
      
      const results = {
        candidate_id: body.candidate_info?.ssn?.slice(-4) || '6789',
        verification_status: 'verified',
        employment_history: [
          {
            tax_year: 2024,
            employer_ein: '12-3456789',
            employer_name: 'TechCorp Solutions Inc',
            employer_address: '123 Business Ave, San Francisco, CA 94105',
            total_wages: 95000,
            document_type: 'W-2'
          }
        ],
        analysis: {
          total_employers: 1,
          overemployment_risk_score: 'low'
        }
      };

      return {
        statusCode: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          request_id,
          status: 'completed',
          results,
          message: 'Employment verification completed instantly for demo'
        })
      };
    }

    // Health check
    if (event.httpMethod === 'GET' && path === '/health') {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          status: 'healthy',
          service: 'ModernTax Employment Verification API',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: ['/docs', '/health', '/api/v1/employment/verify']
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
