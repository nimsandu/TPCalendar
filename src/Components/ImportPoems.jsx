import { useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const ImportPoems = () => {
  const [file, setFile] = useState(null);
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser; // Get current user

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    if (!user) {
      alert("No user is logged in.");
      console.error("User is not logged in.");
      return;
    }

    console.log("Logged-in User:", user.uid);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        console.log("Parsed JSON Data:", jsonData);

        if (!Array.isArray(jsonData)) {
          alert("Invalid file format. Expected an array of poems.");
          return;
        }

        const poemsCollection = collection(db, "poems");

        for (const poem of jsonData) {
          console.log("Importing:", poem.title); // Debug log
          await addDoc(poemsCollection, {
            title: poem.title || "Untitled",
            content: poem.content || "",
            createdAt: new Date().toISOString(),
            userId: user.uid, // Always set to current user
          });
        }

        alert("Poems imported successfully!");
      } catch (error) {
        console.error("Error importing poems:", error);
        alert("Failed to import poems. Check the file format.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button onClick={handleImport}>Import Poems</button>
    </div>
  );
};

export default ImportPoems;
