import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Copy, Download, Upload, X, Sparkles, Minus } from "lucide-react";
import yaml from "js-yaml";


const MatchBuilder = () => {
  // Helper to download a file
  const downloadFile = (filename, content, type = "text/yaml") => {
    console.log("downloadFile called", { filename, type });
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to export a single match as YAML
  const exportSingleMatch = (match) => {
    const matchYaml = {
      matchName: match.name,
      team1Name: match.team1Name,
      team2Name: match.team2Name,
      team1: match.team1.map((char) => ({
        character: char.name,
        costume: char.costume ? (costumes.find(c => c.id === char.costume)?.name || char.costume) : "",
        capsules: char.capsules.filter(Boolean).map(cid => capsules.find(c => c.id === cid)?.name || cid),
        ai: char.ai ? (aiItems.find(ai => ai.id === char.ai)?.name || char.ai) : ""
      })),
      team2: match.team2.map((char) => ({
        character: char.name,
        costume: char.costume ? (costumes.find(c => c.id === char.costume)?.name || char.costume) : "",
        capsules: char.capsules.filter(Boolean).map(cid => capsules.find(c => c.id === cid)?.name || cid),
        ai: char.ai ? (aiItems.find(ai => ai.id === char.ai)?.name || char.ai) : ""
      }))
    };
    const yamlStr = yaml.dump(matchYaml, { noRefs: true, lineWidth: 120 });
    console.log("exportSingleMatch called", { matchYaml, yamlStr });
    downloadFile(`Match_${match.name.replace(/\s+/g, "_")}.yaml`, yamlStr, "text/yaml");
    setSuccess(`Exported match ${match.name} as YAML.`);
  };

  // Helper to import a single match
  const importSingleMatch = async (event, matchId) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let file of files) {
      const text = await file.text();
      try {
        const matchYaml = yaml.load(text);
        if (!matchYaml || !matchYaml.matchName) throw new Error("Invalid YAML");
        // Convert display names back to IDs for state
        const team1 = (matchYaml.team1 || []).map((char) => {
          const charObj = characters.find(c => c.name === char.character) || { name: char.character, id: "" };
          return {
            name: charObj.name,
            id: charObj.id,
            costume: char.costume ? (costumes.find(c => c.name === char.costume)?.id || "") : "",
            capsules: Array(7).fill("").map((_, i) => char.capsules && char.capsules[i] ? (capsules.find(c => c.name === char.capsules[i])?.id || "") : ""),
            ai: char.ai ? (aiItems.find(ai => ai.name === char.ai)?.id || "") : ""
          };
        }).filter(c => c.id);
        const team2 = (matchYaml.team2 || []).map((char) => {
          const charObj = characters.find(c => c.name === char.character) || { name: char.character, id: "" };
          return {
            name: charObj.name,
            id: charObj.id,
            costume: char.costume ? (costumes.find(c => c.name === char.costume)?.id || "") : "",
            capsules: Array(7).fill("").map((_, i) => char.capsules && char.capsules[i] ? (capsules.find(c => c.name === char.capsules[i])?.id || "") : ""),
            ai: char.ai ? (aiItems.find(ai => ai.name === char.ai)?.id || "") : ""
          };
        }).filter(c => c.id);
        setMatches((prev) => prev.map((m) =>
          m.id === matchId
            ? { ...m, team1, team2 }
            : m
        ));
        setSuccess(`Imported match details for match ${matchId}`);
        setError("");
      } catch (e) {
        setError("Invalid YAML file: " + file.name);
        return;
      }
    }
  };
  const [characters, setCharacters] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [aiItems, setAiItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [collapsedMatches, setCollapsedMatches] = useState({});
  const [matchCounter, setMatchCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingMatchSetup, setPendingMatchSetup] = useState(null);
  const [pendingItemSetup, setPendingItemSetup] = useState(null);

  const matchFileRef = useRef(null);
  const itemFileRef = useRef(null);
  const importJsonRef = useRef(null);

  useEffect(() => {
    loadCSVFiles();
  }, []);

  const loadCSVFiles = async () => {
    try {
      await Promise.all([loadCharacters(), loadCapsules()]);
      setLoading(false);
    } catch (err) {
      setError("Error loading CSV files. Please upload them manually.");
      setLoading(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await fetch("characters.csv");
      const text = await response.text();
      const lines = text.split("\n");
      const chars = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [name, id] = line.split(",");
          if (name && id) {
            chars.push({
              name: name.replace(/"/g, "").trim(),
              id: id.replace(/"/g, "").trim(),
            });
          }
        }
      }
      setCharacters(chars);
    } catch (err) {
      console.error("Failed to load characters:", err);
    }
  };

  const loadCapsules = async () => {
    try {
      const response = await fetch("capsules.csv");
      const text = await response.text();
      const lines = text.split("\n");
      const caps = [];
      const costs = [];
      const ai = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(",");
          if (parts.length >= 3) {
            const item = {
              name: parts[0].replace(/"/g, "").trim(),
              id: parts[1].replace(/"/g, "").trim(),
              type: parts[2].replace(/"/g, "").trim(),
            };

            if (parts.length >= 4) {
              item.exclusiveFor = parts[3].replace(/"/g, "").trim();
            }

            if (item.type === "Capsule") caps.push(item);
            else if (item.type === "Costume") costs.push(item);
            else if (item.type === "AI") ai.push(item);
          }
        }
      }
      setCapsules(caps);
      setCostumes(costs);
      setAiItems(ai);
    } catch (err) {
      console.error("Failed to load capsules:", err);
    }
  };

  const addMatch = () => {
    const newMatch = {
      id: matchCounter,
      name: `Match ${matchCounter}`,
      team1: [],
      team2: [],
      team1Name: "Team 1",
      team2Name: "Team 2",
    };
    setMatches([...matches, newMatch]);
    setMatchCounter(matchCounter + 1);
  };

  const duplicateMatch = (matchId) => {
    const original = matches.find((m) => m.id === matchId);
    if (!original) return;

    const duplicated = {
      id: matchCounter,
      name: `${original.name} (Copy)`,
      team1Name: original.team1Name,
      team2Name: original.team2Name,
      team1: original.team1.map((char) => ({
        ...char,
        capsules: [...char.capsules],
      })),
      team2: original.team2.map((char) => ({
        ...char,
        capsules: [...char.capsules],
      })),
    };
    setMatches([...matches, duplicated]);
    setMatchCounter(matchCounter + 1);
  };

  const removeMatch = (matchId) => {
    setMatches(matches.filter((m) => m.id !== matchId));
  };

  const clearAllMatches = () => {
    if (window.confirm("Clear all matches?")) {
      setMatches([]);
      setMatchCounter(1);
    }
  };

  const addCharacter = (matchId, teamName) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          const team = match[teamName];
          if (team.length >= 5) {
            alert("Maximum 5 characters per team");
            return match;
          }
          return {
            ...match,
            [teamName]: [
              ...team,
              {
                name: "",
                id: "",
                capsules: Array(7).fill(""),
                costume: "",
                ai: "",
              },
            ],
          };
        }
        return match;
      })
    );
  };

  const removeCharacter = (matchId, teamName, index) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          return {
            ...match,
            [teamName]: match[teamName].filter((_, i) => i !== index),
          };
        }
        return match;
      })
    );
  };

  const updateCharacter = (matchId, teamName, index, field, value) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          const team = [...match[teamName]];
          team[index] = { ...team[index], [field]: value };

          if (field === "id") {
            const char = characters.find((c) => c.id === value);
            if (char) {
              team[index].name = char.name;
              team[index].costume = "";
            }
          }

          return { ...match, [teamName]: team };
        }
        return match;
      })
    );
  };

  const updateCapsule = (matchId, teamName, charIndex, capsuleIndex, value) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          const team = [...match[teamName]];
          team[charIndex].capsules[capsuleIndex] = value;
          return { ...match, [teamName]: team };
        }
        return match;
      })
    );
  };

  const exportMatches = () => {
    if (matches.length === 0) {
      alert("No matches to export");
      return;
    }

    const matchSetup = generateMatchSetup();
    const itemSetup = generateItemSetup();

    downloadFile("MatchSetup.json", JSON.stringify(matchSetup, null, 2));
    downloadFile("ItemSetup.json", JSON.stringify(itemSetup, null, 2));
    setSuccess("Exported MatchSetup.json and ItemSetup.json");
  };

  const generateMatchSetup = () => {
    const setup = { matchCount: {} };

    matches.forEach((match, index) => {
      setup.matchCount[index + 1] = {
        targetTeaming: {
          com1: {
            teamMembers: Array(5)
              .fill()
              .map((_, i) => ({
                key: match.team1[i]?.id || "None",
              })),
            comLevel: "High",
          },
          com2: {
            teamMembers: Array(5)
              .fill()
              .map((_, i) => ({
                key: match.team2[i]?.id || "None",
              })),
            comLevel: "High",
          },
          player: {
            teamMembers: Array(5)
              .fill()
              .map(() => ({ key: "None" })),
            comLevel: "Middle",
          },
          player2: {
            teamMembers: Array(5)
              .fill()
              .map(() => ({ key: "None" })),
            comLevel: "Middle",
          },
        },
      };
    });

    return setup;
  };

  const generateItemSetup = () => {
    const setup = { matchCount: {} };

    matches.forEach((match, index) => {
      setup.matchCount[index + 1] = { customize: {} };

      const allChars = [...match.team1, ...match.team2];
      const uniqueChars = {};

      allChars.forEach((char) => {
        if (char.id && char.id !== "") {
          uniqueChars[char.id] = char;
        }
      });

      Object.values(uniqueChars).forEach((char) => {
        const key = `(Key="${char.id}")`;
        const allItems = [];

        if (char.costume) allItems.push({ key: char.costume });
        allItems.push(
          ...char.capsules.filter((c) => c).map((c) => ({ key: c }))
        );
        if (char.ai) allItems.push({ key: char.ai });

        if (allItems.length === 0) allItems.push({ key: "None" });

        const inTeam1 = match.team1.some((t) => t.id === char.id);
        const inTeam2 = match.team2.some((t) => t.id === char.id);

        setup.matchCount[index + 1].customize[key] = {
          targetSettings: [
            { equipItems: [{ key: "None" }], sameCharacterEquip: [] },
            { equipItems: [{ key: "None" }], sameCharacterEquip: [] },
            {
              equipItems: inTeam1 ? allItems : [{ key: "None" }],
              sameCharacterEquip: [],
            },
            {
              equipItems: inTeam2 ? allItems : [{ key: "None" }],
              sameCharacterEquip: [],
            },
          ],
        };
      });
    });

    return setup;
  };

  const handleImportMatches = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    let matchSetup = null;
    let itemSetup = null;
    for (let file of files) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        if (json.matchCount) {
          // Heuristic: if customize keys exist, it's itemSetup
          const isItemSetup = Object.values(json.matchCount)[0]?.customize !== undefined;
          if (isItemSetup) itemSetup = json;
          else matchSetup = json;
        }
      } catch (e) {
        setError("Invalid JSON file: " + file.name);
        return;
      }
    }
    if (!matchSetup || !itemSetup) {
      setError("Both MatchSetup.json and ItemSetup.json are required.");
      return;
    }
    // Parse matches
    const newMatches = Object.entries(matchSetup.matchCount).map(([key, matchData], idx) => {
      const team1 = matchData.targetTeaming.com1.teamMembers
        .map((m) => ({
          id: m.key !== "None" ? m.key : "",
          name: "",
          capsules: Array(7).fill(""),
          costume: "",
          ai: "",
        }))
        .filter((char) => char.id !== "");
      const team2 = matchData.targetTeaming.com2.teamMembers
        .map((m) => ({
          id: m.key !== "None" ? m.key : "",
          name: "",
          capsules: Array(7).fill(""),
          costume: "",
          ai: "",
        }))
        .filter((char) => char.id !== "");
      return {
        id: idx + 1,
        name: `Match ${idx + 1}`,
        team1,
        team2,
        team1Name: "Team 1",
        team2Name: "Team 2",
      };
    });
    // Fill in items from itemSetup
    Object.entries(itemSetup.matchCount).forEach(([key, matchData], idx) => {
      const customize = matchData.customize;
      Object.entries(customize).forEach(([charKey, charData]) => {
        const charId = charKey.match(/Key="(.*?)"/)[1];
        // Find character in team1 or team2
        for (let team of [newMatches[idx].team1, newMatches[idx].team2]) {
          const char = team.find((c) => c.id === charId);
          if (char) {
            // Fill items
            const settings = charData.targetSettings[2].equipItems.concat(charData.targetSettings[3].equipItems);
            let capsules = [];
            let costume = "";
            let ai = "";
            settings.forEach((item) => {
              if (!item.key || item.key === "None") return;
              if (item.key.startsWith("COSTUME_")) costume = item.key;
              else if (item.key.startsWith("AI_")) ai = item.key;
              else capsules.push(item.key);
            });
            char.capsules = [...capsules, ...Array(7 - capsules.length).fill("")].slice(0, 7);
            char.costume = costume;
            char.ai = ai;
          }
        }
      });
    });
    setMatches(newMatches);
    setSuccess("Imported matches from JSON files.");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 p-4 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-orange-400 animate-pulse mx-auto mb-4" />
          <div className="text-white text-2xl font-bold tracking-wider">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl mb-6 border-2 border-orange-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-400/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 text-center mb-1 tracking-tight drop-shadow-lg">
              DRAGON BALL
            </h1>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 text-center mb-1 tracking-tight drop-shadow-lg">
              SPARKING! ZERO LEAGUE
            </h1>
            <p className="text-xl font-bold text-blue-300 text-center tracking-widest drop-shadow">
              MATCH BUILDER
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-600 border-2 border-red-700 text-white px-4 py-3 rounded-xl mb-4 font-semibold shadow-lg">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600 border-2 border-green-700 text-white px-4 py-3 rounded-xl mb-4 font-semibold shadow-lg">
            ✓ {success}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={addMatch}
            className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-orange-500"
          >
            <span className="flex items-center">
              <Plus className="mr-2" size={18} />
              ADD MATCH
            </span>
          </button>
          <button
            onClick={exportMatches}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-green-500"
          >
            <span className="flex items-center">
              <Download className="mr-2" size={18} />
              EXPORT ALL
            </span>
          </button>
          <button
            onClick={clearAllMatches}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-red-500"
          >
            <span className="flex items-center">
              <Trash2 className="mr-2" size={18} />
              CLEAR ALL
            </span>
          </button>
          <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-blue-500 cursor-pointer flex items-center">
            <Upload className="mr-2" size={18} />
            IMPORT MATCHES
            <input
              type="file"
              accept="application/json"
              multiple
              style={{ display: "none" }}
              onChange={handleImportMatches}
            />
          </label>
        </div>

        <div className="space-y-6">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              characters={characters}
              capsules={capsules}
              costumes={costumes}
              aiItems={aiItems}
              onDuplicate={() => duplicateMatch(match.id)}
              onRemove={() => removeMatch(match.id)}
              onAddCharacter={(teamName) => addCharacter(match.id, teamName)}
              onRemoveCharacter={(teamName, index) =>
                removeCharacter(match.id, teamName, index)
              }
              onUpdateCharacter={(teamName, index, field, value) =>
                updateCharacter(match.id, teamName, index, field, value)
              }
              onUpdateCapsule={(teamName, charIndex, capsuleIndex, value) =>
                updateCapsule(
                  match.id,
                  teamName,
                  charIndex,
                  capsuleIndex,
                  value
                )
              }
              collapsed={collapsedMatches[match.id] || false}
              onToggleCollapse={() => setCollapsedMatches((prev) => ({ ...prev, [match.id]: !prev[match.id] }))}
              exportSingleMatch={exportSingleMatch}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MatchCard = ({
  match,
  characters,
  capsules,
  costumes,
  aiItems,
  onDuplicate,
  onRemove,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
  onUpdateCapsule,
  collapsed,
  onToggleCollapse,
  exportSingleMatch,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl border-2 border-orange-400/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400"></div>
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded bg-slate-700 text-orange-300 border border-orange-400 hover:bg-orange-400 hover:text-slate-800 transition-all flex items-center justify-center"
            aria-label={collapsed ? `Expand Match` : `Collapse Match`}
            style={{ width: 28, height: 28 }}
          >
            {collapsed ? <Plus size={18} /> : <Minus size={18} />}
          </button>
          <input
            type="text"
            value={match.name}
            onChange={(e) => {}}
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-400 bg-transparent border-b-2 border-transparent hover:border-orange-400 focus:border-orange-400 outline-none px-2 py-1 rounded transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportSingleMatch(match)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg shadow-md hover:scale-105 transition-all border border-purple-500 flex items-center justify-center"
            aria-label="Download Match"
          >
            <Download size={18} />
          </button>
          <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-md hover:scale-105 transition-all border border-blue-500 cursor-pointer flex items-center justify-center"
            aria-label="Upload Match"
          >
            <Upload size={18} />
              <input
                type="file"
                accept=".yaml,application/x-yaml,text/yaml"
                multiple
                style={{ display: "none" }}
                onChange={(e) => importSingleMatch(e, match.id)}
              />
          </label>
          <button
            onClick={onDuplicate}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border border-green-500"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onRemove}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border border-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="grid grid-cols-2 gap-4">
          <TeamPanel
            teamName="team1"
            displayName={match.team1Name}
            team={match.team1}
            characters={characters}
            capsules={capsules}
            costumes={costumes}
            aiItems={aiItems}
            onAddCharacter={() => onAddCharacter("team1")}
            onRemoveCharacter={(index) => onRemoveCharacter("team1", index)}
            onUpdateCharacter={(index, field, value) =>
              onUpdateCharacter("team1", index, field, value)
            }
            onUpdateCapsule={(charIndex, capsuleIndex, value) =>
              onUpdateCapsule("team1", charIndex, capsuleIndex, value)
            }
            teamColor="blue"
          />
          <TeamPanel
            teamName="team2"
            displayName={match.team2Name}
            team={match.team2}
            characters={characters}
            capsules={capsules}
            costumes={costumes}
            aiItems={aiItems}
            onAddCharacter={() => onAddCharacter("team2")}
            onRemoveCharacter={(index) => onRemoveCharacter("team2", index)}
            onUpdateCharacter={(index, field, value) =>
              onUpdateCharacter("team2", index, field, value)
            }
            onUpdateCapsule={(charIndex, capsuleIndex, value) =>
              onUpdateCapsule("team2", charIndex, capsuleIndex, value)
            }
            teamColor="red"
          />
        </div>
      )}
    </div>
  );
}

const TeamPanel = ({
  displayName,
  team,
  characters,
  capsules,
  costumes,
  aiItems,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
  onUpdateCapsule,
  teamColor,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const colorClasses = teamColor === "blue"
    ? "from-slate-800 to-slate-700 border-slate-600"
    : "from-slate-800 to-slate-700 border-slate-600";
  const buttonColor = teamColor === "blue"
    ? "from-slate-700 to-slate-600 border-slate-500 hover:from-slate-600 hover:to-slate-500"
    : "from-slate-700 to-slate-600 border-slate-500 hover:from-slate-600 hover:to-slate-500";

  return (
    <div className={`bg-gradient-to-br ${colorClasses} rounded-xl p-4 shadow-lg border-2 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-orange-300 uppercase tracking-wide drop-shadow relative z-10">
          {displayName}
        </h3>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-2 p-1 rounded bg-slate-700 text-orange-300 border border-orange-400 hover:bg-orange-400 hover:text-slate-800 transition-all flex items-center justify-center z-20"
          aria-label={collapsed ? `Expand ${displayName}` : `Collapse ${displayName}`}
          style={{ width: 24, height: 24 }}
        >
          {collapsed ? <Plus size={16} /> : <Minus size={16} />}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="space-y-3 relative z-10">
            {team.map((char, index) => (
              <CharacterSlot
                key={index}
                character={char}
                characters={characters}
                capsules={capsules}
                costumes={costumes}
                aiItems={aiItems}
                onRemove={() => onRemoveCharacter(index)}
                onUpdate={(field, value) => onUpdateCharacter(index, field, value)}
                onUpdateCapsule={(capsuleIndex, value) =>
                  onUpdateCapsule(index, capsuleIndex, value)
                }
              />
            ))}
          </div>
          <button
            onClick={onAddCharacter}
            className={`w-full mt-4 bg-gradient-to-r ${buttonColor} text-white py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border-2 relative z-10`}
          >
            <Plus className="inline mr-1" size={16} />
            ADD CHARACTER
          </button>
        </>
      )}
    </div>
  );
};

const CharacterSlot = ({
  character,
  characters,
  capsules,
  costumes,
  aiItems,
  onRemove,
  onUpdate,
  onUpdateCapsule,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const charCostumes = costumes.filter(
    (c) => c.exclusiveFor === character.name
  );

  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-500 flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 space-y-2">
          <div>
            <label className="block text-xs font-semibold text-orange-300 mb-1 uppercase tracking-wide">
              Character
            </label>
            <select
              value={character.id}
              onChange={(e) => onUpdate("id", e.target.value)}
              className="w-full px-3 py-2 border border-slate-500 rounded text-xs font-medium bg-slate-800 text-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 transition-all"
            >
              <option value="">Select Character</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-wide">
              Costume
            </label>
            <select
              value={character.costume}
              onChange={(e) => onUpdate("costume", e.target.value)}
              className="w-full px-3 py-2 border border-slate-500 rounded text-xs font-medium bg-slate-800 text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
              disabled={!character.name}
            >
              <option value="">Default Costume</option>
              {charCostumes.map((costume) => (
                <option key={costume.id} value={costume.id}>
                  {costume.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded bg-slate-700 text-orange-300 border border-orange-400 hover:bg-orange-400 hover:text-slate-800 transition-all flex items-center justify-center"
            aria-label={collapsed ? `Expand Character` : `Collapse Character`}
            style={{ width: 24, height: 24 }}
          >
            {collapsed ? <Plus size={16} /> : <Minus size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-2 mt-3">
          <label className="block text-xs font-semibold text-cyan-300 mb-1 uppercase tracking-wide">
            Capsules
          </label>
          {character.capsules.map((capsule, i) => (
            <select
              key={i}
              value={capsule}
              onChange={(e) => onUpdateCapsule(i, e.target.value)}
              className="w-full px-2 py-1 border border-slate-500 rounded text-xs font-medium bg-slate-800 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
            >
              <option value="">Capsule {i + 1}</option>
              {capsules.map((cap) => (
                <option key={cap.id} value={cap.id}>
                  {cap.name}
                </option>
              ))}
            </select>
          ))}

          <div className="mt-2 pt-2 border-t border-slate-500">
            <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wide">
              AI Strategy
            </label>
            <select
              value={character.ai}
              onChange={(e) => onUpdate("ai", e.target.value)}
              className="w-full px-2 py-1 border border-slate-500 rounded text-xs font-medium bg-slate-800 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
            >
              <option value="">Select AI Strategy</option>
              {aiItems.map((ai) => (
                <option key={ai.id} value={ai.id}>
                  {ai.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onRemove}
              className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm shadow hover:scale-105 transition-all border border-red-400 inline-block"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchBuilder;