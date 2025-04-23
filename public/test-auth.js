// Function to test login
async function testLogin(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login failed');
    return { success: false, error: error.message };
  }
}

// Function to check if we're authenticated
async function checkAuthentication() {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        status: response.status,
        statusText: response.statusText
      };
    }
    
    const result = await response.json();
    console.log('Authentication check:', result);
    return result;
  } catch (error) {
    console.error('Authentication check error:', error);
    return { success: false, error: error.message };
  }
}

// Function to check session details
async function debugSession() {
  try {
    const response = await fetch('/api/auth/debug-session', {
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('Session debug:', result);
    return result;
  } catch (error) {
    console.error('Session debug error:', error);
    return { success: false, error: error.message };
  }
}

// Function to test admin access
async function testAdminAccess() {
  try {
    const response = await fetch('/api/admin-tools/test-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        status: response.status,
        statusText: response.statusText,
        message: await response.text()
      };
    }
    
    const result = await response.json();
    console.log('Admin access test:', result);
    return result;
  } catch (error) {
    console.error('Admin access test error:', error);
    return { success: false, error: error.message };
  }
}

// Log out function
async function testLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('Logout response:', result);
    return result;
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Function to run full authentication test sequence
async function runAuthTest(username = 'admin', password = 'admin123') {
  console.group('🔍 Authentication Test');
  
  console.log('1. Checking initial session state...');
  await debugSession();
  
  console.log('2. Checking initial authentication...');
  const initialAuth = await checkAuthentication();
  
  console.log('3. Attempting login...');
  const loginResult = await testLogin(username, password);
  
  if (loginResult.success) {
    console.log('4. Login successful, checking session after login...');
    await debugSession();
    
    console.log('5. Verifying authentication after login...');
    await checkAuthentication();
    
    console.log('6. Testing admin access...');
    await testAdminAccess();
    
    console.log('7. Logging out...');
    await testLogout();
    
    console.log('8. Checking session after logout...');
    await debugSession();
    
    console.log('9. Verifying authentication after logout...');
    await checkAuthentication();
  } else {
    console.error('Login failed, skipping remaining tests');
  }
  
  console.groupEnd();
  
  return {
    initialAuth,
    loginResult
  };
}

// Export functions for console use
window.testLogin = testLogin;
window.checkAuthentication = checkAuthentication;
window.debugSession = debugSession;
window.testAdminAccess = testAdminAccess;
window.testLogout = testLogout;
window.runAuthTest = runAuthTest;

console.log('🔐 Auth Test Utilities loaded!');
console.log('To run a complete test, type: runAuthTest()');
console.log('To run individual tests, use:');
console.log('- testLogin("username", "password")');
console.log('- checkAuthentication()');
console.log('- debugSession()');
console.log('- testAdminAccess()');
console.log('- testLogout()');