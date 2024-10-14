const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');


// Create the app
const app = express();
app.use(bodyParser.json()); // to parse JSON request bodies


mongoose.connect('mongodb+srv://tomyomo:wgyb29CSsWVM0LWl@glotech.w8vgy.mongodb.net/?retryWrites=true&w=majority&appName=GloTech', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  chapters: {},
  image: { type: String },
  audio: { type: String },
//   chapters: {
//     chapter1: { type: String },
//     chapter2: { type: String },
//     chapter3: { type: String },
//     // Add more chapters as needed
//   },
});

// Pre-save middleware to hash passwords before storing them
userSchema.pre('save', async function (next) {
  try {
    // Only hash the password if it has been modified (i.e., during password updates or creation)
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Create User model
const User = mongoose.model('User', userSchema);

// Routes

// Register a new user
app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      // chapters, // Optional
      // image, // Optional
      // audio, // Optional
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch user data
app.get('/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chapters
app.put('/user/:username/chapters', async (req, res) => {
  const { chapters } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { chapters },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change Password Route
app.put('/user/:username/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current password is correct
    console.log("Current password in DB:", user.password); // Log the hashed password from DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("Is password match:", isMatch); // Log the result of the comparison

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Validate new password (simple validation)
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Update the password
    user.password = newPassword;
    await user.save(); // The password will be hashed in the pre('save') hook

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change Image Route
app.put('/user/:username/image', async (req, res) => {
  const { image } = req.body;

  try {
    // Find the user by username
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { image },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Image updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// // Change Audio Route
// app.put('/user/:username/audio', async (req, res) => {
//   const { audio } = req.body;

//   try {
//     // Find the user by usernameåå
//     const user = await User.findOneAndUpdate(
//       { username: req.params.username },
//       { audio },
//       { new: true }
//     );
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({ message: 'Audio updated successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// routes/user.js


// Add a new audio link for a user
app.post('/addAudioLink', async (req, res) => {
  const { username, newAudioLink } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add the new audio link to the audioLinks array
    user.audioLinks.push(newAudioLink);
    await user.save();

    res.json({ message: 'Audio link added successfully', audioLinks: user.audioLinks });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing audio link
app.put('/updateAudioLink', async (req, res) => {
  const { username, index, updatedAudioLink } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (index < 0 || index >= user.audioLinks.length) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    // Update the audio link at the given index
    user.audioLinks[index] = updatedAudioLink;
    await user.save();

    res.json({ message: 'Audio link updated successfully', audioLinks: user.audioLinks });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Delete an audio link
app.delete('/deleteAudioLink', async (req, res) => {
  const { username, index } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (index < 0 || index >= user.audioLinks.length) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    // Remove the audio link at the given index
    user.audioLinks.splice(index, 1); // Remove the link from the array
    await user.save();

    res.json({ message: 'Audio link deleted successfully', audioLinks: user.audioLinks });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
