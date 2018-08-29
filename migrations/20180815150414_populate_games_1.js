
exports.up = function(knex, Promise) {
  return knex('games').insert([
      {name: "Tic Tac Toe", min_players: 2, max_players: 2},
      {name: "Connect Four", min_players: 2, max_players: 2}
  ])
};

exports.down = function(knex, Promise) {
  return knex('games')
  .delete('games').where({name: "Tic Tac Toe"})
  .delete('games').where({name: "Connect Four"});
};
