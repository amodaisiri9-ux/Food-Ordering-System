const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }
  
  res.status(200).json({
    message: 'Image uploaded successfully',
    filePath: `/${req.file.path.replace(/\\/g, '/')}`,
  });
};

module.exports = {
  uploadImage,
};
