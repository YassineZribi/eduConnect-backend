const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const ChilhoodInstitution = require('./models/ChildhoodInstitution');

// new ChilhoodInstitution({
//   location: "fqsfqsfqs"
// }).save()


// That line allows us to get the data sended in req.body
app.use(express.json({ extended: false }));

// access routes in other files 
// we want requests url which starts with '/****/***' to pertain to that file routes
app.use('/categories', require('./routes/routes2/categories'));
app.use('/childhoodinstitutions', require('./routes/routes2/childhoodInstitutions'));
app.use('/users', require('./routes/routes2/users'));
app.use('/auth', require('./routes/routes2/auth'));
app.use('/profiles', require('./routes/profiles'));
app.use('/posts', require('./routes/posts'));


app.get('/', (req, res) => {
  console.log('get request success');
  res.send('API Running');
});






// Connect Server to database + Make Server listenning 
(async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    console.log('mongoDB database connected to the Server...');
    const PORT = process.env.PORT || 8888;
    app.listen(PORT, err => {
      if (err) {
        console.log('Listening error: ', err);
      } else {
        console.log(`Server is running on port ${PORT}`);
      }
    });
  } catch (err) {
    console.error('error message::: ', err.message);
    // Exit process with failure
    process.exit(1);
  }
})();
