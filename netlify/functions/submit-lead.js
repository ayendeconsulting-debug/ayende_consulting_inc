// Netlify Function: submit-lead.js
// This function receives contact form submissions and creates leads in Supabase

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Initialize Supabase client with environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Server configuration error. Please contact support.' 
      })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse form data
    const formData = JSON.parse(event.body);
    
    console.log('Received form submission:', {
      name: formData.name,
      email: formData.email,
      company: formData.company || 'Not provided'
    });
    
    // Extract name parts (handle both single and full names)
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0] || formData.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare lead data for database
    const leadData = {
      first_name: firstName,
      last_name: lastName,
      email: formData.email,
      phone: formData.phone || null,
      company_name: formData.company || null,
      job_title: null,
      lead_source: 'website', // As specified
      lead_status: 'new', // As specified
      lead_score: 50, // Default score for new leads
      project_description: formData.message,
      interested_services: formData.service ? [formData.service] : [],
      industry: null,
      company_size: null,
      estimated_budget: null,
      project_timeline: null,
      next_follow_up_date: null
    };

    console.log('Inserting lead into Supabase...');

    // Insert lead into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Lead created successfully:', data[0].id);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for your inquiry! We will be in touch with you shortly.',
        leadId: data[0].id
      })
    };

  } catch (error) {
    console.error('Error processing form:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to submit form. Please try again or email us directly at ayendeconsulting@gmail.com'
      })
    };
  }
};
