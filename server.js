const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the Express application
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://abishekpranav2004:44-abcdef@cluster0.dfj1g.mongodb.net/Mentor?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB database "Mentor"');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Log any MongoDB errors after initial connection
mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

// Define a schema and model for the "events" collection
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true }
});
const Event = mongoose.model('Event', eventSchema);

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).send('No code provided');
    return;
  }
  
  res.redirect('/calendar'); // Redirect to your calendar page
});

app.post('/api/create-event', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const { title, start, end } = req.body;

  if (!title || !start || !end) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const event = {
      summary: title,
      start: {
        dateTime: start,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: end,
        timeZone: 'America/Los_Angeles',
      },
      conferenceData: {
        createRequest: {
          requestId: 'sample123',
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Error creating event');
  }
});


// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Express app with MongoDB for Calendar Events!');
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    const transformedEvents = events.map(event => ({
      id: event._id, // transform _id to id for the frontend
      title: event.title,
      start: event.start,
      end: event.end
    }));
    console.log(transformedEvents)
    res.json(transformedEvents); // Send transformed events
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' });
  }
});


// Add a new event
app.post('/api/events', async (req, res) => {
  const { title, start, end } = req.body;
  console.log('Creating new event:', { title, start, end });

  if (!title || !start || !end) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const newEvent = new Event({ title, start, end });
    await newEvent.save();
    console.log('New event created:', newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Error creating event' });
  }
});

// DELETE an event
app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const deletedEvent = await Event.findByIdAndDelete(id);
      if (!deletedEvent) {
          return res.status(404).json({ error: 'Event not found' });
      }
      res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Failed to delete event' });
  }
});

// UPDATE an event
app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { title, start, end } = req.body;
  try {
      const updatedEvent = await Event.findByIdAndUpdate(id, { title, start, end }, { new: true });
      if (!updatedEvent) {
          return res.status(404).json({ error: 'Event not found' });
      }
      res.status(200).json(updatedEvent);
  } catch (error) {
      res.status(500).json({ error: 'Failed to update event' });
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
