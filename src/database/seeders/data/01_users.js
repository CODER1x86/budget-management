/**
 * User Seeder
 * Generates test users including admin and regular users
 */

const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const Seeder = require('../Seeder');
const { BCRYPT_ROUNDS } = require('../../../config/environment');

class UserSeeder extends Seeder {
  async seed() {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!@#', BCRYPT_ROUNDS);
    await this.db.run(`
      INSERT INTO users (
        email, password, name, role, is_verified,
        created_at, updated_at
      ) VALUES (
        'admin@example.com', ?, 'System Admin', 'admin', 1,
        datetime('now'), datetime('now')
      )
    `, [adminPassword]);

    // Create test users
    const userTemplate = {
      email: () => faker.internet.email(),
      password: async () => await bcrypt.hash('Test123!@#', BCRYPT_ROUNDS),
      name: () => faker.person.fullName(),
      phone: () => faker.phone.number(),
      role: 'user',
      is_verified: () => faker.datatype.boolean(),
      created_at: () => faker.date.past().toISOString(),
      updated_at: () => new Date().toISOString()
    };

    // Generate 50 random users
    for (let i = 0; i < 50; i++) {
      const user = {};
      for (const [key, generator] of Object.entries(userTemplate)) {
        user[key] = typeof generator === 'function' ? 
          (generator.constructor.name === 'AsyncFunction' ? 
            await generator() : generator()) : 
          generator;
      }

      const columns = Object.keys(user).join(', ');
      const placeholders = Object.keys(user).map(() => '?').join(', ');
      const values = Object.values(user);

      await this.db.run(`
        INSERT INTO users (${columns})
        VALUES (${placeholders})
      `, values);
    }
  }
}

module.exports = UserSeeder;
