const Treatments = require("../model/treatmentsModel");

// Create a new treatment
const createTreatment = async (req, res) => {
  try {
    const { title, subTitle } = req.body;

    if (!title?.trim()) return res.json({ error: "Title is required" });
    if (!subTitle?.trim()) return res.json({ error: "Sub Title is required" });

    const newTreatment = new Treatments({ title, subTitle });
    await newTreatment.save();
    res.json(newTreatment);
  } catch (error) {
    console.error("Error creating treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List all treatments
const listOfTreatments = async (req, res) => {
  try {
    const treatments = await Treatments.find();
    res.json(treatments);
  } catch (error) {
    console.error("Error fetching treatments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Read a single treatment by ID
const readTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const treatment = await Treatments.findById(treatmentId);

    if (!treatment)
      return res.status(404).json({ error: "Treatment not found" });

    res.json(treatment);
  } catch (error) {
    console.error("Error fetching treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a treatment by ID
const updateTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { title, subTitle } = req.body;

    if (!title?.trim())
      return res.status(400).json({ error: "Title is required" });
    if (!subTitle?.trim())
      return res.status(400).json({ error: "Sub Title is required" });

    const updatedTreatment = await Treatments.findByIdAndUpdate(
      treatmentId,
      { title, subTitle },
      { new: true }
    );

    if (!updatedTreatment)
      return res.status(404).json({ error: "Treatment not found" });

    res.json(updatedTreatment);
  } catch (error) {
    console.error("Error updating treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a treatment by ID
const deleteTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const deletedTreatment = await Treatments.findByIdAndDelete(treatmentId);

    if (!deletedTreatment)
      return res.status(404).json({ error: "Treatment not found" });

    res.json({ message: "Treatment deleted successfully" });
  } catch (error) {
    console.error("Error deleting treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createTreatment,
  listOfTreatments,
  readTreatment,
  updateTreatment,
  deleteTreatment,
};
