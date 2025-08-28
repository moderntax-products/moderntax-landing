import type { Context, Config } from "@netlify/functions";

// Fixed credentials for Employer.com testing
const SANDBOX_API_KEY = 'mt_sandbox_employer_2025_demo';
const WEBHOOK_SECRET = 'whsec_employer_com_sandbox_secret';

// In-memory storage for demo (use database in production)
const requests = new Map<string, any>();

const validateApiKey = (req: Request): boolean => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  const apiKey = auth?.replace('Bearer ', '');
  return apiKey === SANDBOX_API_KEY;
};

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/.netlify/functions/employment-verify', '');
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('', {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      });
    }

    // POST /api/v1/employment/verify - Create verification request
    if (req.method === 'POST' && path === '/api/v1/employment/verify') {
      if (!validateApiKey(req)) {
        return Response.json({ error: 'Invalid API key' }, { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const body = await req.json();
      const {
        candidate_info,
        employer_info,
        consent_token,
        service_level = 'standard',
        years_requested = 3
      } = body;

      // Validation
      const required = ['candidate_info', 'employer_info', 'consent_token'];
      const missing = required.filter(field => !body[field]);
      if (missing.length > 0) {
        return Response.json({
          error: 'Missing required fields',
          missing_fields: missing
        }, { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const { ssn, first_name, last_name, current_address } = candidate_info;
      if (!ssn || !first_name || !last_name || !current_address) {
        return Response.json({
          error: 'Incomplete candidate information',
          required: ['ssn', 'first_name', 'last_name', 'current_address']
        }, { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const request_id = 'req_' + Math.random().toString(36).substring(2, 15);
      const delivery_minutes = service_level === 'express' ? 240 : 1440;
      const estimated_delivery = new Date(Date.now() + delivery_minutes * 60000);

      // Generate realistic employment results immediately for demo
      const results = generateEmploymentResults({
        candidate_info,
        years_requested
      });

      const requestData = {
        request_id,
        status: 'completed',
        service_level,
        years_requested,
        candidate_info: {
          ...candidate_info,
          ssn: '***-**-' + ssn.slice(-4) // Mask SSN
        },
        employer_info,
        consent_token,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        estimated_delivery: estimated_delivery.toISOString(),
        pricing: {
          service_level,
          base_price: service_level === 'express' ? 45 : 35,
          years_requested,
          year_multiplier: years_requested > 1 ? 1 + ((years_requested - 1) * 0.2) : 1,
          total_price: Math.round((service_level === 'express' ? 45 : 35) * (1 + (years_requested - 1) * 0.2)),
          currency: 'USD'
        },
        results
      };

      // Store request for status checking
      requests.set(request_id, requestData);

      return Response.json({
        request_id,
        status: 'completed',
        estimated_delivery: estimated_delivery.toISOString(),
        pricing: requestData.pricing,
        results: results,
        message: 'Employment verification completed instantly for demo'
      }, {
        status: 201,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /api/v1/employment/verify/:id - Check request status
    if (req.method === 'GET' && path.startsWith('/api/v1/employment/verify/')) {
      if (!validateApiKey(req)) {
        return Response.json({ error: 'Invalid API key' }, { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const request_id = path.split('/').pop();
      const request = requests.get(request_id);

      if (!request) {
        return Response.json({ error: 'Request not found' }, { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      return Response.json(request, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /docs - API Documentation
    if (req.method === 'GET' && (path === '/docs' || path === '')) {
      const baseUrl = 'https://sandbox.moderntax.io/.netlify/functions/employment-verify';
      
      return Response.json({
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
        }
      }, {
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // GET /health - Health check
    if (req.method === 'GET' && path === '/health') {
      return Response.json({
        status: 'healthy',
        service: 'ModernTax Employment Verification API',
        timestamp: new Date().toISOString(),
        uptime: 'API is operational',
        demo_mode: true
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 404 for unknown paths
    return Response.json({ 
      error: 'Endpoint not found',
      available_endpoints: [
        '/docs',
        '/health', 
        '/api/v1/employment/verify',
        '/api/v1/employment/verify/:id'
      ]
    }, { 
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Employment verification API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: 'Please check request format and try again'
    }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};

function generateEmploymentResults(request: any) {
  const { candidate_info, years_requested } = request;
  const currentYear = new Date().getFullYear();
  const employmentHistory: any[] = [];
  
  // 30% chance of overemployment scenario for testing
  const hasOveremployment = Math.random() < 0.3;
  
  for (let year = currentYear - years_requested; year <= currentYear - 1; year++) {
    // Primary employer - always present
    employmentHistory.push({
      tax_year: year,
      employer_ein: '12-3456789',
      employer_name: 'TechCorp Solutions Inc',
      employer_address: '123 Business Ave, San Francisco, CA 94105',
      total_wages: Math.floor(85000 + Math.random() * 40000),
      federal_tax_withheld: Math.floor(15000 + Math.random() * 8000),
      social_security_wages: Math.floor(85000 + Math.random() * 40000),
      medicare_wages: Math.floor(85000 + Math.random() * 40000),
      retirement_contributions_401k: Math.floor(5000 + Math.random() * 15000),
      document_type: 'W-2',
      employment_months: 12
    });

    // Add second employer for overemployment scenario
    if (hasOveremployment) {
      employmentHistory.push({
        tax_year: year,
        employer_ein: '98-7654321',
        employer_name: 'DataFlow Systems LLC', 
        employer_address: '456 Tech Dr, Austin, TX 78701',
        total_wages: Math.floor(75000 + Math.random() * 30000),
        federal_tax_withheld: Math.floor(12000 + Math.random() * 6000),
        social_security_wages: Math.floor(75000 + Math.random() * 30000),
        medicare_wages: Math.floor(75000 + Math.random() * 30000),
        retirement_contributions_401k: Math.floor(4000 + Math.random() * 12000),
        document_type: 'W-2',
        employment_months: 12
      });
    }
  }

  const currentYearData = employmentHistory.filter(e => e.tax_year === currentYear - 1);
  const w2Count = currentYearData.filter(e => e.document_type === 'W-2').length;
  const totalIncome = currentYearData.reduce((sum, e) => sum + (e.total_wages || e.total_income || 0), 0);

  // Calculate overemployment risk score
  let riskScore = 'low';
  if (w2Count > 1) {
    riskScore = totalIncome > 150000 ? 'high' : 'medium';
  }

  const analysis = {
    total_employers: new Set(employmentHistory.map(e => e.employer_ein)).size,
    total_annual_income: totalIncome,
    w2_employers_current_year: w2Count,
    overemployment_risk_score: riskScore,
    multiple_401k_contributions: currentYearData
      .filter(e => e.retirement_contributions_401k && e.retirement_contributions_401k > 0).length > 1,
    data_freshness: new Date().toISOString()
  };

  return {
    candidate_id: candidate_info.ssn.slice(-4),
    verification_status: 'verified',
    employment_history: employmentHistory,
    analysis
  };
}

export const config: Config = {
  path: [
    "/employment-verify",
    "/employment-verify/*"
  ]
};
