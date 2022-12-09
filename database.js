var mysql= require("mysql");

var connection = mysql.createConnection({
    host:'127.0.0.1',
    database: 'songslist',
    user: 'root',
    password:'root'



});

module.exports=connection;