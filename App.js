import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch search history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/history");
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:5000/search", { query });
      setResult(response.data);
      fetchHistory(); // Refresh history after new search
    } catch (err) {
      setError("Failed to fetch search results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Search App</h1>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search for a person..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-box">
          <h2>{result.name}</h2>
          <p>{result.description}</p>
          <img src={result.image} alt={result.name} />
          <h3>Relevant Websites</h3>
          <ul>
            {result.websites.map((site, index) => (
              <li key={index}><a href={site.link} target="_blank" rel="noopener noreferrer">{site.title}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className="history-box">
        <h3>Search History</h3>
        <ul>
          {history.map((item, index) => (
            <li key={index}>{item.query} - {new Date(item.timestamp).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
