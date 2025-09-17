const SANDBOX_API_KEY = 'mt_sandbox_employer_2025_demo';

// Benefits Eligibility Data
const benefitsProfiles = {
  '111-11-1111': {
    annual_income: 15000,
    magi: 16500,
    medicaid_eligible: true,
    snap_eligible: true,
    medicaid_threshold: 20782.8,
    snap_threshold: 19578
  },
  '222-22-2222': {
    annual_income: 22000,
    magi: 23500,
    medicaid_eligible: false,
    snap_eligible: true,
    medicaid_threshold: 20782.8,
    snap_threshold: 29578
  },
  '333-33-3333': {
    annual_income: 45000,
    magi: 47000,
    medicaid_eligible: false,
    snap_eligible: false,
    medicaid_threshold: 20782.8,
    snap_threshold: 19578
  }
};

// Lending Verification Data
const lendingProfiles = {
  '444-44-4444': {
    adjusted_gross_income: 85000,
    wage_income: 75000,
    self_employment_income: 10000,
    filing_status: 'married_filing_jointly',
    has_1040: true,
    has_w2: true,
    has_schedule_c: true
  },
  '555-55-5555': {
    adjusted_gross_income: 120000,
    wage_income: 0,
    self_employment_income: 120000,
    filing_status: 'single',
    has_1040: true,
    has_w2: false,
    has_schedule_c: true
  },
  '666-66-6666': {
    adjusted_gross_income: 150000,
    wage_income: 100000,
    self_employment_income: 35000,
    other_income: 15000,
    filing_status: 'married_filing_jointly',
    has_1040: true,
    has_w2: true,
    has_schedule_c: true
  }
};

// Employment Verification Data
const employmentProfiles = {
  '777-77-7777': {
    risk: 'low',
    w2Count: 1,
    wages: 95000,
    employers: 1,
    employer_name: 'TechCorp Solutions Inc'
  },
  '888-88-8888': {
    risk: 'high',
    w2Count: 3,
    wages: 255000,
    employers: 3,
    employer_name: 'Multiple Employers Detected'
  },
  '999-99-9999': {
    risk: 'medium',
    w2Count: 1,
    wages: 135000,
    employers: 1,
    employer_name: 'TechCorp + 1099 Income'
  }
};

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/employment-verify', '');
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }
  
  // Health check endpoint
  if (path === '/health' || (event.httpMethod === 'GET' && path === '')) {
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'healthy', 
        version: '3.0.0',
        endpoints: {
          health: 'GET /health',
          verify: 'POST /verify',
          employment_verify: 'POST /employment/verify'
        },
        use_cases: ['benefits', 'lending', 'employment'],
        test_ssns: {
          benefits: ['111-11-1111', '222-22-2222', '333-33-3333'],
          lending: ['444-44-4444', '555-55-5555', '666-66-6666'],
          employment: ['777-77-7777', '888-88-8888', '999-99-9999']
        }
      })
    };
  }
  
  // Main verification endpoint
  if (event.httpMethod === 'POST' && (path === '/verify' || path.includes('/verify'))) {
    try {
      const body = JSON.parse(event.body || '{}');
      
      // Determine use case from request
      const useCase = body.use_case || 
                     (body.candidate_info ? 'employment' : null) ||
                     (body.applicant ? 'benefits' : null) ||
                     (body.borrower ? 'lending' : null) ||
                     'employment';
      
      // Get SSN from various possible locations
      const ssn = body.ssn || 
                  body.candidate_info?.ssn || 
                  body.applicant?.ssn || 
                  body.borrower?.ssn ||
                  '777-77-7777';
      
      const requestId = 'req_' + Date.now();
      
      // Handle Benefits Eligibility
      if (useCase === 'benefits' || benefitsProfiles[ssn]) {
        const data = benefitsProfiles[ssn] || benefitsProfiles['111-11-1111'];
        return {
          statusCode: 200,
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            request_id: requestId,
            status: 'completed',
            use_case: 'benefits',
            data_preview: {
              annual_income: data.annual_income,
              magi: data.magi,
              eligibility: {
                medicaid: data.medicaid_eligible,
                snap: data.snap_eligible,
                medicaid_threshold: data.medicaid_threshold,
                snap_threshold: data.snap_threshold
              }
            }
          })
        };
      }
      
      // Handle Lending Verification
      if (useCase === 'lending' || lendingProfiles[ssn]) {
        const data = lendingProfiles[ssn] || lendingProfiles['444-44-4444'];
        return {
          statusCode: 200,
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            request_id: requestId,
            status: 'completed',
            use_case: 'lending',
            verification_data: {
              adjusted_gross_income: data.adjusted_gross_income,
              wage_income: data.wage_income,
              self_employment_income: data.self_employment_income,
              filing_status: data.filing_status,
              documents_available: {
                form_1040: data.has_1040,
                form_w2: data.has_w2,
                schedule_c: data.has_schedule_c
              }
            }
          })
        };
      }
      
      // Handle Employment Verification (default)
      const data = employmentProfiles[ssn] || employmentProfiles['777-77-7777'];
      return {
        statusCode: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          status: 'completed',
          use_case: 'employment',
          overemployment_risk: data.risk,
          employer_count: data.employers,
          total_wages: data.wages,
          w2_count: data.w2Count,
          primary_employer: data.employer_name
        })
      };
      
    } catch (error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Invalid request',
          message: error.message 
        })
      };
    }
  }
  
  // 404 for unknown endpoints
  return {
    statusCode: 404,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ 
      error: 'Endpoint not found',
      available_endpoints: ['/health', '/verify']
    })
  };
};
