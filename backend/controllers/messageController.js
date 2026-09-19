const Message = require('../models/Message');

// @desc    Add a contact message
// @route   POST /api/messages
// @access  Public
exports.addMessage = async (req, res, next) => {
  try {
    const { name, email, subject, body } = req.body;

    if (!name || !email || !subject || !body) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const message = await Message.create({ name, email, subject, body });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all contact messages
// @route   GET /api/messages
// @access  Private (Admin)
exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
};
