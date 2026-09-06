const localtunnel = require('localtunnel');

(async () => {
  try {
    console.log('Connecting to global tunnel gateway...');
    const tunnel = await localtunnel({ port: 5173 });
    console.log(`🌍 GLOBAL PUBLIC URL: ${tunnel.url}`);

    try {
      const ip = await fetch('https://loca.lt/mytunnelpassword').then((r) => r.text());
      console.log(`🔑 Tunnel IP Password (if prompted by friendly browser check): ${ip.trim()}`);
    } catch (e) {
      // ignore
    }

    tunnel.on('close', () => {
      console.log('Tunnel connection closed.');
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel encountered error:', err);
    });
  } catch (err) {
    console.error('Failed to initialize localtunnel:', err);
  }
})();
