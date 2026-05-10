const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      user: 'cAA67S7mzDYej3A.root',
      password: 'g3wQ5bRdPD4x7if0',
      database: 'test',
      port: 4000,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    });

    console.log('Connected to database');
    
    await conn.query(`ALTER TABLE et_timesheets MODIFY COLUMN TS_WORKING_STATUS ENUM('Working', 'PTO', 'Holiday', 'General')`);
    
    console.log('Schema updated successfully');
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
