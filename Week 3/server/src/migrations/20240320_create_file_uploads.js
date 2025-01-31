exports.up = function(knex) {
    return knex.schema.createTable('file_uploads', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.string('file_name').notNullable();
      table.string('file_key').notNullable();
      table.string('error_file_key');
      table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
      table.integer('processed_count').defaultTo(0);
      table.integer('error_count').defaultTo(0);
      table.text('error_message');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      
      table.foreign('user_id').references('users.id');
      table.index(['status', 'created_at']);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('file_uploads');
  }; 