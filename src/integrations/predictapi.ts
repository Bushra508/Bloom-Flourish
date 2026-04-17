const API_URL = import.meta.env.VITE_API_URL;
console.log("API_URL:", import.meta.env.VITE_API_URL);
export const predictImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/predict`, {
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