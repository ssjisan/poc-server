const Form = require("../model/formModal");

// Upload a new form
const uploadForm = async (req, res) => {
  try {
    const { title, link } = req.body;

    switch (true) {
      case !title || !title.trim():
        return res.json({ error: "Title is required" });
      case !link || !link.trim():
        return res.json({ error: "Link is required" });
    }

    const newForm = new Form({ title, link });
    await newForm.save();

    res.json(newForm);
  } catch (err) {
    console.error("Error creating form:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List all forms
const listOfForm = async (req, res) => {
  try {
    const forms = await Form.find();
    res.json(forms);
  } catch (err) {
    console.error("Error fetching forms:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Read a single form by ID
const readForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ error: "Form not found" });
    res.json(form);
  } catch (err) {
    console.error("Error fetching form:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a form by ID
const removeForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const deletedForm = await Form.findByIdAndDelete(formId);
    if (!deletedForm) return res.status(404).json({ error: "Form not found" });
    res.json({ message: "Form deleted successfully" });
  } catch (err) {
    console.error("Error deleting form:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a form by ID
const updateForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { title, link } = req.body;

    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      { title, link },
      { new: true, runValidators: true }
    );

    if (!updatedForm) return res.status(404).json({ error: "Form not found" });

    res.json(updatedForm);
  } catch (err) {
    console.error("Error updating form:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update forms sequence
const updateFormsSequence = async (req, res) => {
  try {
    const { reorderedForms } = req.body;

    await Form.deleteMany({});
    await Form.insertMany(reorderedForms);

    res.status(200).json({ message: "Forms sequence updated successfully" });
  } catch (err) {
    console.error("Error updating forms sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  uploadForm,
  listOfForm,
  readForm,
  removeForm,
  updateForm,
  updateFormsSequence,
};
