import React, { useEffect, useState } from "react";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const REGION = "eu-central-003";
const BUCKET_NAME = "dev-samaro";
const ENDPOINT = "https://s3.eu-central-003.backblazeb2.com";

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
  const [folders, setFolders] = useState([]);
  const [prefix, setPrefix] = useState(null); // null = not entered bucket view yet
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchObjects = async (continuationToken = null, currentPrefix = "") => {
    setLoading(true);
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: currentPrefix,
        Delimiter: "/",
        MaxKeys: 10,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      setObjects(response.Contents || []);
      setFolders(response.CommonPrefixes?.map(p => p.Prefix) || []);
      setToken(response.NextContinuationToken || null);
    } catch (error) {
      console.error("Error fetching objects:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (prefix !== null) {
      fetchObjects(null, prefix);
    }
  }, [prefix]);

  const handleEnterBucket = () => {
    setPrefix("");
  };

  const handleFolderClick = (folderPrefix) => {
    setPrefix(folderPrefix);
    setToken(null);
  };

  const handleBack = () => {
    if (prefix === "") {
      setPrefix(null); // Go back to bucket selection
      return;
    }
    const parts = prefix.split("/").filter(Boolean);
    parts.pop();
    setPrefix(parts.length ? parts.join("/") + "/" : "");
    setToken(null);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📁 Backblaze B2 Buckets</h1>

      {prefix === null ? (
        <div>
          <button onClick={handleEnterBucket} className="text-blue-600 underline text-lg">
            📦 {BUCKET_NAME}
          </button>
        </div>
      ) : (
        <>
          <button onClick={handleBack} className="mb-4 text-blue-600 underline">
            ⬅️ Go Back
          </button>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {folders.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {folders.map((folder) => (
                    <li key={folder} className="p-2 border rounded cursor-pointer bg-gray-100 hover:bg-gray-200" onClick={() => handleFolderClick(folder)}>
                      📂 <strong>{folder.replace(prefix, "")}</strong>
                    </li>
                  ))}
                </ul>
              )}

              <ul className="space-y-2">
                {objects.map((obj) => (
                  <li key={obj.Key} className="p-2 border rounded shadow">
                    <strong>{obj.Key.replace(prefix, "")}</strong> — {obj.Size} bytes
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-4">
            <button onClick={() => fetchObjects(token, prefix)} disabled={!token || loading} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">
              {loading ? "Loading..." : token ? "Next Page ➡️" : "No More Files"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
