export const authenticateWithCasinoToken = async (casinoToken) => {
  try {
    const response = await fetch('http://192.168.88.201:5002/Hub/Authentificate', {
      method: 'POST',
      headers: {
        'accept': 'application/json', // Expecting JSON response
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        casinoToken
      })
    });

    if (!response.ok) {
      throw new Error(`Hub Authentication failed: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    if (!result.succeeded || !result.data || !result.data.accessToken) {
      throw new Error(result.message || result.error || 'Hub Authentication succeeded but accessToken not found in response.');
    }
    console.log('Hub Authentication successful. Hub accessToken:', result.data.accessToken);
    return result.data.accessToken; // This is the token to be used for the next call
  } catch (error) {
    console.error('Error during Hub Authentication:', error);
    throw error;
  }
};

