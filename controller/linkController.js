const Links = require("../model/linkModel");

// Create a new link
const createLink = async (req, res) => {
  try {
    const { title, publishedDate, link } = req.body;

    switch (true) {
      case !title || !title.trim():
        return res.json({ error: "Title is required" });
      case !publishedDate || !publishedDate.trim():
        return res.json({ error: "Published Date is required" });
      case !link || !link.trim():
        return res.json({ error: "Link is required" });
    }

    const newLink = new Links({ title, publishedDate, link });
    await newLink.save();
    res.json(newLink);
  } catch (err) {
    console.error("Error creating link:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List all links
const listOfLinks = async (req, res) => {
  try {
    const links = await Links.find();
    res.json(links);
  } catch (err) {
    console.error("Error fetching links:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Read a single link
const readLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await Links.findById(linkId);
    if (!link) return res.status(404).json({ error: "Link not found" });
    res.json(link);
  } catch (err) {
    console.error("Error fetching link:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a link
const removeLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const deletedLink = await Links.findByIdAndDelete(linkId);
    if (!deletedLink) return res.status(404).json({ error: "Link not found" });
    res.json({ message: "Link deleted successfully" });
  } catch (err) {
    console.error("Error deleting link:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a link
const updateLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { title, publishedDate, link } = req.body;

    const updatedLink = await Links.findByIdAndUpdate(
      linkId,
      {
        title,
        publishedDate: new Date(publishedDate),
        link,
      },
      { new: true, runValidators: true }
    );

    if (!updatedLink) return res.status(404).json({ error: "Link not found" });
    res.json(updatedLink);
  } catch (err) {
    console.error("Error updating link:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update sequence of links
const updateLinksSequence = async (req, res) => {
  try {
    const { reorderedLinks } = req.body;

    await Links.deleteMany({});
    await Links.insertMany(reorderedLinks);

    res.status(200).json({ message: "Links sequence updated successfully" });
  } catch (err) {
    console.error("Error updating links sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createLink,
  listOfLinks,
  readLink,
  removeLink,
  updateLink,
  updateLinksSequence,
};
