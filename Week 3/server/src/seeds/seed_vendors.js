/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('vendors').del();
  
  // Inserts seed entries
  await knex('vendors').insert([
    {
      vendor_name: 'Zepto',
      contact_name: 'Aadit Palicha',
      address: '1st Floor, Mantri Avenue, Vittal Mallya Road',
      city: 'Bangalore',
      postal_code: '560001',
      country: 'India',
      phone: '+91-9876543210',
      status: 1
    },
    {
      vendor_name: 'Blinkit',
      contact_name: 'Albinder Dhindsa',
      address: 'Plot No. 82A, Sector 18',
      city: 'Gurugram',
      postal_code: '122015',
      country: 'India',
      phone: '+91-9876543211',
      status: 1
    },
    {
      vendor_name: 'Fresh Meat',
      contact_name: 'Pratik Gupta',
      address: '2nd Floor, Trade Centre, Bandra Kurla Complex',
      city: 'Mumbai',
      postal_code: '400051',
      country: 'India',
      phone: '+91-9876543212',
      status: 1
    },
    {
      vendor_name: 'Swiggy',
      contact_name: 'Sriharsha Majety',
      address: '3rd Floor, Salarpuria Softzone, Outer Ring Road',
      city: 'Bangalore',
      postal_code: '560103',
      country: 'India',
      phone: '+91-9876543213',
      status: 1
    }
  ]);
};