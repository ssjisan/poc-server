import Links from "../model/linkModel.js";

export const createLink = async (req, res) => {
  try {
    const { title, publishedDate, link } = req.body;

    switch (true) {
      case !title.trim():
        return res.json({ error: "Title is required" });
      case !publishedDate.trim():
        return res.json({ error: "Published Date is required" });
      case !link.trim():
        return res.json({ error: "Link is required" });
    }

    const newLink = new Links({
      title,
      publishedDate,
      link,
    });

    await newLink.save();
    res.json(newLink);
  } catch (error) {
    console.error("Error creating link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//  List of Links
export const listOfLinks = async (req, res) => {
  try {
    const links = await Links.find(); // Retrieve all link entries
    res.json(links);
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//  Read Link
export const readLink = async (req, res) => {
  try {
    const { linkId } = req.params; // Get the link ID from the request params
    const link = await Links.findById(linkId); // Find the link by ID

    if (!link) {
      return res.status(404).json({ error: "Link not found" }); // Return error if the link doesn't exist
    }

    res.json(link); // Send the link data as a response
  } catch (error) {
    console.error("Error fetching link:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

//  Remove Link
export const removeLink = async (req, res) => {
  try {
    const { linkId } = req.params; // Get the link ID from the request parameters

    // Find and delete the link by ID
    const deletedLink = await Links.findByIdAndDelete(linkId);

    if (!deletedLink) {
      return res.status(404).json({ error: "Link not found" }); // Return error if the link doesn't exist
    }

    res.json({ message: "Link deleted successfully" }); // Send success message
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

//  Update Link
export const updateLink = async (req, res) => {
  try {
    const { linkId } = req.params; // Get the link ID from the request parameters
    const { title, publishedDate, link } = req.body; // Get the updated data from the request body

    // Find the link by ID and update it with the new data
    const updatedLink = await Links.findByIdAndUpdate(
      linkId,
      {
        title,
        publishedDate: new Date(publishedDate), // Convert the publishedDate string to a Date object
        link,
      },
      { new: true, runValidators: true } // Return the updated link and run validation
    );

    if (!updatedLink) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json(updatedLink); // Send back the updated link data
  } catch (err) {
    console.error("Error updating link:", err);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

//  Update Sequence of Link
export const updateLinksSequence = async (req, res) => {
  try {
    const { reorderedLinks } = req.body;

    // Clear the current collection
    await Links.deleteMany({});

    // Insert the reordered links
    await Links.insertMany(reorderedLinks);

    res.status(200).json({ message: "Links sequence updated successfully" });
  } catch (err) {
    console.error("Error updating links sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};