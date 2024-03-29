require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userMiddleware = require('./zusermiddleware/usermiddle');
const { user, books } = require('./zdb/db');

const app = express();
const PORT = 3000;

app.use(express.json());

const verifyToken = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token not provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

app.post('/postbooks', userMiddleware, async (req, res) => {
  const { Bookname, author, price_1_5, username } = req.body;

  try {
    let existingBook = await books.findOne({ Bookname });

    if (existingBook) {
      existingBook.availablestock = (existingBook.availablestock || 0) + 1;
      await existingBook.save();
    } else {
      const newBook = new books({
        Bookname,
        author,
        price_1_5,
      });

      await newBook.save();
    }

    const postingUser = await user.findOne({ username });

    if (!postingUser) {
      console.error('User not found.');
      return res.status(404).json({ error: 'User not found.' });
    }

    const bookObject = await books.findOne({ Bookname });

    if (!bookObject) {
      console.error('Book not found.');
      return res.status(404).json({ error: 'Book not found.' });
    }

    bookObject.postedbooks.push(postingUser._id);

    await bookObject.save();

    console.log('Book added successfully!');
    res.status(200).json({ message: 'Book added successfully!' });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/signup', async (req, res) => {
  const { username, password, rollnumber } = req.body;

  try {
    const existingUser = await user.findOne({ username });

    if (existingUser) {
      return res.json({ mssg: 'Username exists. Try another one.' });
    }

    const newUser = new user({
      username,
      password,
      rollnumber,
    });

    await newUser.save();
    res.json({ mssg: 'User registration completed.' });
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await user.findOne({ username, password });

    if (existingUser) {
      const token = jwt.sign({ username }, process.env.SECRET_KEY);
      res.redirect(`/post-rent?token=${token}`);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/searchingbooks', async (req, res) => {
  const Bookname = req.body.bookname;

  try {
    const reqdbook = await books.findOne({ Bookname });

    if (!reqdbook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(reqdbook);
  } catch (error) {
    console.error('Error searching book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/rent', userMiddleware, async (req, res) => {
  const { Bookname, deliveryAddress, username } = req.body;

  try {
    const reqdbook = await books.findOne({ Bookname });

    if (!reqdbook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    reqdbook.availablestock--;

    if (reqdbook.availablestock <0) {
      res.json({ mssg: 'Book is out of stock' });
    } else {
      const rentingUser = await user.findOne({ username });

      if (!rentingUser) {
        console.error('User not found.');
        return res.status(404).json({ error: 'User not found.' });
      }

      if (!reqdbook) {
        console.error('Book not found.');
        return res.status(404).json({ error: 'Book not found.' });
      }

      reqdbook.rentedbooks.push(rentingUser._id);

      await reqdbook.save();

      console.log('Book rented successfully!');
      res.status(200).json({ message: 'Book rented successfully!' });
    }
  } catch (error) {
    console.error('Error renting book:', error);
    res.status(500).json({ error: 'Internal server error or cannot find book' });
  }
});

//these route are in prototyype stage
/* app.get('/confirmRent', (req, res) => {
  const bookname = req.query.bookname;
  const deliveryAddress = req.query.deliveryAddress;
  console.log(bookname);
  res.send(`
  <form action="/confirmRent" method="post">
    <p>Book: ${req.query.bookname}</p>
    <p>Delivery Address: ${req.query.deliveryAddress}</p>
    <button type="submit" name="decision" value="yes">Yes</button>
    <button type="submit" name="decision" value="no">No</button>
  </form>
`);
}); 

app.post('/confirmRent', (req, res) => {
  const decision = req.body.decision; 
  const bookname = req.body.bookname;
  

  if (decision === 'yes') {
    const rentedBook = All_users.find((b) => b.title === bookname);

    if (!rentedBook) {
      console.log(`Book "${bookname}" not found in All_users array.`);
      return res.status(404).json({ error: 'Book not found' });
    }

    if (!rentedBook.available) {
      console.log(`Book "${bookname}" is already rented.`);
      return res.status(404).json({ error: 'Book already rented' });
    }
    rentedBook.available = false;
    return res.send('Rent request accepted. Book rented!');
  } else if (decision === 'no') {
    return res.send('Rent request declined by book owner.');
  } else {
    return res.status(400).json({ error: 'Invalid decision' });
  }
}); */


//this route require working, it is in prototype phase.
app.get('/seeingbookslibrary', verifyToken, async (req, res) => {
  try {
    const booksList = await books.find();
    res.json(booksList);
  } catch (error) {
    console.error('Error fetching books for rent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
//currently working on -->>
//1.user request based renting domain.
//2.confirm-rent portal.
//3.payment getway.
