/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del()

  return knex('users').insert([
    {
      firstname: 'John',
      lastname : 'doe',
      username: 'john_doe',
      password: '123',
      email: 'john.doe@example.com',
      profile_pic: 'https://example.com/profiles/john.jpg',
      thumbnail: 'https://example.com/thumbnails/john.jpg',
      status: 1, // Active
    },
    {
      firstname: 'Jane',
      lastname : 'doe',
      username: 'jane_doe',
      password: '123',
      email: 'jane.doe@example.com',
      profile_pic: 'https://example.com/profiles/jane.jpg',
      thumbnail: 'https://example.com/thumbnails/jane.jpg',
      status: 1, // Active
    },
  ]);

};
