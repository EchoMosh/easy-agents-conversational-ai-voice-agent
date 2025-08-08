# Knowledge Base Authentication Fix

## Problem
The knowledge base upload was failing with a 401 Unauthorized error when trying to create Trieve datasets. The error occurred because:

1. The frontend was calling edge functions using the anonymous Supabase key
2. The edge functions were not configured to handle authentication properly
3. The functions were rejecting requests without proper user authentication

## Solution
Updated both edge functions (`create-trieve-dataset` and `upload-to-trieve`) to:

1. **Check for Authorization Header**: Verify that the request includes an authorization token
2. **Validate User Authentication**: Use the token to verify the user is authenticated
3. **Use Service Role for Operations**: After authentication, use the service role key for database operations

## Changes Made

### 1. Edge Function Updates
Both functions now include authentication handling:

```typescript
// Get the authorization header
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'No authorization header' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Verify the user is authenticated
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: authHeader },
    },
  }
);

const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 2. Frontend Integration
The frontend already passes the auth token correctly via `supabase.functions.invoke()`, which automatically includes the user's session token in the Authorization header.

## Testing
Created `test-knowledge-upload-auth.js` to verify the fix works correctly with proper authentication.

## Result
✅ Edge functions now properly authenticate users before processing requests
✅ Knowledge base uploads work correctly for authenticated users
✅ Maintains security by requiring valid user sessions
