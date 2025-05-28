import React, { useEffect, useState } from "react";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const REGION = "us-east-005";
const BUCKET_NAME = "your-bucket-name";
const ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

const s3Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_B2_KEY_ID,
    secretAccessKey: import.meta.env.VITE_B2_SECRET,
  },
  forcePathStyle: true,
});

export default function App() {
  const [objects, setObjects] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchObjects = async (continuationToken = null) => {
    setLoading(true);
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 10,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      setObjects(response.Contents || []);
      setToken(response.NextContinuationToken || null);
    } catch (error) {
      console.error("Error fetching objects:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📦 Backblaze B2 File Browser</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {objects.map((obj) => (
            <li key={obj.Key}>
              <strong>{obj.Key}</strong> — {obj.Size} bytes
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => fetchObjects(token)} disabled={!token || loading}>
        {loading ? "Loading..." : token ? "Next Page ➡️" : "No More Files"}
      </button>
    </div>
  );
}