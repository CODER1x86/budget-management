/**
 * Maintenance Request Seeder
 * Generates test maintenance requests with realistic scenarios
 */

const { faker } = require('@faker-js/faker');
const Seeder = require('../Seeder');

class MaintenanceRequestSeeder extends Seeder {
  async seed() {
    // Get existing users and properties
    const users = await this.db.all('SELECT user_id FROM users WHERE role = ?', ['user']);
    const properties = await this.db.all('SELECT property_id FROM properties');

    const issues = [
      'Plumbing leak', 'Electrical issue', 'HVAC not working',
      'Broken appliance', 'Pest control needed', 'Structural damage',
      'Lock replacement', 'Window repair', 'Paint touch-up'
    ];

    // Generate 200 maintenance requests
    for (let i = 0; i < 200; i++) {
      const user = faker.helpers.arrayElement(users);
      const property = faker.helpers.arrayElement(properties);
      
      const request = {
        property_id: property.property_id,
        user_id: user.user_id,
        issue: faker.helpers.arrayElement(issues),
        description: faker.lorem.paragraph(),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'emergency']),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'cancelled']),
        scheduled_date: faker.date.future().toISOString(),
        created_at: faker.date.past().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert maintenance request
      const { lastID } = await this.db.run(`
        INSERT INTO maintenance_requests (
          property_id, user_id, issue, description, priority,
          status, scheduled_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, Object.values(request));

      // Generate 1-5 comments for each request
      const commentCount = faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < commentCount; j++) {
        const comment = {
          request_id: lastID,
          user_id: faker.helpers.arrayElement([...users, { user_id: 1 }]).user_id,
          comment: faker.lorem.sentence(),
          created_at: faker.date.between({
            from: request.created_at,
            to: new Date().toISOString()
          })
        };

        await this.db.run(`
          INSERT INTO maintenance_comments (
            request_id, user_id, comment, created_at
          ) VALUES (?, ?, ?, ?)
        `, Object.values(comment));
      }
    }
  }
}

module.exports = MaintenanceRequestSeeder;
