import Form from "../model/formModal.js";

export const uploadForm = async (req, res) => {
  try {
    
    const { title, link } = req.body;

    switch (true) {
      case !title.trim():
        return res.json({ error: "Title is required" });
      case !link.trim():
        return res.json({ error: "Link is required" });
    }

    const newForm = new Form({
      title,
      link,
    });

    await newForm.save();
    res.json(newForm);
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listOfForm = async (req, res) => {
  try {
    const forms = await Form.find(); // Retrieve all journal entries
    res.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const readForm = async (req, res) => {
  try {
    const { formId } = req.params; // Get the journal ID from the request params
    const form = await Form.findById(formId); // Find the journal by ID

    if (!form) {
      return res.status(404).json({ error: "Form not found" }); // Return error if the journal doesn't exist
    }

    res.json(form); // Send the journal data as a response
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

export const removeForm = async (req, res) => {
  try {
    const { formId } = req.params; // Get the journal ID from the request parameters

    // Find and delete the journal by ID
    const deletedForm = await Form.findByIdAndDelete(formId);

    if (!deletedForm) {
      return res.status(404).json({ error: "Form not found" }); // Return error if the journal doesn't exist
    }

    res.json({ message: "Form deleted successfully" }); // Send success message
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle server errors
  }
};

export const updateForm = async (req, res) => {
  try {
    const { formId } = req.params; 
    const { title, link } = req.body;

    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      {
        title,
        link,
      },
      { new: true, runValidators: true } // Return the updated journal and run validation
    );

    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(updatedForm); // Send back the updated journal data
  } catch (err) {
    console.error("Error updating form:", err);
    res.status(500).json({ error: 'Internal server error' }); // Handle server errors
  }
};
