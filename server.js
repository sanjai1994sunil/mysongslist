const express = require("express");
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var connection = require('./database');

const app = express();
app.use(cors());
app.use(express.json())

// app.get('/', function (req, res) {
//   let sql = "Select * from user";
//   connection.query(sql, function (err, results) {
//     if (err) throw err;
//     res.send(results)
//   })

// })


//User Registration//
app.post("/users/signup/", async (request, response) => {
  const { full_name, email, phone_number, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;

  connection.query(selectUserQuery, function (error, result) {
    if (error) throw error;

    if (result[0]) return response.json({ status: "error", error: "User has already been Registered" })

    else {
      const createUserQuery = `
              INSERT INTO 
                user (full_name, email,phone_number,username, password, gender, location) 
              VALUES 
                (
                  '${full_name}', 
                  '${email}',
                  '${phone_number}', 
                  '${username}', 
                  '${hashedPassword}', 
                  '${gender}',
                  '${location}'
                )`;

      connection.query(createUserQuery, function (error, results) {
        if (error) throw error;
        return response.json({ status: "success", success: "User has been Registered" })

      });

    }


  })






});


//User Login//
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log("Login Requested from")
  console.log(`Username: ${username}`)
  console.log(`password:${password}`);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;

  connection.query(selectUserQuery, async function (error, result) {
    if (error) throw error;
    if (!result[0] || !await bcrypt.compare(password, result[0].password) ) return response.json({ status: "error", message: "Incorrect Username or Password!" })

  else {
      const payload = {
        username: username,
      };

      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    }

})
});



//Authentication//
const authenticateToken = (request, response, next) => {
  console.log("Authentication Started")
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username=payload.username;
        next();
      }
    });
  }
};


//Get all songs// and search song///
app.get("/songs/", async (request, response) => {
  console.log("songs requested")
  const {
    offset = 0,
    limit = 50,
    order = "ASC",
    order_by ="song_id",
    search_q = "",
  } = request.query;

  const getSongsQuery = `
          SELECT
            *
          FROM
            songs
          WHERE
          song_name LIKE '%${search_q}%'
          ORDER BY ${order_by} ${order}
          LIMIT ${limit} OFFSET ${offset};`;

        // const songsArray = await db.all(getSongsQuery);

        // response.send(songsArray);

        connection.query(getSongsQuery, function (err, results) {
          if (err) throw err;
          response.send(results)
        })
  });


//Add songs//
app.post("/songs/add/",authenticateToken, async (request, response) => {
  console.log("Add Song")
  const songDetails = request.body;
  const {
    song_name,
    theme,
    scale,
    rhythm,
    tempo
  } = songDetails;

  const addSongQuery = `
    INSERT INTO
      songs (song_name,theme,scale,rhythm,tempo)
    VALUES
      (
        '${song_name}',
         '${theme}',
         '${scale}',
         '${rhythm}',
         ${tempo}
        
      );`;

  // const getSongsQuery = `
  //   SELECT
  //     *
  //   FROM
  //     songs;`;
        

  //  await db.run(addSongQuery);
  //  console.log("Song Added")

   connection.query(addSongQuery, function (error, results) {
    if (error) throw error;
    return response.json({ status: "success", success: "Song Added" })

  });

  //const songId = dbResponse.lastID;//
  //response.send({ songId: songId });//
  // const songsArray = await db.all(getSongsQuery);
  // response.send(songsArray);
  
  // connection.query(getSongsQuery, function (error, results) {
  //   if (error) throw error;
  //   response.send(results)
  // })
});


 //Get song by Id//
 app.get("/songs/:songId/", authenticateToken, async(request,response)=>{
  const {songId}=request.params;
  console.log("song requested for edit")
  console.log({songId})
  const getSongQuery = `
          SELECT
            *
          FROM
            songs
          WHERE
          song_id=${songId};`;
          // const songsArray = await db.get(getSongQuery);
          // console.log(songsArray)
          // response.send(songsArray);

          connection.query(getSongQuery, function (err, results) {
            if (err) throw err;
            response.send(results[0])
          })

})


//Edit Song//
app.put("/songs/edit/:songId/", authenticateToken, async (request, response) => {
  const { songId } = request.params;
  const songDetails = request.body;
  const {
    song_name,
    theme,
    scale,
    rhythm,
    tempo
  } = songDetails;

  const updateSongQuery = `
    UPDATE songs 
    SET
        song_name='${song_name}',
         theme='${theme}',
         scale='${scale}',
         rhythm='${rhythm}',
         tempo=${tempo}
    WHERE 
    song_id=${songId};`;

    // await db.run(updateSongQuery)
    // response.send("Song Updated Successfully");
    

    connection.query(updateSongQuery, function (error, results) {
      if (error) throw error;
      return response.json({ status: "success", success: "Song Updated Successfully" })

      
  
    });
    console.log("Song Updated Success");

  });


//Delete Song//
app.delete("/songs/:songId",authenticateToken,async(request, response)=>{
  const{songId}=request.params
  const deleteSongQuery=`
  DELETE FROM songs
  WHERE song_id=${songId};`;

  // await db.run(deleteSongQuery);
  // response.send("Song Deleted Successfully")

  connection.query(deleteSongQuery, function (error, results) {
    if (error) throw error;
    return response.json({ status: "success", success: "Song Deleted Successfully" })

    

  });
  console.log("Song Deleted Successfully");

});


//Get Profile//
app.get("/profile/", authenticateToken, async (request, response) => {
  let { username } = request;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  // const userDetails = await db.get(selectUserQuery);
  // console.log(userDetails)
  // response.send(userDetails);

  connection.query(selectUserQuery, function (error, results) {
    if (error) throw err;
    response.send(results[0])
  })
  


});


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Server Running at http://localhost:"+ PORT);
  connection.connect(function (err) {
    if (err) throw err;
    console.log('Database Connected!');
  })
});