const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const fs = require('fs');

const dataDir = path.resolve(__dirname, '..', '.postgres_data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function start() {
  console.log('🚀 Initializing Local Embedded PostgreSQL Engine...');

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    persistent: true
  });

  try {
    await pg.initialise();
  } catch (err) {
    // Already initialized
  }

  await pg.start();
  console.log('✅ Local PostgreSQL server is running on localhost:5432');
  console.log('📦 User: postgres | Password: postgres');

  // Keep process running
  setInterval(() => {}, 1000);

  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pg.stop();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start local database:', err);
  process.exit(1);
});
