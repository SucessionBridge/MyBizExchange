async function handleSubmit(e) {
  e.preventDefault();

  if (!message || !buyer || !listing) return;

  try {
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        seller_id: listing.user_id || listing.seller_id, // adjust as needed
        buyer_name: buyer.name || buyer.full_name || buyer.email,
        buyer_email: buyer.email,
        topic: 'business-inquiry',
        extension: 'successionbridge',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Message failed:', result.error);
      alert('Message failed to send.');
    } else {
      console.log('✅ Message sent!');
      alert('Message sent to the seller!');
      setMessage('');
    }
  } catch (err) {
    console.error('❌ Error sending message:', err);
    alert('Something went wrong.');
  }
}
