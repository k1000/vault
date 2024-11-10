addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.pathname === '/save' && request.method === 'POST') {
    await verifyAndStoreMessage(request);
    return new Response('Data saved securely!', { status: 200 });
  } else if (url.pathname === '/retrieve') {
    const data = await MY_KV_NAMESPACE.get('secure_data');
    return new Response(data, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('Not found', { status: 404 });
}

const recognizedPublicKey = '-----BEGIN PUBLIC KEY-----\n';

async function verifyAndStoreMessage(request) {
  const { signature, encryptedMessage } = await request.json();

  // Decode encrypted message and signature
  const encryptedArray = new Uint8Array(encryptedMessage);
  const signatureArray = new Uint8Array(signature);

  // Decrypt (optional, if you need to see the original message)
  // const decryptedMessage = await crypto.subtle.decrypt(
  //   { name: 'RSA-OAEP' },
  //   recognizedPublicKey,
  //   encryptedArray
  // );

  // Verify signature
  const isValid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    recognizedPublicKey,
    signatureArray,
    new TextEncoder().encode(decryptedMessage)
  );

  if (isValid) {
    // Store encrypted message if valid
    await MY_KV_NAMESPACE.put('secure_data', JSON.stringify(encryptedMessage));
    return new Response('Message verified and stored.', { status: 200 });
  } else {
    return new Response('Verification failed: Unrecognized public key.', {
      status: 403,
    });
  }
}
