/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // First, delete all existing entries
  await knex('categories').del();
  
  // Then insert seed entries
  await knex('categories').insert([
    {
      category_name: 'Product Designer',
      description: 'Professionals who design digital products and user experiences',
      status: 1
    },
    {
      category_name: 'Product Manager',
      description: 'Professionals who oversee product development and strategy',
      status: 1
    },
    {
      category_name: 'Frontend Developer',
      description: 'Developers specializing in client-side web development',
      status: 1
    },
    {
      category_name: 'Backend Developer',
      description: 'Developers specializing in server-side development',
      status: 1
    },
    {
      category_name: 'Full Stack Developer',
      description: 'Developers proficient in both frontend and backend development',
      status: 1
    },
    {
      category_name: 'UX Designer',
      description: 'Professionals focused on user experience design',
      status: 1
    },
    {
      category_name: 'UX Copywriter',
      description: 'Writers specializing in user experience content',
      status: 1
    },
    {
      category_name: 'UI Designer',
      description: 'Designers focused on user interface design',
      status: 1
    },
    {
      category_name: 'QA Engineer',
      description: 'Engineers specializing in quality assurance and testing',
      status: 1
    }
  ]);
};