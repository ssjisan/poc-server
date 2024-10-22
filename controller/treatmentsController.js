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
  