import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Copy, Download, Upload, X, Sparkles, Minus } from "lucide-react";


const MatchBuilder = () => {
  const [characters, setCharacters] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [aiItems, setAiItems] = useState([]);
  const [matches, setMatches] = useState([]);
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

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl border-2 border-orange-400/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400"></div>
      
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-600">
        <input
          type="text"
          value={match.name}
          onChange={(e) => {}}
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-400 bg-transparent border-b-2 border-transparent hover:border-orange-400 focus:border-orange-400 outline-none px-2 py-1 rounded transition-all"
        />
        <div className="flex gap-2">
          <button
            onClick={onDuplicate}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border border-green-500"
          >
            <Copy size={16} className="inline mr-1" />
            DUPLICATE
          </button>
          <button
            onClick={onRemove}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border border-red-500"
          >
            <Trash2 size={16} className="inline mr-1" />
            REMOVE
          </button>
        </div>
      </div>

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
    </div>
  );
};

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

          <button
            onClick={onRemove}
            className="w-full mt-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm shadow hover:scale-105 transition-all border border-red-400"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchBuilder;