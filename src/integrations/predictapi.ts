export const predictImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("Prediction API error:", err);
    return null;
  }
};