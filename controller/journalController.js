import Journal from "../model/journalModel.js";

export const createJournal = async (req, res) => {
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

    const newJournal = new Journal({
      title,
      publishedDate,
      link,
    });

    await newJournal.save();
    res.json(newJournal);
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listOfJournal = async (req, res) => {
  try {
    const journals = await Journal.find(); // Retrieve all journal entries
    res.json(journals);
  } catch (error) {
    console.error("Error fetching journals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const readJournal = async (req, res) => {
  try {
    const { journalId } = req.params; // Get the journal ID from the request params
    const journal = await Journal.findById(journalId); // Find the journal by ID

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" }); // Return error if the journal doesn't exist
    }
    res.json(journal); // Send the journal data as a response
  } catch (error) {
    console.error("Error fetching journal:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

export const removeJournal = async (req, res) => {
  try {
    const { journalId } = req.params; // Get the journal ID from the request parameters

    // Find and delete the journal by ID
    const deletedJournal = await Journal.findByIdAndDelete(journalId);

    if (!deletedJournal) {
      return res.status(404).json({ error: "Journal not found" }); // Return error if the journal doesn't exist
    }

    res.json({ message: "Journal deleted successfully" }); // Send success message
  } catch (error) {
    console.error("Error deleting journal:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

export const updateJournal = async (req, res) => {
  try {
    const { journalId } = req.params; // Get the journal ID from the request parameters
    const { title, publishedDate, link } = req.body; // Get the updated data from the request body

    // Find the journal by ID and update it with the new data
    const updatedJournal = await Journal.findByIdAndUpdate(
      journalId,
      {
        title,
        publishedDate: new Date(publishedDate), // Convert the publishedDate string to a Date object
        link,
      },
      { new: true, runValidators: true } // Return the updated journal and run validation
    );

    if (!updatedJournal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    res.json(updatedJournal); // Send back the updated journal data
  } catch (err) {
    console.error("Error updating journal:", err);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};
