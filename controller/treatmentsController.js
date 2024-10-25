import Treatments from "../model/treatmentsModel.js";

export const createTreatment = async (req, res) => {
  try {
    const { title, subTitle } = req.body;

    switch (true) {
      case !title.trim():
        return res.json({ error: "Title is required" });
      case !subTitle.trim():
        return res.json({ error: "Sub Title is required" });
    }

    const newTreatment = new Treatments({
      title,
      subTitle,
    });

    await newTreatment.save();
    res.json(newTreatment);
  } catch (error) {
    console.error("Error creating treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listOfTreatments = async (req, res) => {
  try {
    const treatments = await Treatments.find(); // Retrieve all journal entries
    res.json(treatments);
  } catch (error) {
    console.error("Error fetching treatments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const readTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const treatments = await Treatments.findById(treatmentId);

    if (!treatments) {
      return res.status(404).json({ error: "Treatments not found" });
    }

    res.json(treatments);
  } catch (error) {
    console.error("Error fetching treatments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const updateTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { title, subTitle } = req.body;

    // Check if all fields are provided and not empty
    if (!title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!subTitle.trim()) {
      return res.status(400).json({ error: "Sub Title is required" });
    }

    // Find the treatment by ID and update the fields
    const updatedTreatment = await Treatments.findByIdAndUpdate(
      treatmentId,
      { title, subTitle },
      { new: true } // Return the updated document
    );

    if (!updatedTreatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    res.json(updatedTreatment);
  } catch (error) {
    console.error("Error updating treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;

    // Find and delete the treatment by its ID
    const deletedTreatment = await Treatments.findByIdAndDelete(treatmentId);

    // Check if the treatment was not found
    if (!deletedTreatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    // Return success response
    res.json({ message: "Treatment deleted successfully" });
  } catch (error) {
    console.error("Error deleting treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};