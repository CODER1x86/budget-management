/**
 * Property Seeder
 * Generates test properties with realistic data
 */

const { faker } = require('@faker-js/faker');
const Seeder = require('../Seeder');

class PropertySeeder extends Seeder {
  async seed() {
    const propertyTypes = ['apartment', 'house', 'condo', 'townhouse'];
    const amenities = [
      'parking', 'gym', 'pool', 'elevator', 'security',
      'laundry', 'storage', 'balcony', 'pet_friendly'
    ];

    // Generate 100 properties
    for (let i = 0; i < 100; i++) {
      const property = {
        title: faker.lorem.sentence(4),
        description: faker.lorem.paragraphs(2),
        address: JSON.stringify({
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode()
        }),
        price: faker.number.float({ min: 1000, max: 10000, precision: 2 }),
        type: faker.helpers.arrayElement(propertyTypes),
        amenities: JSON.stringify(
          faker.helpers.arrayElements(amenities, { min: 2, max: 5 })
        ),
        status: faker.helpers.arrayElement(['available', 'rented', 'maintenance']),
        created_at: faker.date.past().toISOString(),
        updated_at: new Date().toISOString()
      };

      const columns = Object.keys(property).join(', ');
      const placeholders = Object.keys(property).map(() => '?').join(', ');
      const values = Object.values(property);

      await this.db.run(`
        INSERT INTO properties (${columns})
        VALUES (${placeholders})
      `, values);
    }
  }
}

module.exports = PropertySeeder;
